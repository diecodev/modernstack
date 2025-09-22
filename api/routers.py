from fastapi import APIRouter, Depends
from modules.projects.controllers import projects_router
from modules.statements.controllers import statements_router
from dependencies import get_api_key

router = APIRouter(prefix="/api", dependencies=[Depends(get_api_key)])


router.include_router(projects_router, tags=["Projects"])
router.include_router(statements_router, tags=["Statements"])
