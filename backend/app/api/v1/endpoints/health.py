'''
Health endpoint for the Invasive Species Tracker
'''

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["health"])

@router.get("/health")
async def health():
    return {"status": "ok", "app": settings.app_name, "env": settings.env}