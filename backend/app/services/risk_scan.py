"""
Shared risk-scan logic: run risk at a location and return formatted results.
Used by POST /risk/scan and by species-in-context lookup.
"""

import numpy as np
import pandas as pd

import requests
from typing import Iterable, Dict, List

from app.core.utils import fetch_rainfall, derive_biome, estimate_soil_ph, fetch_species_from_gbif #, observation_counts
from app.ml.risk_engine import calculate_risk


def _normalize_scientific_name(name: str) -> str:
    """Normalize scientific name for matching: remove author info, lowercase, trim."""
    if not name:
        return ""
    return name.split('(')[0].strip().lower()


def _risk_score_to_label(score: float) -> str:
    if score >= 0.65:
        return "High Risk"
    if score >= 0.45:
        return "Moderate Risk"
    return "Low Risk"


def run_risk_scan(
    lat: float,
    lng: float,
    ml_df: pd.DataFrame,
    radius_km: float = 50.0,
    biome_context: str | None = None,
    is_urban: bool = False,
    return_all_results: bool = False,
) -> dict:
    """
    Run the full risk scan for a location. Returns dict with "meta" and "results".
    Results are filtered to species NOT found in GBIF radius, sorted by risk_score descending.
    If return_all_results=True, also includes "all_results" (every species with risk + found_in_gbif_radius).
    """
    nearby_species = fetch_species_from_gbif(
        lat, lng, radius_meters=int(radius_km * 1000)
    )

    rainfall, avg_temp = fetch_rainfall(lat, lng)
    if biome_context:
        biome = biome_context
    else:
        biome = derive_biome(rainfall, avg_temp)
    soil_ph = estimate_soil_ph(biome)

    nearby_names = {
        _normalize_scientific_name(s.get('scientific_name', ''))
        for s in nearby_species
        if s.get('scientific_name')
    }

    # Build dynamic profile
    dynamic_profile = {}
    dynamic_profile['native_region_count'] = 1.0 if is_urban else 0.5
    norm_ph = np.clip((soil_ph - 3.0) / 6.0, 0, 1)
    dynamic_profile['growth_ph_minimum'] = norm_ph
    dynamic_profile['growth_ph_maximum'] = norm_ph

    norm_rain = np.clip(rainfall / 3000.0, 0, 1)
    dynamic_profile['growth_minimum_precipitation_mm'] = norm_rain

    # Pass geospatial context for region-specific risk rules
    dynamic_profile['latitude'] = float(lat)
    dynamic_profile['longitude'] = float(lng)

    if biome_context == 'Grassland':
        dynamic_profile['habit_Graminoid'] = 1.0
    elif biome_context == 'Forest':
        dynamic_profile['habit_Shrub'] = 1.0

    # Favor plants that spread rapidly and vegetatively, and are dispersed by animals
    dynamic_profile['growth_rate_Rapid'] = 1.0
    #dynamic_profile['reproduction_Vegetative'] = 1.0
    #dynamic_profile['dispersal_Animal'] = 1.0

    # Calculate risk
    raw_results = calculate_risk(dynamic_profile)

    # Format results
    formatted_results = []
    for row in raw_results:

        # Check if species is found in GBIF radius
        sci_name = row.get("scientific_name", "")
        normalized = _normalize_scientific_name(sci_name)
        found_in_radius = normalized in nearby_names

        score = row['risk_score']

        tid = row.get("inat_taxon_id", None)
        if pd.isna(tid):
            inat_taxon_id = None
        else:
            inat_taxon_id = int(tid)

        formatted_results.append({
            "scientific_name": row['scientific_name'],
            "common_name": row.get('common_name', "Unknown"),
            "is_invasive": int(row['is_invasive']),
            "risk_score": float(score),
            "risk_label": _risk_score_to_label(score), # Label risk
            "found_in_gbif_radius": found_in_radius,
            "inat_taxon_id": inat_taxon_id
        })

    # Filter out native species found in GBIF radius
    filtered_results = [r for r in formatted_results if not r["found_in_gbif_radius"]]
    sorted_results = sorted(
        filtered_results,
        key=lambda r: -float(r.get("risk_score", 0.0))
    )

    # Collect iNaturalist taxon IDs for high and moderate risk species
    heatmap_taxon_ids = [
        int(r["inat_taxon_id"])
        for r in sorted_results
        if r.get("inat_taxon_id") is not None
        and r.get("risk_label") in {"High Risk", "Moderate Risk"}
    ]

    out = {
        "meta": {
            "rainfall_used": rainfall,
            "soil_ph_used": soil_ph,
            "biome": biome_context,
            "species_found_nearby": len(nearby_names),
            "species_in_ml_dataset": len(ml_df),
            "species_tagged_in_radius": sum(1 for r in formatted_results if r["found_in_gbif_radius"]),
            "species_returned": len(sorted_results),
            "inat_taxon_ids_for_heatmap": heatmap_taxon_ids,
        },
        "results": sorted_results,
    }
    if return_all_results:
        out["all_results"] = formatted_results
    return out
