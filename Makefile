mongo-up:
	docker compose -f infra/docker-compose.yml up -d

mongo-down:
	docker compose -f infra/docker-compose.yml down

api:
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --app-dir .

test:
	cd backend && source .venv/bin/activate && pytest -v