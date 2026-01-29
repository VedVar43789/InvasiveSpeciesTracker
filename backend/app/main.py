'''
FastAPI application for the Invasive Species Tracker
'''

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.api import router as api_router
from app.db.mongo import close_client, get_db
from app.db.indexes import ensure_indexes

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = get_db()
    # await ensure_indexes(db)

    yield

    await close_client()

# Create FastAPI app
app = FastAPI(title=settings.app_name, 
    lifespan=lifespan, 
    description=settings.app_description, 
    version=settings.version
)

if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.api_v1_prefix)