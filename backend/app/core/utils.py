import requests
import numpy as np

def fetch_rainfall(lat: float, lon: float) -> float:
    try:
        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": "2023-01-01",
            "end_date": "2023-12-31",
            "daily": "precipitation_sum",
            "timezone": "auto"
        }
        response = requests.get(url, params=params, timeout=5)
        if response.status_code != 200:
            return 500.0
            
        data = response.json()
        total_rain = sum(data.get('daily', {}).get('precipitation_sum', []))
        return total_rain if total_rain > 0 else 500.0
    except Exception:
        return 500.0

def estimate_soil_ph(biome: str) -> float:
    biome_map = {
        'Desert': 7.5,
        'Grassland': 7.0,
        'Forest': 5.5,
        'Rainforest': 4.5,
        'Wetland': 6.0,
        'Chaparral': 7.0 
    }
    return biome_map.get(biome, 6.5)

def fetch_species_from_gbif(lat: float, lng: float, radius_meters: int = 50000) -> list:
    try:
        url = "https://api.gbif.org/v1/occurrence/search"
        params = {
            "geoDistance": f"{lat},{lng},{radius_meters}m",  # Format: lat,lng,distance
            "limit": 300,
            "hasCoordinate": "true",
            "hasGeospatialIssue": "false"
        }

        response = requests.get(url, params=params, timeout=10)
        if response.status_code != 200:
            return []

        data = response.json()
        results = []
        seen_species = set()  # Deduplicate by scientific name

        for record in data.get("results", []):
            scientific_name = record.get("species") or record.get("scientificName", "")
            if not scientific_name or scientific_name in seen_species:
                continue
                
            seen_species.add(scientific_name)
            results.append({
                "scientific_name": scientific_name,
                "latitude": record.get("decimalLatitude"),
                "longitude": record.get("decimalLongitude"),
                "common_name": record.get("vernacularName", ""),
                "family": "",  # GBIF doesn't always provide this
            })
        
        return results
    except Exception:
        return []