'''
Species endpoint for the Invasive Species Tracker
'''

from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime
from bson import ObjectId
import pandas as pd

# from app.db.mongo import get_db
from app.schemas.species import SpeciesNearbyOut
from app.db.csv_store import get_df, query_species_by_location


router = APIRouter(prefix="/species", tags=["species"])


def _to_out(species: dict) -> SpeciesNearbyOut:
    return SpeciesNearbyOut(
        id=species.get("id", ""),
        scientific_name=species.get("scientific_name", ""),
        common_name=species.get("common_name", ""),
        family=species.get("family", ""),
        distance_km=species.get("distance_km", 0),
    )

@router.get("/by-location", response_model=list[SpeciesNearbyOut])
async def get_species_by_location(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude between -90 and 90"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude between -180 and 180"),
    radius_km: float = Query(5.0, gt=0, le=1000, description="Search radius in km (max 1000)"),
    limit: int = Query(50, ge=1, le=200, description="Max number of results"),
    df: pd.DataFrame = Depends(get_df),
):
    limit = min(max(limit, 1), 200) # pagination limit

    # uncomment to use real data from .csv file
    # return [_to_out(species) for species in query_species_by_location(
    #     df, latitude, longitude, radius_km, limit)
    # ]

    MOCK_SPECIES_NEARBY = [
        {
            "id": "ambrosia_artemisiifolia",
            "scientific_name": "Ambrosia artemisiifolia",
            "common_name": "Common ragweed",
            "family": "Asteraceae",
            "distance_km": 0.42,
        },
        {
            "id": "carpobrotus_edulis",
            "scientific_name": "Carpobrotus edulis",
            "common_name": "Ice plant",
            "family": "Aizoaceae",
            "distance_km": 1.87,
        },
        {
            "id": "cortaderia_selloana",
            "scientific_name": "Cortaderia selloana",
            "common_name": "Pampas grass",
            "family": "Poaceae",
            "distance_km": 3.12,
        },
        {
            "id": "arundo_donax",
            "scientific_name": "Arundo donax",
            "common_name": "Giant reed",
            "family": "Poaceae",
            "distance_km": 6.55,
        },
        {
            "id": "ricinus_communis",
            "scientific_name": "Ricinus communis",
            "common_name": "Castor bean",
            "family": "Euphorbiaceae",
            "distance_km": 9.98,
        },
    ]
    return [_to_out(species) for species in MOCK_SPECIES_NEARBY]