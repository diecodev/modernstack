from typing import Annotated, List, Optional
from pydantic import AfterValidator, BaseModel, Field
from beanie import PydanticObjectId
from datetime import datetime
from modules.statements.schemas import StatementResponse


class ProjectCreate(BaseModel):
    name: Annotated[
        str,
        Field(min_length=1, max_length=255),
        AfterValidator(lambda v: v.strip()),
    ]
    color: str


class ProjectResponse(BaseModel):
    id: PydanticObjectId
    name: str
    color: str
    created_at: datetime
    updated_at: datetime


class ProjectWithStatementsResponse(ProjectResponse):
    id: PydanticObjectId
    name: str
    color: str
    statements: Optional[List[StatementResponse]] = Field(default=[])
    created_at: datetime
    updated_at: datetime


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
