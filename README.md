# Invasive Species Tracker

## Stack

FastAPI + MongoDB backend + React frontend (FARM)

## Prerequisites

- Python 3.10+ (3.11 recommended)
- Docker + Docker Compose
- (Optional) Node.js if/when you run the frontend

---

## 1. Start MongoDB (Docker)

From the repo root:

```bash
docker compose -f infra/docker-compose.yml up -d

docker ps

docker compose -f infra/docker-compose.yml down
```

## 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit ```backend/.env``` if needed (Mongo runs at mongodb://localhost:27017 by default).

## 3. Run FastAPI backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --app-dir .
```

Backend will run at:
- http://localhost:8000

Health check:
- http://localhost:8000/api/v1/health

## Development

Useful command shortcuts (Makefile)


```bash
make mongo-up
make api
```