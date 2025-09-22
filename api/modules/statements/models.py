from typing import Optional, List
from beanie import BackLink, Document, Link
from pydantic import Field
from datetime import datetime, timezone


class Transaction(Document):
    statement: Link["Statement"]
    transaction_value: float
    description: str
    date: datetime
    transaction_type: str
    balance_after_transaction: Optional[float] = None
    embedding: List[float]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "transactions"


class Statement(Document):
    name: str
    status: str
    current_balance: Optional[float] = None
    previous_balance: Optional[float] = None
    project: Link["Project"]  # noqa: F821  # pyright: ignore[reportUndefinedVariable]
    transactions: Optional[List[BackLink[Transaction]]] = Field(
        default=None,
        exclude=True,
        json_schema_extra={"original_field": "statement"},
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "statements"
