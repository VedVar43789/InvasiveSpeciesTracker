#!/usr/bin/env python3
"""
Test script for the /risk/scan endpoint with multiple test cases
Run this after starting the server: uvicorn app.main:app --reload
"""

import requests
import json
import sys
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000"
ENDPOINT = f"{BASE_URL}/api/v1/risk/scan"

# Test cases
TEST_CASES = [
    {
        "name": "San Francisco - Grassland (Urban)",
        "request": {
            "lat": 37.7749,
            "lng": -122.4194,
            "biome_context": "Grassland",
            "is_urban": True,
            "radius_km": 50.0
        }
    },
    {
        "name": "New York City - Forest (Urban)",
        "request": {
            "lat": 40.7128,
            "lng": -74.0060,
            "biome_context": "Forest",
            "is_urban": True,
            "radius_km": 30.0
        }
    },
    {
        "name": "Los Angeles - Desert (Urban)",
        "request": {
            "lat": 34.0522,
            "lng": -118.2437,
            "biome_context": "Desert",
            "is_urban": True,
            "radius_km": 25.0
        }
    },
    {
        "name": "Seattle - Forest (Rural)",
        "request": {
            "lat": 47.6062,
            "lng": -122.3321,
            "biome_context": "Forest",
            "is_urban": False,
            "radius_km": 100.0
        }
    },
    {
        "name": "Miami - Wetland (Urban)",
        "request": {
            "lat": 25.7617,
            "lng": -80.1918,
            "biome_context": "Wetland",
            "is_urban": True,
            "radius_km": 40.0
        }
    },
    {
        "name": "Denver - Grassland (Rural)",
        "request": {
            "lat": 39.7392,
            "lng": -104.9903,
            "biome_context": "Grassland",
            "is_urban": False,
            "radius_km": 75.0
        }
    },
    {
        "name": "Small Radius Test - San Francisco",
        "request": {
            "lat": 37.7749,
            "lng": -122.4194,
            "biome_context": "Grassland",
            "is_urban": True,
            "radius_km": 5.0  # Very small radius
        }
    },
    {
        "name": "Large Radius Test - Central US",
        "request": {
            "lat": 39.8283,
            "lng": -98.5795,
            "biome_context": "Grassland",
            "is_urban": False,
            "radius_km": 200.0  # Large radius
        }
    },
    {
        "name": "Rainforest Biome - Amazon",
        "request": {
            "lat": -3.4653,
            "lng": -62.2159,
            "biome_context": "Rainforest",
            "is_urban": False,
            "radius_km": 50.0
        }
    },
    {
        "name": "Chaparral Biome - California",
        "request": {
            "lat": 34.1478,
            "lng": -118.1445,
            "biome_context": "Chaparral",
            "is_urban": True,
            "radius_km": 30.0
        }
    }
]


def test_endpoint(test_case: Dict[str, Any], verbose: bool = True) -> bool:
    """Test a single test case"""
    name = test_case["name"]
    request_data = test_case["request"]
    
    if verbose:
        print("\n" + "=" * 70)
        print(f"Test: {name}")
        print("=" * 70)
        print(f"Request: {json.dumps(request_data, indent=2)}")
        print("-" * 70)
    
    try:
        response = requests.post(ENDPOINT, json=request_data, timeout=30)
        
        if response.status_code != 200:
            print(f"❌ Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        
        # Extract key metrics
        meta = data.get("meta", {})
        results = data.get("results", [])
        
        rainfall = meta.get("rainfall_used", 0)
        soil_ph = meta.get("soil_ph_used", 0)
        biome = meta.get("biome", "Unknown")
        species_nearby = meta.get("species_found_nearby", 0)
        species_in_ml = meta.get("species_in_ml_dataset", 0)
        num_results = len(results)
        
        if verbose:
            print(f"✅ Status: 200 OK")
            print(f"\n📊 Results:")
            print(f"   Rainfall: {rainfall} mm")
            print(f"   Soil pH: {soil_ph}")
            print(f"   Biome: {biome}")
            print(f"   Species found nearby: {species_nearby}")
            print(f"   Species in ML dataset: {species_in_ml}")
            print(f"   Risk scores calculated: {num_results}")
        
        # Show top results
        if results:
            if verbose:
                print(f"\n🔝 Top {min(3, num_results)} species by risk:")
            for i, species in enumerate(results[:3], 1):
                risk_label = species.get("risk_label", "Unknown")
                risk_score = species.get("risk_score", 0)
                scientific_name = species.get("scientific_name", "Unknown")
                is_invasive = species.get("is_invasive", 0)
                
                if verbose:
                    invasive_marker = "🟥 INVASIVE" if is_invasive else "🟢 Native"
                    print(f"   {i}. {scientific_name} - {risk_label} ({risk_score:.4f}) {invasive_marker}")
        else:
            if verbose:
                print("\n⚠️  No species with risk scores returned")
        
        # Validation checks
        issues = []
        if species_nearby == 0:
            issues.append("No species found nearby (GBIF returned empty)")
        if species_in_ml == 0 and species_nearby > 0:
            issues.append("Species found but none matched ML dataset")
        if rainfall == 0:
            issues.append("Rainfall calculation returned 0 (may indicate API issue)")
        if soil_ph == 0:
            issues.append("Soil pH calculation returned 0")
        
        if issues and verbose:
            print(f"\n⚠️  Potential issues:")
            for issue in issues:
                print(f"   - {issue}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Server not running")
        print("   Start server: cd backend && uvicorn app.main:app --reload")
        return False
    except requests.exceptions.Timeout:
        print("❌ Timeout: Request took too long")
        return False
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {str(e)}")
        return False


def run_all_tests(verbose: bool = True, summary_only: bool = False):
    """Run all test cases"""
    print("\n" + "=" * 70)
    print("🧪 RISK ENDPOINT TEST SUITE")
    print("=" * 70)
    
    results = []
    for i, test_case in enumerate(TEST_CASES, 1):
        if not summary_only:
            print(f"\n[{i}/{len(TEST_CASES)}]")
        
        success = test_endpoint(test_case, verbose=verbose)
        results.append({
            "name": test_case["name"],
            "success": success
        })
    
    # Print summary
    print("\n" + "=" * 70)
    print("📋 TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for r in results if r["success"])
    failed = len(results) - passed
    
    print(f"\nTotal Tests: {len(results)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    
    if failed > 0:
        print("\nFailed Tests:")
        for result in results:
            if not result["success"]:
                print(f"   - {result['name']}")
    
    print("\n" + "=" * 70)
    
    return passed == len(results)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test the /risk/scan endpoint")
    parser.add_argument(
        "--summary",
        action="store_true",
        help="Show only summary, not detailed output"
    )
    parser.add_argument(
        "--case",
        type=int,
        help="Run only a specific test case (1-based index)"
    )
    
    args = parser.parse_args()
    
    if args.case:
        # Run single test case
        if 1 <= args.case <= len(TEST_CASES):
            test_case = TEST_CASES[args.case - 1]
            success = test_endpoint(test_case, verbose=True)
            sys.exit(0 if success else 1)
        else:
            print(f"❌ Invalid test case number. Choose 1-{len(TEST_CASES)}")
            sys.exit(1)
    else:
        # Run all tests
        success = run_all_tests(verbose=not args.summary, summary_only=args.summary)
        sys.exit(0 if success else 1)
