api:
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --app-dir .

test:
	cd backend && source .venv/bin/activate && pytest -v