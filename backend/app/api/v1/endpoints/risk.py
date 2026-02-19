from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np

from app.db.ml_store import get_ml_df
from app.ml.risk_engine import calculate_risk
from app.core.utils import fetch_rainfall, derive_biome, estimate_soil_ph, fetch_species_from_gbif
from app.schemas.risk import RiskAnalysisRequest, RiskAnalysisResponse

router = APIRouter(prefix="/risk", tags=["risk"])


def _normalize_scientific_name(name: str) -> str:
    """Normalize scientific name for matching: remove author info, lowercase, trim."""
    if not name:
        return ""
    # Remove author info in parentheses: "Genus species (Author)" -> "Genus species"
    return name.split('(')[0].strip().lower()


def _filter_ml_dataset_by_species(ml_df: pd.DataFrame, species_names: set) -> pd.DataFrame:
    """Filter ML dataset to only include species in the provided set (case-insensitive match)."""
    if 'scientific_name' not in ml_df.columns:
        return ml_df.iloc[0:0].copy()
    
    # Normalize ML dataset names
    ml_df_normalized = ml_df.copy()
    ml_df_normalized['_normalized_name'] = ml_df_normalized['scientific_name'].astype(str).apply(_normalize_scientific_name)
    
    # Filter and drop temporary column
    filtered = ml_df_normalized[ml_df_normalized['_normalized_name'].isin(species_names)].copy()
    return filtered.drop(columns=['_normalized_name']) if '_normalized_name' in filtered.columns else filtered


@router.post("/scan", response_model=RiskAnalysisResponse)
async def scan_risk(
    request: RiskAnalysisRequest,
    ml_df: pd.DataFrame = Depends(get_ml_df),
):
    # Fetch species near location from GBIF
    nearby_species = fetch_species_from_gbif(
        request.lat, 
        request.lng, 
        radius_meters=int(request.radius_km * 1000)
    )
    
    # Calculate environmental data (always needed for metadata)
    rainfall, avg_temp = fetch_rainfall(request.lat, request.lng)
    if request.biome_context:
        biome = request.biome_context
    else:
        biome = derive_biome(rainfall, avg_temp)
    soil_ph = estimate_soil_ph(biome)
    
    # Build name -> coords lookup from GBIF data (first occurrence wins)
    nearby_coords = {}
    for s in nearby_species:
        name = s.get('scientific_name', '')
        if not name:
            continue
        norm = _normalize_scientific_name(name)
        if norm not in nearby_coords:
            nearby_coords[norm] = {
                "lat": s.get("latitude"),
                "lng": s.get("longitude"),
            }
    nearby_names = set(nearby_coords.keys())

    # Build dynamic profile for risk calculation
    dynamic_profile = {}
    
    dynamic_profile['native_region_count'] = 1.0 if request.is_urban else 0.5
    
    norm_ph = np.clip((soil_ph - 3.0) / 6.0, 0, 1)
    dynamic_profile['growth_ph_minimum'] = norm_ph
    dynamic_profile['growth_ph_maximum'] = norm_ph
    
    norm_rain = np.clip(rainfall / 3000.0, 0, 1)
    dynamic_profile['growth_minimum_precipitation_mm'] = norm_rain
    
    if request.biome_context == 'Grassland':
        dynamic_profile['habit_Graminoid'] = 1.0
    elif request.biome_context == 'Forest':
        dynamic_profile['habit_Shrub'] = 1.0
        
    # Calculate risk
    raw_results = calculate_risk(ml_df, dynamic_profile) 
    
    # Format results
    formatted_results = []
    for row in raw_results:

        # Check if species is in GBIF radius
        sci_name = row.get("scientific_name", "")
        normalized = _normalize_scientific_name(sci_name)
        found_in_radius = normalized in nearby_names

        # Label risk
        score = row['risk_score']
        if score >= 0.65:
            label = "High Risk"
        elif score >= 0.45:
            label = "Moderate Risk"
        else:
            label = "Low Risk"
            
        # Attach GBIF coordinates if species was found nearby
        coords = nearby_coords.get(normalized, {})

        formatted_results.append({
            "scientific_name": row['scientific_name'],
            "common_name": row.get('common_name', "Unknown"),
            "is_invasive": int(row['is_invasive']),
            "risk_score": float(score),
            "risk_label": label,
            "found_in_gbif_radius": found_in_radius,
            "latitude": coords.get("lat"),
            "longitude": coords.get("lng"),
        })
    
    sorted_results = sorted(
        formatted_results,
        key=lambda r: (
            not r["found_in_gbif_radius"], # false sorts before true
            -float(r.get("risk_score", 0.0)),  
        ),
    )
        
    return {
        "meta": {
            "rainfall_used": rainfall,
            "soil_ph_used": soil_ph,
            "biome": request.biome_context,
            "species_found_nearby": len(nearby_names),
            "species_in_ml_dataset": len(ml_df),
            "species_tagged_in_radius": sum(1 for r in sorted_results if r["found_in_gbif_radius"]),
        },
        "results": sorted_results
    }