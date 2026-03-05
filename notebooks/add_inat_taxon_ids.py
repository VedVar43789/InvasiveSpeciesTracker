"""
Utility script to enrich `vectorized_species_master.csv` with iNaturalist taxon IDs.

Usage (from repo root):

    python notebooks/add_inat_taxon_ids.py

This will:
  - Read `notebooks/vectorized_species_master.csv`
  - For each `scientific_name`, call the iNaturalist /taxa endpoint:
        GET https://api.inaturalist.org/v1/taxa
        params: q=<scientific_name>, rank=species, is_active=true, per_page=1, only_id=true
  - Extract the first returned ID (if any) as `inat_taxon_id`
  - Write `notebooks/vectorized_species_master_with_inat_ids.csv`

Notes:
  - A one‑second delay is used between API calls to respect iNat's
    recommended ~1 request/second rate limit.
  - If no taxon is found, the `inat_taxon_id` field will be left empty.
"""

import csv
import time
from pathlib import Path

import requests


INAT_TAXA_URL = "https://api.inaturalist.org/v1/taxa"


def fetch_inat_taxon_id(scientific_name: str) -> str | None:
    """
    Look up the iNaturalist taxon ID for a given scientific name.

    We use `only_id=true` so the response `results` array contains just integer IDs,
    e.g. { "results": [ 47792 ] }, and we don't need the full taxon objects.

    If no match is found, return None.
    """
    if not scientific_name:
        return None

    params = {
        "q": scientific_name,
        "rank": "species",
        "is_active": "true",
        "per_page": 1,
        "only_id": "true",
    }

    try:
        resp = requests.get(INAT_TAXA_URL, params=params, timeout=10)
    except Exception:
        return None

    if resp.status_code != 200:
        return None

    try:
        data = resp.json()
    except ValueError:
        return None

    results = data.get("results") or []
    if not results:
        return None

    # With only_id=true, each result should be an integer taxon ID.
    first = results[0]
    try:
        return str(int(first))
    except (TypeError, ValueError):
        # Fallback: if only_id behaviour ever changes and returns full objects,
        # try to read the `id` field instead.
        if isinstance(first, dict) and "id" in first:
            try:
                return str(int(first["id"]))
            except (TypeError, ValueError):
                return None
        return None


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    input_path = base_dir / "vectorized_species_master.csv"
    output_path = base_dir / "vectorized_species_master_with_inat_ids.csv"

    with input_path.open("r", newline="", encoding="utf-8") as infile:
        reader = csv.DictReader(infile)
        fieldnames = list(reader.fieldnames or [])

        # Add new column if it doesn't already exist
        if "inat_taxon_id" not in fieldnames:
            fieldnames.append("inat_taxon_id")

        rows = list(reader)

    with output_path.open("w", newline="", encoding="utf-8") as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

        for idx, row in enumerate(rows, start=1):
            name = row.get("scientific_name", "").strip()
            taxon_id = fetch_inat_taxon_id(name)
            row["inat_taxon_id"] = taxon_id or ""

            writer.writerow(row)

            # Simple progress indicator
            print(f"[{idx}/{len(rows)}] {name or '<empty>'} -> {taxon_id or 'no match'}")

            # Respect iNaturalist rate limits (~1 request per second)
            time.sleep(1.0)

    print(f"Finished. Wrote enriched CSV to: {output_path}")


if __name__ == "__main__":
    main()

