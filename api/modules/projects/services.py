from datetime import datetime, timezone
from typing import List

from beanie import PydanticObjectId
from beanie.operators import And
from pymongo.errors import DuplicateKeyError
from modules.projects.exceptions import (
    ProjectAlreadyExistsException,
    ProjectNotFoundException,
)
from modules.projects.models import Project
from modules.projects.schemas import ProjectCreate, ProjectUpdate


class ProjectService:
    async def create(self, project: ProjectCreate, organization_id: str) -> Project:
        try:
            new_project = Project(
                organization_id=organization_id, **project.model_dump()
            )
            await new_project.create()
            return new_project
        except DuplicateKeyError:
            raise ProjectAlreadyExistsException

    async def get_all(self, organization_id: str) -> List[Project]:
        return await Project.find(Project.organization_id == organization_id).to_list()

    async def get_by_id(self, id: PydanticObjectId, organization_id: str) -> Project:
        project = await Project.find_one(
            And(Project.id == id, Project.organization_id == organization_id),
            fetch_links=True,
        )
        if not project:
            raise ProjectNotFoundException
        return project

    async def update(
        self,
        id: PydanticObjectId,
        organization_id: str,
        project_update: ProjectUpdate,
    ) -> Project:
        try:
            update_values = project_update.model_dump(exclude_none=True)
            update_data = {
                getattr(Project, key): value for key, value in update_values.items()
            }
            update_data[Project.updated_at] = datetime.now(timezone.utc)

            await Project.find_one(
                And(
                    Project.id == id,
                    Project.organization_id == organization_id,
                )
            ).set(update_data)

            return await self.get_by_id(id=id, organization_id=organization_id)
        except DuplicateKeyError:
            raise ProjectAlreadyExistsException

    async def delete(self, id: PydanticObjectId, organization_id: str) -> None:
        project = await self.get_by_id(id=id, organization_id=organization_id)
        await project.delete()
