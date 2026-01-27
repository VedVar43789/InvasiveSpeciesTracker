'''
Species endpoint for the Invasive Species Tracker
'''

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["species"])

@router.get("/species")
async def get_species():
    return {"message": "Species"}