from contextlib import asynccontextmanager
from beanie import init_beanie
from fastapi import FastAPI
from routers import router
from db import db
from modules.projects.models import Project
from modules.statements.models import Statement, Transaction


# Reconstruir modelos para resolver referencias circulares
Statement.model_rebuild()
Transaction.model_rebuild()
Project.model_rebuild()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_beanie(database=db, document_models=[Project, Statement, Transaction])
    try:
        await db.command("ping")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise e

    yield


app = FastAPI(lifespan=lifespan, title="ModernStack API")

app.include_router(router)
