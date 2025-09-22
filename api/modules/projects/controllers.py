from typing import List
from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, status
from modules.projects.schemas import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    ProjectWithStatementsResponse,
)
from modules.projects.exceptions import (
    ProjectAlreadyExistsException,
    ProjectNotFoundException,
)
from dependencies import ServiceDep, OrganizationIdDep

projects_router = APIRouter(prefix="/projects")


@projects_router.post("/")
async def create_project(
    project: ProjectCreate, services: ServiceDep, organization_id: OrganizationIdDep
) -> ProjectResponse:
    try:
        return await services.projects.create(
            project=project, organization_id=organization_id
        )
    except ProjectAlreadyExistsException:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Project already exists"
        )


@projects_router.get("/")
async def get_projects(
    organization_id: OrganizationIdDep, services: ServiceDep
) -> List[ProjectResponse]:
    return await services.projects.get_all(organization_id=organization_id)


@projects_router.get("/{project_id}")
async def get_project(
    project_id: PydanticObjectId,
    services: ServiceDep,
    organization_id: OrganizationIdDep,
) -> ProjectWithStatementsResponse:
    try:
        return await services.projects.get_by_id(
            id=project_id, organization_id=organization_id
        )
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )


@projects_router.put("/{project_id}")
async def update_project(
    project_id: PydanticObjectId,
    project: ProjectUpdate,
    services: ServiceDep,
    organization_id: OrganizationIdDep,
) -> ProjectResponse:
    try:
        return await services.projects.update(
            id=project_id,
            organization_id=organization_id,
            project_update=project,
        )
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    except ProjectAlreadyExistsException:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Project already exists"
        )


@projects_router.delete("/{project_id}")
async def delete_project(
    project_id: PydanticObjectId,
    services: ServiceDep,
    organization_id: OrganizationIdDep,
):
    try:
        return await services.projects.delete(
            id=project_id, organization_id=organization_id
        )
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
