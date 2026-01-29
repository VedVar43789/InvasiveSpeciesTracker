'''
Aggregated API endpoints for the Invasive Species Tracker
'''

from fastapi import APIRouter
from app.api.v1.endpoints import health, species

router = APIRouter()
router.include_router(health.router)
router.include_router(species.router)