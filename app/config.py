# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./powderpass.db"
    api_key: str = "dev-key"
    besttime_api_key: str = ""
    environment: str = "development"


settings = Settings()
