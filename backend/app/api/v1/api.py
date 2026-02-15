'''
Aggregated API endpoints for the Invasive Species Tracker
'''

from fastapi import APIRouter
from app.api.v1.endpoints import health, species, risk

router = APIRouter()
router.include_router(health.router)
router.include_router(species.router)
router.include_router(risk.router)