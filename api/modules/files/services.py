from fastapi import UploadFile
from db import s3
from settings import settings


class FileService:
    async def upload_file(
        self, file: UploadFile, organization_id: str, project_id: str, statement_id: str
    ) -> None:
        file_path = f"{organization_id}/{project_id}/{statement_id}"
        s3.upload_fileobj(file.file, settings.bucket_name, file_path)

    async def get_file(
        self, organization_id: str, project_id: str, statement_id: str
    ) -> bytes:
        file_path = f"{organization_id}/{project_id}/{statement_id}"
        object = s3.get_object(Bucket=settings.bucket_name, Key=file_path)
        return object["Body"].read()

    async def delete_file(
        self, organization_id: str, project_id: str, statement_id: str
    ) -> None:
        file_path = f"{organization_id}/{project_id}/{statement_id}"
        s3.delete_object(Bucket=settings.bucket_name, Key=file_path)
