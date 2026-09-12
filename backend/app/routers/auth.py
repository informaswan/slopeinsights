import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.database import get_db
from app.auth import create_jwt, get_current_user
from app.config import settings
from app.models.user import User
from app.schemas.auth import (
    GoogleAuthRequest, AppleAuthRequest, AuthResponse, UserResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id, name=user.name, email=user.email,
        avatar_url=user.avatar_url, provider=user.provider,
    )


@router.post("/auth/google", response_model=AuthResponse)
def google_auth(body: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        id_info = id_token.verify_oauth2_token(
            body.id_token, google_requests.Request(),
        )
    except Exception as e:
        logger.warning("Google token verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Invalid Google token")

    provider_id = id_info["sub"]
    email = id_info.get("email", "")
    name = id_info.get("name", email.split("@")[0])
    picture = id_info.get("picture")

    user = db.query(User).filter_by(provider_id=provider_id).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            name=name, email=email, avatar_url=picture,
            provider="google", provider_id=provider_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_jwt(user_id=user.id, email=user.email)
    return AuthResponse(token=token, user=_user_response(user))


@router.post("/auth/apple", response_model=AuthResponse)
def apple_auth(body: AppleAuthRequest, db: Session = Depends(get_db)):
    import jwt as pyjwt
    try:
        payload = pyjwt.decode(body.identity_token, options={"verify_signature": False})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Apple token")

    provider_id = payload["sub"]
    email = payload.get("email", "")
    name = body.name or email.split("@")[0]

    user = db.query(User).filter_by(provider_id=provider_id).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            name=name, email=email, avatar_url=None,
            provider="apple", provider_id=provider_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_jwt(user_id=user.id, email=user.email)
    return AuthResponse(token=token, user=_user_response(user))


@router.post("/auth/dev", response_model=AuthResponse)
def dev_auth(db: Session = Depends(get_db)):
    if settings.environment != "development":
        raise HTTPException(status_code=404, detail="Not found")
    dev_provider_id = "dev-user-001"
    user = db.query(User).filter_by(provider_id=dev_provider_id).first()
    if not user:
        user = User(
            id="dev-user-" + str(uuid.uuid4())[:8],
            name="Dev User",
            email="dev@slopeinsights.local",
            avatar_url=None,
            provider="dev",
            provider_id=dev_provider_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_jwt(user_id=user.id, email=user.email)
    return AuthResponse(token=token, user=_user_response(user))


@router.get("/auth/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return _user_response(user)
