from fastapi import HTTPException, status, Header, Depends
from fastapi.security import APIKeyHeader
from settings import settings
from typing import Annotated
from modules.projects.services import ProjectService
from modules.statements.services import StatementService
from modules.files.services import FileService


api_key_header = APIKeyHeader(name="X-Api-Key", auto_error=False)


async def get_organization_id(
    organization_id: str = Header(
        ..., description="Organization ID", alias="X-Organization-Id"
    ),
) -> str:
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID is required",
        )
    return organization_id


OrganizationIdDep = Annotated[str, Depends(get_organization_id)]


async def get_api_key(api_key: str = Depends(api_key_header)) -> str:
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API Key is required",
        )
    elif api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )
    return api_key


class Services:
    def __init__(self) -> None:
        self.projects = ProjectService()
        self.statements = StatementService()
        self.files = FileService()


def get_services() -> "Services":
    return Services()


ServiceDep = Annotated[Services, Depends(get_services)]
