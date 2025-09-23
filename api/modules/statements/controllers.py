from beanie import PydanticObjectId
from fastapi import (
    APIRouter,
    UploadFile,
    HTTPException,
    status,
    Request,
)
from fastapi.responses import StreamingResponse
from dependencies import ServiceDep
from dependencies import OrganizationIdDep
from modules.projects.exceptions import ProjectNotFoundException
from modules.statements.enums import StatementStatus
from modules.statements.exceptions import StatementNotFoundException
from modules.statements.schemas import (
    StatementResponse,
    StatementUpdate,
    StatementsPaginatedResponse,
    TransactionsPaginatedResponse,
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
)
from fastapi import Query
from modules.statements.exceptions import TransactionNotFoundException

statements_router = APIRouter(prefix="/projects/{project_id}/statements")


@statements_router.post("")
async def upload_statement(
    services: ServiceDep,
    project_id: PydanticObjectId,
    organization_id: OrganizationIdDep,
    files: list[UploadFile],
    request: Request,
) -> dict:
    try:
        if len(files) > 12:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At most 12 files are allowed",
            )
        project = await services.projects.get_by_id(
            project_id, organization_id=organization_id
        )

        for file in files:
            if file.content_type != "application/pdf":
                await services.statements.create_statement_in_db(
                    name=file.filename,
                    status=StatementStatus.FAILED,
                    project=project,
                    error="Only PDF files are allowed",
                )
                continue
            if file.size > 10 * 1024 * 1024:
                await services.statements.create_statement_in_db(
                    name=file.filename,
                    status=StatementStatus.FAILED,
                    project=project,
                    error="File size must be less than 10MB",
                )
                continue
            statement = await services.statements.create_statement_in_db(
                name=file.filename,
                status=StatementStatus.PENDING,
                project=project,
            )
            await services.files.upload_file(
                file=file,
                organization_id=organization_id,
                project_id=project_id,
                statement_id=statement.id,
            )
            await services.statements.send_statement_to_queue(
                statement=statement,
                request=request,
                project_id=project_id,
                organization_id=organization_id,
            )
            return {"status": "success", "message": "Statements uploaded"}
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )


@statements_router.get("/{statement_id}")
async def get_statement(
    statement_id: PydanticObjectId,
    services: ServiceDep,
    project_id: PydanticObjectId,
    organization_id: OrganizationIdDep,
) -> StatementResponse:
    try:
        project = await services.projects.get_by_id(
            project_id, organization_id=organization_id
        )
        return await services.statements.get_by_id(statement_id, project_id=project.id)
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    except StatementNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Statement not found"
        )


@statements_router.get("")
async def list_statements(
    services: ServiceDep,
    project_id: PydanticObjectId,
    organization_id: OrganizationIdDep,
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    search: str | None = Query(default=None),
) -> StatementsPaginatedResponse:
    try:
        project = await services.projects.get_by_id(
            project_id, organization_id=organization_id
        )
        statements, total = await services.statements.list_paginated(
            project_id=project.id, limit=limit, offset=offset, search=search
        )
        return {"statements": statements, "total": total}
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )


@statements_router.get("/{statement_id}/transactions")
async def list_statement_transactions(
    statement_id: PydanticObjectId,
    services: ServiceDep,
    project_id: PydanticObjectId,
    organization_id: OrganizationIdDep,
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    search: str | None = Query(default=None),
) -> TransactionsPaginatedResponse:
    try:
        project = await services.projects.get_by_id(
            project_id, organization_id=organization_id
        )
        transactions, total = await services.statements.list_transactions_paginated(
            statement_id=statement_id,
            project_id=project.id,
            limit=limit,
            offset=offset,
            search=search,
        )
        return {"transactions": transactions, "total": total}
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    except StatementNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Statement not found"
        )


@statements_router.get("/{statement_id}/transactions/{transaction_id}")
async def get_transaction(
    statement_id: PydanticObjectId,
    transaction_id: PydanticObjectId,
    services: ServiceDep,
    project_id: PydanticObjectId,
    organization_id: OrganizationIdDep,
) -> TransactionResponse:
    try:
        project = await services.projects.get_by_id(
            project_id, organization_id=organization_id
        )
        # Valida statement y ownership a través del servicio
        await services.statements.get_by_id(statement_id, project_id=project.id)
        return await services.statements.get_transaction_by_id(
            transaction_id=transaction_id, project_id=project.id
        )
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    except StatementNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Statement not found"
        )
    except TransactionNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
        )


@statements_router.post("/{statement_id}/transactions")
async def create_transaction(
    statement_id: PydanticObjectId,
    services: ServiceDep,
    project_id: PydanticObjectId,
    organization_id: OrganizationIdDep,
    body: TransactionCreate,
) -> TransactionResponse:
    try:
        project = await services.projects.get_by_id(
            project_id, organization_id=organization_id
        )
        return await services.statements.create_transaction(
            statement_id=statement_id, project_id=project.id, data=body
        )
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    except StatementNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Statement not found"
        )


