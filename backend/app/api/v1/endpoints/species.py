'''
Species endpoint for the Invasive Species Tracker
'''

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId

from app.db.mongo import get_db
from app.schemas.species import SpeciesCreate, SpeciesOut


router = APIRouter(prefix="/species", tags=["species"])


def _to_out(doc: dict) -> SpeciesOut:
    return SpeciesOut(
        id=str(doc["_id"]),
        name=doc["name"],
        scientific_name=doc["scientific_name"],
        common_name=doc["common_name"],
        category=doc["category"],
        order=doc["order"],
    )


@router.post("", response_model=SpeciesOut)
async def create_species(payload: SpeciesCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    now = datetime.now(datetime.timezone.utc)
    doc = payload.model_dump()
    doc["created_at"] = now
    doc["updated_at"] = now

    try:
        result = await db.species.insert_one(doc)
    except Exception:
        raise HTTPException(status_code=400, detail="Species already exists")

    created = await db.species.find_one({"_id": result.inserted_id})
    return _to_out(created)
    

@router.get("", response_model=list[SpeciesOut])
async def list_species(
    q: str | None = None,
    limit: int = 50,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    limit = min(max(limit, 1), 200) # pagination limit

    query = {}
    if q:
        # Uses the text index defined in indexes.py
        query = {"$text": {"$search": q}}

    cursor = db.species.find(query).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_to_out(d) for d in docs]


@router.get("/{species_id}", response_model=SpeciesOut)
async def get_species(species_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        oid = ObjectId(species_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid species_id")

    doc = await db.species.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Species not found")

    return _to_out(doc)