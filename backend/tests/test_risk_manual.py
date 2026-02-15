#!/usr/bin/env python3
"""
Manual test script for the /risk/scan endpoint
This tests the endpoint logic without requiring a running server.

Usage:
    python test_risk_manual.py
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_gbif_function():
    """Test the GBIF fetch function directly"""
    print("=" * 60)
    print("Testing fetch_species_from_gbif function")
    print("=" * 60)
    
    from app.core.utils import fetch_species_from_gbif
    
    # Test with San Francisco coordinates
    lat, lng = 37.7749, -122.4194
    print(f"\nFetching species near: {lat}, {lng}")
    print(f"Radius: 50km (50000 meters)")
    
    try:
        results = fetch_species_from_gbif(lat, lng, radius_meters=50000)
        print(f"\n✅ GBIF API call successful!")
        print(f"   Found {len(results)} unique species")
        
        if results:
            print(f"\nFirst 5 species:")
            for i, species in enumerate(results[:5], 1):
                print(f"  {i}. {species.get('scientific_name')}")
                print(f"     Common: {species.get('common_name', 'N/A')}")
                print(f"     Location: ({species.get('latitude')}, {species.get('longitude')})")
        
        return results
    except Exception as e:
        print(f"\n❌ Error: {type(e).__name__}: {str(e)}")
        return []

def test_ml_data_loading():
    """Test if ML data can be loaded"""
    print("\n" + "=" * 60)
    print("Testing ML data loading")
    print("=" * 60)
    
    try:
        from app.db.ml_store import load_ml_data
        
        # Try to load the ML data
        ml_df = load_ml_data("../notebooks/vectorized_species_master.csv")
        print(f"\n✅ ML data loaded successfully!")
        print(f"   Rows: {len(ml_df)}")
        print(f"   Columns: {len(ml_df.columns)}")
        print(f"   Sample columns: {list(ml_df.columns[:5])}")
        
        # Check if scientific_name column exists
        if 'scientific_name' in ml_df.columns:
            print(f"   Sample species: {ml_df['scientific_name'].head(3).tolist()}")
        
        return ml_df
    except FileNotFoundError:
        print(f"\n⚠️  ML data file not found at expected path")
        print(f"   Expected: ../notebooks/vectorized_species_master.csv")
        return None
    except Exception as e:
        print(f"\n❌ Error: {type(e).__name__}: {str(e)}")
        return None

def test_species_matching():
    """Test if GBIF species match ML dataset species"""
    print("\n" + "=" * 60)
    print("Testing species matching between GBIF and ML dataset")
    print("=" * 60)
    
    gbif_species = test_gbif_function()
    ml_df = test_ml_data_loading()
    
    if not gbif_species or ml_df is None:
        print("\n⚠️  Cannot test matching - missing data")
        return
    
    # Extract scientific names
    gbif_names = {s['scientific_name'] for s in gbif_species if s.get('scientific_name')}
    
    if 'scientific_name' not in ml_df.columns:
        print("\n❌ ML dataset doesn't have 'scientific_name' column")
        return
    
    ml_names = set(ml_df['scientific_name'].dropna().unique())
    
    # Find matches
    matches = gbif_names.intersection(ml_names)
    
    print(f"\n📊 Matching Results:")
    print(f"   GBIF species found: {len(gbif_names)}")
    print(f"   ML dataset species: {len(ml_names)}")
    print(f"   Matches: {len(matches)}")
    
    if matches:
        print(f"\n✅ Found {len(matches)} matching species!")
        print(f"   Sample matches: {list(matches)[:5]}")
    else:
        print(f"\n⚠️  No matches found. This could mean:")
        print(f"   - Species names don't match between GBIF and ML dataset")
        print(f"   - Different naming conventions")
        print(f"   - No invasive species in the area")

if __name__ == "__main__":
    print("\n🧪 Testing Risk Endpoint Components\n")
    
    # Run tests
    test_species_matching()
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print("\nTo test the full endpoint:")
    print("1. Start the server: cd backend && uvicorn app.main:app --reload")
    print("2. Run: python test_risk_endpoint.py")
    print("3. Or use curl:")
    print('   curl -X POST "http://localhost:8000/api/v1/risk/scan" \\')
    print('        -H "Content-Type: application/json" \\')
    print('        -d \'{"lat": 37.7749, "lng": -122.4194, "biome_context": "Grassland", "is_urban": true, "radius_km": 50.0}\'')
    print("\n")
