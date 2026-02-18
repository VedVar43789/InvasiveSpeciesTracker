import os

import pytest

from app.core.utils import fetch_species_from_gbif


# This test hits the real GBIF API (network + data can be flaky).
# Opt-in by setting RUN_GBIF_TESTS=1.
pytestmark = pytest.mark.skipif(
    os.getenv("RUN_GBIF_TESTS") != "1",
    reason="Set RUN_GBIF_TESTS=1 to run GBIF integration tests",
)


@pytest.mark.parametrize(
    "name,lat,lng,radius_meters",
    [
        ("san_francisco_10km", 37.7749, -122.4194, 10_000),
        ("nyc_10km", 40.7128, -74.0060, 10_000),
        # Middle of the Pacific (should usually be empty)
        ("pacific_ocean_50km", 0.0, -140.0, 50_000),
    ],
)
def test_fetch_species_from_gbif_smoke(name: str, lat: float, lng: float, radius_meters: int) -> None:
    results = fetch_species_from_gbif(lat, lng, radius_meters=radius_meters)

    # Basic shape checks (don't assert on counts; GBIF results vary)
    assert isinstance(results, list)
    for item in results[:5]:
        assert isinstance(item, dict)
        assert "scientific_name" in item

    # Print a short sample so you can see what GBIF returns (run pytest with -s)
    print(f"\n[{name}] lat={lat} lng={lng} radius_meters={radius_meters}")
    print(f"Returned unique species: {len(results)}")
    for i, item in enumerate(results[:10], start=1):
        print(
            f"{i:02d}. {item.get('scientific_name')} "
            f"(common={item.get('common_name')!r}, "
            f"lat={item.get('latitude')}, lng={item.get('longitude')})"
        )

