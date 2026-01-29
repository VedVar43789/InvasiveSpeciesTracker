from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SpeciesCreate(BaseModel):
    name: str = Field(..., description="The name of the species")
    scientific_name: str = Field(..., description="The scientific name of the species")
    common_name: Optional[str] = Field(None, description="The common name of the species")
    category: Optional[str] = Field(None, description="The category of the species")
    order: Optional[str] = Field(None, description="The order of the species")
    family: Optional[str] = Field(None, description="The family of the species")
    genus: Optional[str] = Field(None, description="The genus of the species")
    species: Optional[str] = Field(None, description="The species of the species")


class SpeciesOut(SpeciesCreate):
    id: str = Field(..., description="The ID of the species")
    created_at: datetime = Field(..., description="The date and time the species was created")
    updated_at: datetime = Field(..., description="The date and time the species was last updated")