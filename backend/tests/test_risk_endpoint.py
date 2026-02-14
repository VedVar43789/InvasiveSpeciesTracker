#!/usr/bin/env python3
"""
Test script for the /risk/scan endpoint
Run this after starting the server: uvicorn app.main:app --reload
"""

import requests
import json
import sys

# Test configuration
BASE_URL = "http://localhost:8000"
ENDPOINT = f"{BASE_URL}/api/v1/risk/scan"

# Test case: San Francisco coordinates
test_request = {
    "lat": 37.7749,
    "lng": -122.4194,
    "biome_context": "Grassland",
    "is_urban": True,
    "radius_km": 50.0
}

def test_endpoint():
    """Test the risk scan endpoint"""
    print("=" * 60)
    print("Testing /risk/scan endpoint")
    print("=" * 60)
    print(f"\nRequest URL: {ENDPOINT}")
    print(f"Request Body:\n{json.dumps(test_request, indent=2)}")
    print("\n" + "-" * 60)
    
    try:
        # Make the request
        response = requests.post(
            ENDPOINT,
            json=test_request,
            timeout=30  # GBIF API might be slow
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        # Parse response
        data = response.json()
        
        print("\n✅ Success! Response received:")
        print("-" * 60)
        
        # Print metadata
        meta = data.get("meta", {})
        print(f"\nMetadata:")
        print(f"  - Rainfall used: {meta.get('rainfall_used')}")
        print(f"  - Soil pH used: {meta.get('soil_ph_used')}")
        print(f"  - Biome: {meta.get('biome')}")
        print(f"  - Species found nearby: {meta.get('species_found_nearby', 0)}")
        print(f"  - Species in ML dataset: {meta.get('species_in_ml_dataset', 0)}")
        
        # Print results
        results = data.get("results", [])
        print(f"\nResults: {len(results)} species with risk scores")
        print("-" * 60)
        
        if results:
            print("\nTop 10 species by risk score:")
            for i, species in enumerate(results[:10], 1):
                print(f"\n{i}. {species.get('scientific_name')}")
                print(f"   Common name: {species.get('common_name', 'Unknown')}")
                print(f"   Risk score: {species.get('risk_score', 0):.4f}")
                print(f"   Risk label: {species.get('risk_label')}")
                print(f"   Is invasive: {species.get('is_invasive')}")
        else:
            print("\n⚠️  No results returned. This could mean:")
            print("   - No species found near the location")
            print("   - Species found but not in ML dataset")
            print("   - GBIF API returned no data")
        
        print("\n" + "=" * 60)
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Could not connect to server")
        print("   Make sure the server is running:")
        print("   cd backend && uvicorn app.main:app --reload")
        return False
    except requests.exceptions.Timeout:
        print("❌ Timeout: Request took too long (GBIF API might be slow)")
        return False
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_endpoint()
    sys.exit(0 if success else 1)
