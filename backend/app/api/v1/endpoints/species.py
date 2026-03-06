'''
Species endpoint for the Invasive Species Tracker
'''

from fastapi import APIRouter, Depends, HTTPException, Query
import pandas as pd
import requests

from app.db.ml_store import get_ml_df
from app.services.risk_scan import run_risk_scan

router = APIRouter(prefix="/species", tags=["species"])


def _normalize_scientific_name(name: str) -> str:
    if not name:
        return ""
    return name.split('(')[0].strip().lower()


def _is_true(val) -> bool:
    """Helper to safely check if a value is True or 1"""
    return val in [1, 1.0, True, "True", "1"]


def decode_plant_traits(raw_row: dict) -> dict:
    """Translates ML one-hot encoded rows back into clean UI data."""
    clean_data = {
        "scientific_name": raw_row.get("scientific_name", "Unknown"),
        "is_invasive": _is_true(raw_row.get("is_invasive")),
    }

    # 1. Decode Habit (e.g., habit_Forb/herb -> "Forb/herb")
    habits = [k.replace("habit_", "") for k, v in raw_row.items() if k.startswith("habit_") and _is_true(v)]
    clean_data["habit"] = habits[0] if habits else "Unknown"

    # 2. Decode Light (e.g., light_8.0 -> "8.0")
    lights = [k.replace("light_", "") for k, v in raw_row.items() if k.startswith("light_") and _is_true(v)]
    clean_data["light_level"] = lights[0] if lights else "Unknown"

    # 3. Decode Growth Rate (e.g., growth_rate_Rapid -> "Rapid")
    rates = [k.replace("growth_rate_", "") for k, v in raw_row.items() if k.startswith("growth_rate_") and _is_true(v)]
    clean_data["growth_rate"] = rates[0] if rates else "Unknown"

    # 4. Clean Boolean Traits (For UI Warning Badges)
    clean_data["spreads_vegetatively"] = _is_true(raw_row.get("reproduction_Vegetative"))
    clean_data["animal_dispersal"] = _is_true(raw_row.get("dispersal_Animal"))
    
    # 5. Keep the raw climate numbers for reference
    clean_data["ph_minimum"] = raw_row.get("growth_ph_minimum")
    clean_data["ph_maximum"] = raw_row.get("growth_ph_maximum")
    clean_data["native_region_count"] = raw_row.get("native_region_count")
    clean_data["inat_taxon_id"] = raw_row.get("inat_taxon_id")
    
    return clean_data


@router.get("/catalog/lookup")
async def get_species(
    scientific_name: str = Query(..., description="Scientific name of the species"),
    ml_df: pd.DataFrame = Depends(get_ml_df),
):
    """Get a species by scientific name (catalog lookup from ML dataset)."""
    row = ml_df[ml_df["scientific_name"] == scientific_name]
    if row.empty:
        raise HTTPException(status_code=404, detail="Species not found")
    raw_dict = row.iloc[0].to_dict()
    return decode_plant_traits(raw_dict)


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
        "species": decode_plant_traits(static),
        "location": {"lat": lat, "lng": lng, "biome": biome_context},
        "meta": scan["meta"],
        "dynamic_risk": dynamic_risk,
    }


@router.get("/external/trefle-traits")
async def fetch_trefle_traits(scientific_name: str = Query(..., description="Scientific name of the species")):
    """
    Backend proxy to fetch Trefle plant traits securely.
    Avoids CORS issues by proxying through the backend instead of calling from frontend.
    """
    TREFLE_TOKEN = "usr-hBvTzkoJ51_i1-ZggYRoi5t2xvdmrC5UQozQ-bqr3T4"
    
    try:
        # 1. Search Trefle for the exact plant to get its unique ID (slug)
        search_url = f"https://trefle.io/api/v1/species/search?q={scientific_name}&token={TREFLE_TOKEN}"
        search_res = requests.get(search_url, timeout=5).json()

        if search_res.get("data") and len(search_res["data"]) > 0:
            slug = search_res["data"][0]["slug"]

            # 2. Fetch the full biological profile using that slug
            detail_url = f"https://trefle.io/api/v1/species/{slug}?token={TREFLE_TOKEN}"
            detail_data = requests.get(detail_url, timeout=5).json()
            plant = detail_data.get("data", {})

            # 3. Extract Native Regions
            native_regions = "Unknown"
            if plant.get("distributions") and plant["distributions"].get("native"):
                regions_array = [r["name"] for r in plant["distributions"]["native"]]
                if len(regions_array) > 4:
                    native_regions = ", ".join(regions_array[:4]) + f" (+{len(regions_array) - 4} more)"
                else:
                    native_regions = ", ".join(regions_array)

            # 4. Extract pH Data
            growth = plant.get("growth", {})
            ph_min = growth.get("ph_minimum", "Unknown")
            ph_max = growth.get("ph_maximum", "Unknown")

            return {
                "nativeRegions": native_regions,
                "phMin": ph_min,
                "phMax": ph_max
            }
            
        return {"nativeRegions": "Unknown", "phMin": "Unknown", "phMax": "Unknown"}

    except Exception as e:
        print(f"Trefle Proxy Error: {e}")
        return {"nativeRegions": "Unknown", "phMin": "Unknown", "phMax": "Unknown"}