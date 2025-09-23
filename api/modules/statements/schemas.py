from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from beanie import PydanticObjectId
from datetime import datetime
from modules.statements.enums import StatementStatus, TransactionType


class TransactionResponse(BaseModel):
    id: PydanticObjectId
    transaction_value: float
    description: str
    date: datetime
    transaction_type: TransactionType
    balance_after_transaction: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class TransactionCreate(BaseModel):
    transaction_value: float
    description: str
    date: datetime
    transaction_type: TransactionType
    balance_after_transaction: Optional[float] = None


class TransactionUpdate(BaseModel):
    transaction_value: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    transaction_type: Optional[TransactionType] = None
    balance_after_transaction: Optional[float] = None


class StatementCreate(BaseModel):
    id: PydanticObjectId
    name: str


class TransactionAiProcessing(BaseModel):
    transaction_value: float
    description: str
    date: datetime
    transaction_type: TransactionType
    balance_after_transaction: Optional[float] = None


class StatementAiProcessing(BaseModel):
    current_balance: Optional[float] = None
    previous_balance: Optional[float] = None
    transactions: List[TransactionAiProcessing]

    @field_validator("transactions", mode="before")
    @classmethod
    def filter_invalid_transactions(cls, value):
        if value is None:
            return []
        if isinstance(value, list):
            filtered: List[object] = []
            for item in value:
                if isinstance(item, TransactionAiProcessing):
                    filtered.append(item)
                    continue
                if not isinstance(item, dict):
                    continue
                if not item:
                    continue
                required_keys = [
                    "transaction_value",
                    "description",
                    "date",
                    "transaction_type",
                ]
                if all(k in item and item[k] not in (None, "") for k in required_keys):
                    filtered.append(item)
            return filtered
        return value


class StatementResponse(BaseModel):
    id: PydanticObjectId
    name: str
    status: StatementStatus
    current_balance: Optional[float]
    previous_balance: Optional[float]
    created_at: datetime
    updated_at: datetime


class StatementWithTransactionsResponse(StatementResponse):
    id: PydanticObjectId
    name: str
    status: StatementStatus
    current_balance: Optional[float]
    previous_balance: Optional[float]
    transactions: Optional[List[TransactionResponse]] = Field(default=[])
    created_at: datetime
    updated_at: datetime


class StatementUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[StatementStatus] = None
    current_balance: Optional[float] = None
    previous_balance: Optional[float] = None


class TransactionEmbedding(BaseModel):
    description: str


class TransactionsPaginatedResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int


class StatementsPaginatedResponse(BaseModel):
    statements: List[StatementResponse]
    total: int
