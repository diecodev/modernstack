from beanie import BackLink, Document, Indexed
from pymongo import IndexModel

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Annotated, List, Optional

from pydantic import Field

if TYPE_CHECKING:
    from modules.statements.models import Statement


class Project(Document):
    name: str
    organization_id: Annotated[str, Indexed()]
    color: str
    statements: Optional[List[BackLink["Statement"]]] = Field(  # noqa: F821  # pyright: ignore[reportUndefinedVariable]
        default=None,
        exclude=True,
        json_schema_extra={"original_field": "project"},
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "projects"
        indexes = [
            IndexModel(
                [("organization_id", 1), ("name", 1)],
                unique=True,
                collation={"locale": "en", "strength": 2},
            )
        ]
