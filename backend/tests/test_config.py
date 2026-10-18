# tests/test_config.py
"""A production deploy with placeholder secrets must refuse to start, not run insecurely."""
import pytest
from pydantic import ValidationError

from app.config import DEFAULT_JWT_SECRET, Settings


def make(**kw):
    return Settings(_env_file=None, **kw)


def test_development_allows_defaults():
    make(environment="development")


def test_production_rejects_default_jwt_secret():
    with pytest.raises(ValidationError, match="JWT_SECRET"):
        make(environment="production", api_key="real", jwt_secret=DEFAULT_JWT_SECRET)


def test_production_rejects_empty_api_key():
    with pytest.raises(ValidationError, match="API_KEY"):
        make(environment="production", api_key="", jwt_secret="x" * 40)


def test_production_rejects_dev_api_key():
    with pytest.raises(ValidationError, match="API_KEY"):
        make(environment="production", api_key="dev-key", jwt_secret="x" * 40)


def test_production_with_real_secrets_is_fine():
    make(environment="production", api_key="real-key", jwt_secret="x" * 40)


def test_production_rejects_unedited_example_placeholders():
    with pytest.raises(ValidationError):
        make(environment="production", api_key="change-me-before-deploying", jwt_secret="x" * 40)
    with pytest.raises(ValidationError):
        make(environment="production", api_key="real", jwt_secret="change-me-generate-a-real-random-secret")
