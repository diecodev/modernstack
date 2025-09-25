import base64
import asyncio
from beanie import PydanticObjectId
from beanie.operators import And
from fastapi import Request
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from langchain_core.output_parsers import PydanticOutputParser
from qstash.message import FlowControl
from modules.statements.exceptions import (
    StatementNotFoundException,
    TransactionNotFoundException,
)
from modules.statements.models import Statement
from modules.statements.schemas import (
    StatementAiProcessing,
    StatementUpdate,
    TransactionCreate,
)
from modules.statements.constant import (
    STATEMENT_PROCESSING_SYSTEM_PROMPT,
    STATEMENT_PROCESSING_HUMAN_PROMPT,
    TRANSACTION_EMBEDDING_PROMPT,
)
from modules.statements.llms import (
    statement_processing_model,
    transaction_embedding_model,
)
from modules.statements.enums import StatementStatus
import json
from db import redis
from settings import settings
from typing import Optional
from modules.projects.models import Project
from modules.statements.schemas import TransactionAiProcessing, TransactionEmbedding
from modules.statements.models import Transaction
from typing import List
from modules.statements.llms import embeddings
from db import qstash
from datetime import datetime, timezone
from modules.statements.enums import TransactionType
import re


class StatementService:
    async def create_statement_in_db(
        self,
        name: str,
        status: StatementStatus,
        project: Project,
        error: Optional[str] = None,
    ) -> Statement:
        new_statement = Statement(
            name=name,
            status=status.value,
            project=project,
        )
        await new_statement.create()
        if status == StatementStatus.FAILED:
            await redis.rpush(
                f"statement_processing:{str(new_statement.id)}",
                json.dumps({"status": StatementStatus.FAILED.value}),
                error=error,
            )
            redis.expire(
                f"statement_processing:{str(new_statement.id)}",
                settings.redis_key_ttl_seconds,
            )
        return new_statement

    async def _create_transactions_in_db(
        self,
        statement: Statement,
        transactions: List[TransactionAiProcessing],
    ) -> None:
        for transaction in transactions:
            transaction_embedding_prompt = ChatPromptTemplate.from_template(
                TRANSACTION_EMBEDDING_PROMPT
            )
            transaction_embedding_chain = (
                transaction_embedding_prompt
                | transaction_embedding_model
                | PydanticOutputParser(pydantic_object=TransactionEmbedding)
            )

            tx_type_raw = transaction.transaction_type
            if isinstance(tx_type_raw, TransactionType):
                is_expense = tx_type_raw == TransactionType.EXPENSE
            else:
                tx_str = str(tx_type_raw).lower()
                is_expense = tx_str in ("expense", "transactiontype.expense")
            tx_type_es = "gasto" if is_expense else "ingreso"

            transaction_description = await transaction_embedding_chain.ainvoke(
                {
                    "tx_type": tx_type_es,
                    "amount": transaction.transaction_value,
                    "description": transaction.description,
                }
            )
            embedding = embeddings.embed_query(transaction_description.description)
            new_transaction = Transaction(
                statement=statement,
                **transaction.model_dump(),
                embedding=embedding,
            )
            await new_transaction.create()

    async def _ai_statement_processing(
        self, file_content: bytes
    ) -> StatementAiProcessing:
        statement_processing_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", STATEMENT_PROCESSING_SYSTEM_PROMPT),
                (
                    "human",
                    [
                        {"type": "text", "text": STATEMENT_PROCESSING_HUMAN_PROMPT},
                        {
                            "type": "media",
                            "mime_type": "application/pdf",
                            "data": "{file}",
                        },
                    ],
                ),
            ]
        )
        statement_processing_chain = (
            RunnableLambda(lambda x: {"file": base64.b64encode(x).decode("utf-8")})
            | statement_processing_prompt
            | statement_processing_model
            | PydanticOutputParser(pydantic_object=StatementAiProcessing)
        )
        return await statement_processing_chain.ainvoke(file_content)

    async def create(
        self,
        statement: Statement,
        file_content: bytes,
    ) -> tuple[StatementStatus, Optional[float], Optional[float]]:
        try:
            key = f"statement_processing:{str(statement.id)}"
            await redis.rpush(
                key, json.dumps({"status": StatementStatus.PROCESSING.value})
            )
            await redis.expire(key, settings.redis_key_ttl_seconds)
            statement_ai_processing = await self._ai_statement_processing(file_content)
            await self._create_transactions_in_db(
                statement=statement,
                transactions=statement_ai_processing.transactions,
            )
            await redis.rpush(
                key, json.dumps({"status": StatementStatus.COMPLETED.value})
            )
            await redis.expire(key, settings.redis_key_ttl_seconds)
            return (
                StatementStatus.COMPLETED,
                statement_ai_processing.current_balance,
                statement_ai_processing.previous_balance,
            )
        except ValueError as e:
            await redis.rpush(
                key,
                json.dumps(
                    {
                        "status": StatementStatus.FAILED.value,
                        "error": "Invalid statement data",
                    }
                ),
            )
            await redis.expire(key, settings.redis_key_ttl_seconds)
            print(e)
            return StatementStatus.FAILED, None, None
        except Exception as e:
            await redis.rpush(
                key,
                json.dumps({"status": StatementStatus.FAILED.value, "error": str(e)}),
            )
            await redis.expire(key, settings.redis_key_ttl_seconds)
            return StatementStatus.FAILED, None, None

    async def get_by_id(
        self, statement_id: PydanticObjectId, project_id: PydanticObjectId
    ) -> Statement:
        statement = await Statement.find_one(
            And(
                Statement.id == statement_id,
                Statement.project.id == project_id,
            )
        )
        if not statement:
            raise StatementNotFoundException
        return statement

    async def list_paginated(
        self,
        project_id: PydanticObjectId,
        limit: int = 10,
        offset: int = 0,
        search: Optional[str] = None,
        status: Optional[StatementStatus] = None,
    ) -> tuple[List[Statement], int]:
        filters = [Statement.project.id == project_id]
        if search:
            pattern = re.compile(re.escape(search), re.IGNORECASE)
            filters.append(Statement.name == pattern)
        if status:
            filters.append(Statement.status == status.value)

        query = Statement.find(And(*filters))
        total = await query.count()
        statements = (
            await query.sort(-Statement.created_at).skip(offset).limit(limit).to_list()
        )
        return statements, total

    async def list_transactions_paginated(
        self,
        statement_id: PydanticObjectId,
        project_id: PydanticObjectId,
        limit: int = 10,
        offset: int = 0,
        search: Optional[str] = None,
    ) -> tuple[List[Transaction], int]:
        statement = await self.get_by_id(
            statement_id=statement_id, project_id=project_id
        )

        filters = [Transaction.statement.id == statement.id]
        if search:
            pattern = re.compile(re.escape(search), re.IGNORECASE)
            filters.append(Transaction.description == pattern)

        tx_query = Transaction.find(And(*filters))
        total = await tx_query.count()
        transactions = (
            await tx_query.sort(-Transaction.date).skip(offset).limit(limit).to_list()
        )
        return transactions, total

    async def get_transaction_by_id(
        self,
        transaction_id: PydanticObjectId,
        project_id: PydanticObjectId,
    ) -> Transaction:
        transaction = await Transaction.get(transaction_id)
        if not transaction:
            raise TransactionNotFoundException
        await self.get_by_id(
            statement_id=transaction.statement.id, project_id=project_id
        )
        return transaction

    async def create_transaction(
        self,
        statement_id: PydanticObjectId,
        project_id: PydanticObjectId,
        data: TransactionCreate,
    ) -> Transaction:
        statement = await self.get_by_id(
            statement_id=statement_id, project_id=project_id
        )
        transaction_embedding_prompt = ChatPromptTemplate.from_template(
            TRANSACTION_EMBEDDING_PROMPT
        )
        transaction_embedding_chain = (
            transaction_embedding_prompt
            | transaction_embedding_model
            | PydanticOutputParser(pydantic_object=TransactionEmbedding)
        )

        tx_type_raw = data.transaction_type
        if isinstance(tx_type_raw, TransactionType):
            is_expense = tx_type_raw == TransactionType.EXPENSE
        else:
            tx_str = str(tx_type_raw).lower()
            is_expense = tx_str in ("expense", "transactiontype.expense")
        tx_type_es = "gasto" if is_expense else "ingreso"

        transaction_description = await transaction_embedding_chain.ainvoke(
            {
                "tx_type": tx_type_es,
                "amount": data.transaction_value,
                "description": data.description,
            }
        )
        embedding = embeddings.embed_query(transaction_description.description)
        new_transaction = Transaction(
            statement=statement,
            **data.model_dump(),
            embedding=embedding,
        )
        await new_transaction.create()
        return new_transaction

    async def update_transaction(
        self,
        transaction_id: PydanticObjectId,
        project_id: PydanticObjectId,
        data: dict,
    ) -> Transaction:
        transaction = await self.get_transaction_by_id(
            transaction_id=transaction_id, project_id=project_id
        )
        update_data = {getattr(Transaction, k): v for k, v in data.items()}
        update_data[Transaction.updated_at] = datetime.now(timezone.utc)
        await Transaction.find_one(Transaction.id == transaction.id).set(update_data)
        return await self.get_transaction_by_id(
            transaction_id=transaction_id, project_id=project_id
        )

    async def delete_transaction(
        self,
        transaction_id: PydanticObjectId,
        project_id: PydanticObjectId,
    ) -> None:
        transaction = await self.get_transaction_by_id(
            transaction_id=transaction_id, project_id=project_id
        )
        await transaction.delete()

    async def update(
        self,
        id: PydanticObjectId,
        project_id: PydanticObjectId,
        statement_update: StatementUpdate,
    ) -> Statement:
        update_values = statement_update.model_dump(exclude_none=True)
        update_data = {
            getattr(Statement, key): value for key, value in update_values.items()
        }
        update_data[Statement.updated_at] = datetime.now(timezone.utc)

        await Statement.find_one(
            And(
                Statement.id == id,
                Statement.project.id == project_id,
            )
        ).set(update_data)

        return await self.get_by_id(statement_id=id, project_id=project_id)

    async def send_statement_to_queue(
        self,
        statement: Statement,
        request: Request,
        project_id: str,
        organization_id: str,
        user_id: str,
    ) -> None:
        host = request.headers.get("host")
        url = f"{'http' if host.startswith('localhost') else 'https'}://{host}/projects/{project_id}/statements/{statement.id}"
        await qstash.message.publish_json(
            url=url,
            method="POST",
            body={},
            headers={
                "Content-Type": "application/json",
                "X-Api-Key": settings.api_key,
                "X-Organization-Id": organization_id,
            },
            flow_control=FlowControl(parallelism=3, user_id=user_id),
        )

    async def status_event(self, statement_id: str, request: Request):
        key = f"statement_processing:{statement_id}"

        while not await request.is_disconnected():
            try:
                data = await redis.blpop(
                    key,
                )
                if data:
                    _, message = data
                    yield json.loads(message)
                await asyncio.sleep(1)
            except asyncio.CancelledError:
                break

    async def delete(
        self,
        statement_id: PydanticObjectId,
        project_id: PydanticObjectId,
    ) -> None:
        statement = await self.get_by_id(
            statement_id=statement_id, project_id=project_id
        )
        await Transaction.find(Transaction.statement.id == statement.id).delete()
        await statement.delete()

    async def delete_all(
        self,
        project_id: PydanticObjectId,
    ) -> None:
        await Transaction.find(Transaction.statement.project.id == project_id).delete()
        await Statement.find(Statement.project.id == project_id).delete()
