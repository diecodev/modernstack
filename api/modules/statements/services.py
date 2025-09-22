import base64
import asyncio
from beanie import PydanticObjectId
from beanie.operators import And
from fastapi import Request
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from langchain_core.output_parsers import PydanticOutputParser
from qstash.message import FlowControl
from modules.statements.exceptions import StatementNotFoundException
from modules.statements.models import Statement
from modules.statements.schemas import StatementAiProcessing, StatementUpdate
from modules.statements.constant import (
    STATEMENT_PROCESSING_SYSTEM_PROMPT,
    STATEMENT_PROCESSING_HUMAN_PROMPT,
)
from modules.statements.llms import statement_processing_model
from modules.statements.enums import StatementStatus
import json
from db import redis
from settings import settings
from typing import Optional
from modules.projects.models import Project
from modules.statements.schemas import TransactionAiProcessing
from modules.statements.models import Transaction
from typing import List
from modules.statements.llms import embeddings
from db import qstash
from datetime import datetime, timezone


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
            embedding = embeddings.embed_query(transaction.description)
            new_transaction = Transaction(
                statement=statement, **transaction.model_dump(), embedding=embedding
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
    ) -> StatementStatus:
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
            return StatementStatus.COMPLETED
        except ValueError:
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
            return StatementStatus.FAILED
        except Exception as e:
            await redis.rpush(
                key,
                json.dumps({"status": StatementStatus.FAILED.value, "error": str(e)}),
            )
            await redis.expire(key, settings.redis_key_ttl_seconds)
            return StatementStatus.FAILED

    async def get_by_id(
        self, statement_id: PydanticObjectId, project_id: PydanticObjectId
    ) -> Statement:
        statement = await Statement.find_one(
            And(
                Statement.id == statement_id,
                Statement.project.id == project_id,
            ),
            fetch_links=True,
        )
        if not statement:
            raise StatementNotFoundException
        return statement

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
    ) -> None:
        url = f"{request.url.scheme}://{request.headers.get('host')}/api/projects/{project_id}/statements/{statement.id}"
        await qstash.message.publish_json(
            url=url,
            method="POST",
            body={},
            headers={
                "Content-Type": "application/json",
                "X-Api-Key": settings.api_key,
                "X-Organization-Id": organization_id,
            },
            flow_control=FlowControl(parallelism=3),
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
