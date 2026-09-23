# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./slopeinsights.db"
    api_key: str = "dev-key"
    environment: str = "development"
    jwt_secret: str = "dev-secret-change-in-production"
    cors_origins: str = "*"

    # Optional: email a copy of each feedback submission. Feedback is always saved to the
    # database; if these are unset, nothing is emailed. (Gmail works with an app password:
    # smtp.gmail.com, port 587.)
    feedback_to_email: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
