# backend/app/db/csv_store.py

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List, Dict, Any

import pandas as pd
import numpy as np


_df: Optional[pd.DataFrame] = None


@dataclass(frozen=True)
class CSVSchema:
    lat: str = "latitude"
    lng: str = "longitude"
    scientific_name: str = "scientific_name"
    common_name: str = "common_name"
    family: str = "family"


SCHEMA = CSVSchema()


def load_csv(path: str) -> pd.DataFrame:
    """
    Load CSV into a DataFrame and normalize column types.
    Call once at app startup, cache the result.
    """
    df = pd.read_csv(path)

    # Basic normalization: trim column names
    df.columns = [c.strip() for c in df.columns]

    # Validate required columns
    required = {SCHEMA.lat, SCHEMA.lng, SCHEMA.scientific_name}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing required columns: {sorted(missing)}")

    # Normalize types
    df[SCHEMA.lat] = pd.to_numeric(df[SCHEMA.lat], errors="coerce")
    df[SCHEMA.lng] = pd.to_numeric(df[SCHEMA.lng], errors="coerce")

    # Drop rows with invalid coordinates or missing scientific name
    df[SCHEMA.scientific_name] = df[SCHEMA.scientific_name].astype(str).str.strip()
    df = df.dropna(subset=[SCHEMA.lat, SCHEMA.lng])
    df = df[df[SCHEMA.scientific_name].str.len() > 0]

    # Optional columns: if absent, create empty
    for col in [SCHEMA.common_name, SCHEMA.family]:
        if col not in df.columns:
            df[col] = ""

    # Ensure consistent dtypes
    df[SCHEMA.common_name] = df[SCHEMA.common_name].astype(str).fillna("").str.strip()
    df[SCHEMA.family] = df[SCHEMA.family].astype(str).fillna("").str.strip()

    # Reset index for predictable slicing
    df = df.reset_index(drop=True)
    return df


def set_df(df: pd.DataFrame) -> None:
    global _df
    _df = df


def get_df() -> pd.DataFrame:
    """
    FastAPI dependency: returns the cached DataFrame.
    """
    if _df is None:
        raise RuntimeError("CSV DataFrame not loaded. Did you call load_csv() at startup?")
    return _df


def unload_df() -> None:
    global _df
    _df = None


def _haversine_km(lat1, lng1, lat2, lng2) -> np.ndarray:
    """
    Vectorized haversine distance from a single point (lat1,lng1)
    to arrays lat2,lng2. Returns km.
    """
    R = 6371.0088  # Earth radius in km
    lat1 = np.radians(lat1)
    lng1 = np.radians(lng1)
    lat2 = np.radians(lat2)
    lng2 = np.radians(lng2)

    dlat = lat2 - lat1
    dlng = lng2 - lng1

    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlng / 2) ** 2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return R * c


def query_species_by_location(
    df: pd.DataFrame,
    lat: float,
    lng: float,
    radius_km: float = 5.0,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    Returns a list of unique species near (lat,lng) within radius_km.
    Deduplicates by scientific_name, keeping the nearest occurrence.
    """
    # Cheap bounding-box prefilter (reduces distance computations)
    # 1 deg latitude ~ 110.574 km
    delta_lat = radius_km / 110.574
    # 1 deg longitude ~ 111.320*cos(latitude) km
    cos_lat = np.cos(np.radians(lat))
    delta_lng = radius_km / (111.320 * max(cos_lat, 1e-6))

    lat_col = SCHEMA.lat
    lng_col = SCHEMA.lng

    sub = df[
        (df[lat_col] >= lat - delta_lat) & (df[lat_col] <= lat + delta_lat) &
        (df[lng_col] >= lng - delta_lng) & (df[lng_col] <= lng + delta_lng)
    ]

    if sub.empty:
        return []

    # Compute precise distances for the candidate subset
    dists = _haversine_km(lat, lng, sub[lat_col].to_numpy(), sub[lng_col].to_numpy())
    sub = sub.copy()
    sub["distance_km"] = dists

    # Filter within radius and sort nearest first
    sub = sub[sub["distance_km"] <= radius_km].sort_values("distance_km", ascending=True)
    if sub.empty:
        return []

    # Deduplicate by scientific_name: keep nearest occurrence
    sci = SCHEMA.scientific_name
    sub = sub.drop_duplicates(subset=[sci], keep="first")

    # Limit and format output rows
    sub = sub.head(min(max(limit, 1), 200))

    out = []
    for _, row in sub.iterrows():
        out.append(
            {
                "scientific_name": row.get(SCHEMA.scientific_name, ""),
                "common_name": row.get(SCHEMA.common_name, ""),
                "family": row.get(SCHEMA.family, ""),
                "latitude": float(row[SCHEMA.lat]),
                "longitude": float(row[SCHEMA.lng]),
                "distance_km": float(row["distance_km"]),
            }
        )
    return out