@statements_router.put("/{statement_id}/transactions/{transaction_id}")
async def update_transaction(
    statement_id: PydanticObjectId,
    transaction_id: PydanticObjectId,
    services: ServiceDep,
    project_id: PydanticObjectId,
    organization_id: OrganizationIdDep,
    body: TransactionUpdate,
) -> TransactionResponse:
    try:
        project = await services.projects.get_by_id(
            project_id, organization_id=organization_id
        )
        await services.statements.get_by_id(statement_id, project_id=project.id)
        return await services.statements.update_transaction(
            transaction_id=transaction_id,
            project_id=project.id,
            data=body.model_dump(exclude_none=True),
        )
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    except StatementNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Statement not found"
        )
    except TransactionNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
        )


@statements_router.delete("/{statement_id}/transactions/{transaction_id}")
async def delete_transaction(
    statement_id: PydanticObjectId,
    transaction_id: PydanticObjectId,
    services: ServiceDep,
    project_id: PydanticObjectId,
    organization_id: OrganizationIdDep,
) -> dict:
    try:
        project = await services.projects.get_by_id(
            project_id, organization_id=organization_id
        )
        await services.statements.get_by_id(statement_id, project_id=project.id)
        await services.statements.delete_transaction(
            transaction_id=transaction_id, project_id=project.id
        )
        return {"status": "success"}
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    except StatementNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Statement not found"
        )
    except TransactionNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
        )


@statements_router.post("/{statement_id}")
async def create_statement(
    statement_id: PydanticObjectId,
    services: ServiceDep,
    project_id: PydanticObjectId,
    organization_id: OrganizationIdDep,
) -> dict:
    try:
        project = await services.projects.get_by_id(
            project_id, organization_id=organization_id
        )
        statement = await services.statements.get_by_id(
            statement_id, project_id=project.id
        )
        file_content = await services.files.get_file(
            organization_id=organization_id,
            project_id=project_id,
            statement_id=statement.id,
        )
        await services.statements.update(
            id=statement.id,
            project_id=project.id,
            statement_update=StatementUpdate(
                status=StatementStatus.PROCESSING,
            ),
        )
        status, current_balance, previous_balance = await services.statements.create(
            statement=statement, file_content=file_content
        )
        if status == StatementStatus.FAILED:
            await services.statements.update(
                id=statement.id,
                project_id=project.id,
                statement_update=StatementUpdate(
                    status=StatementStatus.FAILED,
                ),
            )
            await services.files.delete_file(
                organization_id=organization_id,
                project_id=project_id,
                statement_id=statement.id,
            )
            return {"status": "error", "message": "Statement failed"}
        await services.statements.update(
            id=statement.id,
            project_id=project.id,
            statement_update=StatementUpdate(
                status=StatementStatus.COMPLETED,
                current_balance=current_balance,
                previous_balance=previous_balance,
            ),
        )
        return {"status": "success", "message": "Statement created"}
    except ProjectNotFoundException:
        return {"status": "error", "message": "Project not found"}
    except StatementNotFoundException:
        return {"status": "error", "message": "Statement not found"}


@statements_router.get("/{statement_id}/events/status")
async def get_statement_status_event(
    statement_id: PydanticObjectId,
    services: ServiceDep,
    project_id: PydanticObjectId,
    organization_id: OrganizationIdDep,
    request: Request,
) -> StreamingResponse:
    try:
        project = await services.projects.get_by_id(
            project_id, organization_id=organization_id
        )
        statement = await services.statements.get_by_id(
            statement_id, project_id=project.id
        )
        return StreamingResponse(
            services.statements.status_event(statement.id, request),
            media_type="text/event-stream",
        )
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    except StatementNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Statement not found"
        )


@statements_router.put("/{statement_id}")
async def update_statement(
    statement_id: PydanticObjectId,
    services: ServiceDep,
    project_id: PydanticObjectId,
    organization_id: OrganizationIdDep,
    statement_update: StatementUpdate,
) -> dict:
    try:
        project = await services.projects.get_by_id(
            project_id, organization_id=organization_id
        )
        return await services.statements.update(
            id=statement_id, project_id=project.id, statement_update=statement_update
        )
    except StatementNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Statement not found"
        )
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )


@statements_router.delete("/{statement_id}")
async def delete_statement(
    statement_id: PydanticObjectId,
    services: ServiceDep,
    project_id: PydanticObjectId,
    organization_id: OrganizationIdDep,
) -> dict:
    try:
        project = await services.projects.get_by_id(
            project_id, organization_id=organization_id
        )
        await services.files.delete_file(
            organization_id=organization_id,
            project_id=str(project.id),
            statement_id=str(statement_id),
        )
        await services.statements.delete(
            statement_id=statement_id,
            project_id=project.id,
        )
        return {"status": "success"}
    except StatementNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Statement not found"
        )
    except ProjectNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
