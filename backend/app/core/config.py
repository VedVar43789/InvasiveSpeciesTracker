from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = Field(default="Invasive Tracker API", alias="APP_NAME")
    env: str = Field(default="dev", alias="ENV")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")

    cors_origins: List[str] = Field(default_factory=list, alias="CORS_ORIGINS")

    mongo_uri: str = Field(default="mongodb://localhost:27017", alias="MONGO_URI")
    mongo_db: str = Field(default="invasive_tracker", alias="MONGO_DB")

    app_description: str = Field(default="API for the Invasive Species Tracker", alias="APP_DESCRIPTION")
    version: str = Field(default="0.1.0", alias="VERSION")

settings = Settings()
