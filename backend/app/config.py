# app/config.py
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_JWT_SECRET = "dev-secret-change-in-production"
DEFAULT_API_KEY = "dev-key"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./slopeinsights.db"
    api_key: str = DEFAULT_API_KEY
    environment: str = "development"
    jwt_secret: str = DEFAULT_JWT_SECRET
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

    @model_validator(mode="after")
    def _no_placeholder_secrets_in_production(self):
        # Outside development a missing key disables auth and the default JWT secret lets
        # anyone forge logins, so fail at startup instead of running open.
        if self.environment != "development":
            if not self.api_key or self.api_key == DEFAULT_API_KEY or self.api_key.startswith("change-me"):
                raise ValueError("API_KEY must be set to a real value when ENVIRONMENT is not development")
            if self.jwt_secret == DEFAULT_JWT_SECRET or self.jwt_secret.startswith("change-me"):
                raise ValueError("JWT_SECRET must be set to a real value when ENVIRONMENT is not development")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
