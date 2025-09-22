from typing import List, Optional
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from datetime import datetime
from modules.statements.enums import StatementStatus, TransactionType


class TransactionResponse(BaseModel):
    id: PydanticObjectId
    transaction_value: float
    description: str
    date: datetime
    transaction_type: TransactionType
    created_at: datetime
    updated_at: datetime


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
