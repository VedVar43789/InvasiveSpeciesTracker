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
            "daily": ["precipitation_sum", "temperature_2m_mean"], # Added Temp
            "timezone": "auto"
        }
        response = requests.get(url, params=params, timeout=5)
        if response.status_code != 200:
            return 500.0, 15.0 # Fallback
            
        data = response.json()
        daily = data.get('daily', {})
        
        # Calculate totals/averages
        total_rain = sum(daily.get('precipitation_sum', []) or [0])
        temps = daily.get('temperature_2m_mean', []) or [15]
        avg_temp = sum(temps) / len(temps)
        
        return total_rain, avg_temp
    except Exception:
        return 500.0, 15.0
    
def derive_biome(rain_mm: float, temp_c: float) -> str:
    """Guesses the biome using Whittaker's Classification logic."""
    if rain_mm < 250:
        return 'Desert'
    
    if rain_mm > 2000:
        return 'Rainforest'
    
    # Temperature decides the rest
    if temp_c > 20: # Hot (Tropical/Savanna)
        return 'Grassland' if rain_mm < 1000 else 'Forest'
        
    elif temp_c > 10: # Temperate
        return 'Grassland' if rain_mm < 800 else 'Forest'
        
    else: # Cold
        return 'Tundra' if rain_mm < 500 else 'Taiga'

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