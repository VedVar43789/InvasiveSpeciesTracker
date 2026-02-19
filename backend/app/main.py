'''
FastAPI application for the Invasive Species Tracker
'''

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.api import router as api_router
# from app.db.mongo import close_client, get_db
# from app.db.indexes import ensure_indexes
from app.db.csv_store import load_csv, set_df, unload_df
from app.db.ml_store import load_ml_data, set_ml_df, unload_ml_df


@asynccontextmanager
async def lifespan(app: FastAPI):
    # db = get_db()
    # await ensure_indexes(db)
    # Note: CSV file path - update if your data is elsewhere
    # For now, using empty CSV structure (GBIF will be used for location data)
    try:
        df = load_csv("app/db/invasive_species.csv")
        set_df(df)
    except (FileNotFoundError, ValueError):
        # If CSV doesn't exist or is empty, create empty DataFrame
        import pandas as pd
        df = pd.DataFrame(columns=["latitude", "longitude", "scientific_name", "common_name", "family"])
        set_df(df)
    
    # ML data file - located at root/notebooks/vectorized_species_master.csv
    # From backend/app/main.py, go up to root: ../../notebooks/vectorized_species_master.csv
    import os
    backend_dir = os.path.dirname(os.path.dirname(__file__))  # backend/
    root_dir = os.path.dirname(backend_dir)  # root/
    ml_data_path = os.path.join(root_dir, "notebooks", "vectorized_species_master.csv")
    ml_df = load_ml_data(ml_data_path)
    set_ml_df(ml_df)
    yield

    # await close_client()
    unload_df()
    unload_ml_df()

# Create FastAPI app
app = FastAPI(title=settings.app_name, 
    lifespan=lifespan, 
    description=settings.app_description, 
    version=settings.version
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)