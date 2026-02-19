from typing import Optional, List
from pydantic import BaseModel


class RiskAnalysisRequest(BaseModel):
    lat: float
    lng: float
    biome_context: Optional[str] = None
    is_urban: Optional[bool] = False
    radius_km: float = 50.0

class RiskResultItem(BaseModel):
    scientific_name: str
    common_name: Optional[str] = None
    is_invasive: int
    risk_score: float
    risk_label: str
    found_in_gbif_radius: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RiskAnalysisResponse(BaseModel):
    meta: dict
    results: List[RiskResultItem]