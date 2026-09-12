from datetime import datetime, timezone, timedelta
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User

_bearer_scheme = HTTPBearer(auto_error=False)
_ALGORITHM = "HS256"
_EXPIRY_DAYS = 30


def create_jwt(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=_EXPIRY_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=_ALGORITHM)


def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(
    authorization: str = Depends(lambda credentials=Depends(_bearer_scheme): (
        credentials.credentials if credentials else None
    )),
    db: Session = Depends(get_db),
) -> User:
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[-1] if authorization.startswith("Bearer") else authorization
    payload = decode_jwt(token)
    user = db.query(User).filter_by(id=payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
