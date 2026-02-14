from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np

from app.db.ml_store import get_ml_df
from app.ml.risk_engine import calculate_risk
from app.core.utils import fetch_rainfall, estimate_soil_ph

router = APIRouter(prefix="/risk", tags=["risk"])

class RiskAnalysisRequest(BaseModel):
    lat: float
    lng: float
    biome_context: str
    is_urban: bool = False

class RiskResultItem(BaseModel):
    scientific_name: str
    common_name: Optional[str] = None
    is_invasive: int
    risk_score: float
    risk_label: str

class RiskAnalysisResponse(BaseModel):
    meta: dict
    results: List[RiskResultItem]

@router.post("/scan", response_model=RiskAnalysisResponse)
async def scan_risk(
    request: RiskAnalysisRequest,
    ml_df: pd.DataFrame = Depends(get_ml_df)
):
    rainfall = fetch_rainfall(request.lat, request.lng)
    soil_ph = estimate_soil_ph(request.biome_context)
    
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
        
    raw_results = calculate_risk(ml_df, dynamic_profile)
    
    formatted_results = []
    for row in raw_results:
        score = row['risk_score']
        if score >= 0.65:
            label = "High Risk"
        elif score >= 0.45:
            label = "Moderate Risk"
        else:
            label = "Low Risk"
            
        formatted_results.append({
            "scientific_name": row['scientific_name'],
            "common_name": row.get('common_name', "Unknown"),
            "is_invasive": int(row['is_invasive']),
            "risk_score": float(score),
            "risk_label": label
        })
        
    return {
        "meta": {
            "rainfall_used": rainfall,
            "soil_ph_used": soil_ph,
            "biome": request.biome_context
        },
        "results": formatted_results
    }