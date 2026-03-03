from fastapi import APIRouter, Depends
import pandas as pd

from app.db.ml_store import get_ml_df
from app.schemas.risk import RiskAnalysisRequest, RiskAnalysisResponse
from app.services.risk_scan import run_risk_scan

router = APIRouter(prefix="/risk", tags=["risk"])


@router.post("/scan", response_model=RiskAnalysisResponse)
async def scan_risk(
    request: RiskAnalysisRequest,
    ml_df: pd.DataFrame = Depends(get_ml_df),
):
    return run_risk_scan(
        lat=request.lat,
        lng=request.lng,
        ml_df=ml_df,
        radius_km=request.radius_km,
        biome_context=request.biome_context,
        is_urban=request.is_urban or False,
    )