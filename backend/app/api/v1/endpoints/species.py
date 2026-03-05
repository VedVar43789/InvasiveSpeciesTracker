'''
Species endpoint for the Invasive Species Tracker
'''

from fastapi import APIRouter, Depends, HTTPException, Query
import pandas as pd

from app.db.ml_store import get_ml_df
from app.services.risk_scan import run_risk_scan

router = APIRouter(prefix="/species", tags=["species"])


def _normalize_scientific_name(name: str) -> str:
    if not name:
        return ""
    return name.split('(')[0].strip().lower()


@router.get("/catalog/lookup")
async def get_species(
    scientific_name: str = Query(..., description="Scientific name of the species"),
    ml_df: pd.DataFrame = Depends(get_ml_df),
):
    """Get a species by scientific name (catalog lookup from ML dataset)."""
    row = ml_df[ml_df["scientific_name"] == scientific_name]
    if row.empty:
        raise HTTPException(status_code=404, detail="Species not found")
    return row.iloc[0].to_dict()


@router.get("/scan/lookup")
async def scan_lookup(
    scientific_name: str = Query(..., description="Scientific name of the species"),
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(50.0, gt=0, le=1000),
    biome_context: str | None = Query(None),
    is_urban: bool = Query(False),
    ml_df: pd.DataFrame = Depends(get_ml_df),
):
    """
    Get a species with risk context at a location. Runs the risk scan for the
    given coordinates, then returns the requested species' static data plus
    risk_score, risk_label, and found_in_gbif_radius for that location.
    """
    # Ensure species exists in ML dataset
    row = ml_df[ml_df["scientific_name"] == scientific_name]
    if row.empty:
        raise HTTPException(status_code=404, detail="Species not found")

    scan = run_risk_scan(
        lat=lat,
        lng=lng,
        ml_df=ml_df,
        radius_km=radius_km,
        biome_context=biome_context,
        is_urban=is_urban,
        return_all_results=True,
    )

    normalized_target = _normalize_scientific_name(scientific_name)
    risk_entry = None
    for r in scan.get("all_results", scan["results"]):
        if _normalize_scientific_name(r.get("scientific_name", "")) == normalized_target:
            risk_entry = r
            break

    static = row.iloc[0].to_dict()
    if risk_entry is None:
        dynamic_risk = {
            "risk_score": None,
            "risk_label": None,
            "found_in_gbif_radius": None,
            "note": "Species not in filtered risk results (may be present in GBIF radius).",
        }
    else:
        dynamic_risk = {
            "risk_score": risk_entry["risk_score"],
            "risk_label": risk_entry["risk_label"],
            "found_in_gbif_radius": risk_entry["found_in_gbif_radius"],
        }

    return {
        "species": static,
        "location": {"lat": lat, "lng": lng, "biome": biome_context},
        "meta": scan["meta"],
        "dynamic_risk": dynamic_risk,
    }