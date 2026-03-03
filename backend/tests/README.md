# Backend tests

Run from the **backend** directory. Use the project venv so dependencies (numpy, pandas, requests, etc.) are available.

## 1. Manual component tests (no server)

Tests GBIF fetch, ML data load, and species matching. Requires network for GBIF.

```bash
cd backend
source .venv/bin/activate   # or: conda activate <env>
PYTHONPATH=. python tests/test_risk_manual.py
```

## 2. Risk endpoint (server required)

Single-case test for `POST /api/v1/risk/scan`:

```bash
cd backend
PYTHONPATH=. uvicorn app.main:app --reload   # terminal 1
PYTHONPATH=. python tests/test_risk_endpoint.py   # terminal 2
```

## 3. Species endpoints (server required)

Tests `GET /species/lookup` and `GET /species/in-context`:

```bash
cd backend
PYTHONPATH=. python tests/test_species_endpoint.py
```

## 4. Risk endpoint – multiple cases (server required)

Full suite with 10 location/biome cases:

```bash
cd backend
PYTHONPATH=. python test_risk_endpoint.py           # all cases, verbose
PYTHONPATH=. python test_risk_endpoint.py --summary  # summary only
PYTHONPATH=. python test_risk_endpoint.py --case 1  # run case 1 only
```

## 5. GBIF integration (pytest, optional)

Requires `RUN_GBIF_TESTS=1` and network:

```bash
cd backend
PYTHONPATH=. RUN_GBIF_TESTS=1 python -m pytest -q -s tests/test_gbif_fetch.py
```
