#!/usr/bin/env python3
"""
Test script for /species/lookup and /species/in-context.
Run after starting the server: uvicorn app.main:app --reload
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8001"


def test_lookup():
    """GET /species/lookup?scientific_name=... (catalog, no location)."""
    print("=" * 60)
    print("GET /api/v1/species/lookup (catalog)")
    print("=" * 60)
    url = f"{BASE_URL}/api/v1/species/lookup"
    params = {"scientific_name": "Urtica dioica"}
    try:
        r = requests.get(url, params=params, timeout=10)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"Keys: {list(data.keys())[:8]}...")
            print(f"scientific_name: {data.get('scientific_name')}")
            print(f"is_invasive: {data.get('is_invasive')}")
            print("✅ OK")
        else:
            print(f"Response: {r.text}")
        print()
        return r.status_code == 200
    except Exception as e:
        print(f"❌ {e}")
        return False


def test_in_context():
    """GET /species/in-context?scientific_name=...&lat=...&lng=..."""
    print("=" * 60)
    print("GET /api/v1/species/in-context (species + location risk)")
    print("=" * 60)
    url = f"{BASE_URL}/api/v1/species/in-context"
    params = {
        "scientific_name": "Urtica dioica",
        "lat": 37.7749,
        "lng": -122.4194,
        "radius_km": 50,
    }
    try:
        r = requests.get(url, params=params, timeout=30)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"species keys: {list(data.get('species', {}).keys())[:6]}...")
            print(f"dynamic_risk: {data.get('dynamic_risk')}")
            print(f"meta.species_returned: {data.get('meta', {}).get('species_returned')}")
            print("✅ OK")
        else:
            print(f"Response: {r.text}")
        print()
        return r.status_code == 200
    except Exception as e:
        print(f"❌ {e}")
        return False


if __name__ == "__main__":
    ok1 = test_lookup()
    ok2 = test_in_context()
    sys.exit(0 if (ok1 and ok2) else 1)
