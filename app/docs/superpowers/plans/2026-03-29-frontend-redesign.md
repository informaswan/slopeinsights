# PowderPass Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google/Apple social auth, personalized home page with saved mountain preferences, dual light/dark color theme, mountain logo, and proper header titles.

**Architecture:** Backend-first approach — add auth models and endpoints to FastAPI, then build the frontend theme system, auth context, and new screens on top. Each task produces a working, testable increment.

**Tech Stack:** FastAPI + SQLAlchemy (backend), React Native + Expo Router (frontend), PyJWT (token signing), expo-auth-session + expo-apple-authentication (social login), React Context (theme + auth state), AsyncStorage (dark mode preference + web JWT fallback)

---

## File Structure

### Backend — New Files
- `backend/app/models/user.py` — User + UserResort SQLAlchemy models
- `backend/app/schemas/auth.py` — Pydantic schemas for auth endpoints
- `backend/app/routers/auth.py` — Auth router (Google, Apple, /me)
- `backend/app/routers/user_resorts.py` — User resort preference endpoints
- `backend/app/auth.py` — JWT create/decode utilities + get_current_user dependency
- `backend/tests/test_auth.py` — Auth endpoint tests
- `backend/tests/test_user_resorts.py` — User resort endpoint tests

### Backend — Modified Files
- `backend/app/config.py` — Add `jwt_secret` setting
- `backend/app/main.py` — Register new routers
- `backend/requirements.txt` — Add PyJWT, google-auth

### Frontend — New Files
- `app/constants/theme.ts` — Rewrite with LightColors + DarkColors
- `app/contexts/ThemeContext.tsx` — Theme provider + useTheme hook
- `app/contexts/AuthContext.tsx` — Auth provider + useAuth hook
- `app/lib/tokenStorage.ts` — JWT storage (expo-secure-store native, AsyncStorage web)
- `app/components/MountainLogo.tsx` — SVG mountain logo component
- `app/app/login.tsx` — Login screen
- `app/app/onboarding.tsx` — Mountain picker screen
- `app/app/explore.tsx` — Browse/manage all resorts screen
- `app/app/profile.tsx` — Profile/settings screen

### Frontend — Modified Files
- `app/lib/api.ts` — Add auth header, auth + user resort API methods
- `app/lib/types.ts` — Add User, AuthResponse types
- `app/app/_layout.tsx` — Auth-aware routing
- `app/app/index.tsx` — Filter to saved resorts, new header, theming
- `app/app/resort/[id].tsx` — Dynamic header title, theming
- `app/components/ResortCard.tsx` — Theme-aware colors
- `app/components/BestBanner.tsx` — Theme-aware colors
- `app/components/FilterSheet.tsx` — Theme-aware colors
- `app/components/FilterSheet.web.tsx` — Theme-aware colors
- `app/components/SnowStats.tsx` — Theme-aware colors
- `app/components/CrowdChart.tsx` — Theme-aware colors
- `app/components/WeatherRow.tsx` — Theme-aware colors
- `app/components/LiftList.tsx` — Theme-aware colors
- `app/components/ParkingSection.tsx` — Theme-aware colors

---

### Task 1: Backend User + UserResort Models

**Files:**
- Create: `backend/app/models/user.py`
- Modify: `backend/app/config.py`
- Modify: `backend/requirements.txt`
- Test: `backend/tests/test_auth.py`

- [ ] **Step 1: Add PyJWT and google-auth to requirements**

Append to `backend/requirements.txt`:
```
PyJWT==2.9.0
google-auth==2.37.0
```

- [ ] **Step 2: Add jwt_secret to config**

In `backend/app/config.py`, add the `jwt_secret` field to the `Settings` class:
```python
jwt_secret: str = "dev-secret-change-in-production"
```

- [ ] **Step 3: Create the User and UserResort models**

Create `backend/app/models/user.py`:
```python
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)  # UUID string
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    avatar_url = Column(String, nullable=True)
    provider = Column(String, nullable=False)  # "google" | "apple"
    provider_id = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class UserResort(Base):
    __tablename__ = "user_resorts"
    __table_args__ = (UniqueConstraint("user_id", "resort_id"),)

    id = Column(String, primary_key=True)  # UUID string
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    resort_id = Column(String, ForeignKey("resorts.id"), nullable=False)
    added_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
```

- [ ] **Step 4: Write test that models create tables**

Create `backend/tests/test_auth.py`:
```python
from app.models.user import User, UserResort


def test_user_table_exists(db):
    """User and UserResort tables are created by the autouse setup_db fixture."""
    from sqlalchemy import inspect
    inspector = inspect(db.bind)
    tables = inspector.get_table_names()
    assert "users" in tables
    assert "user_resorts" in tables


def test_create_user(db):
    import uuid
    user = User(
        id=str(uuid.uuid4()),
        name="Test User",
        email="test@example.com",
        provider="google",
        provider_id="google-123",
    )
    db.add(user)
    db.commit()
    fetched = db.query(User).filter_by(email="test@example.com").first()
    assert fetched is not None
    assert fetched.name == "Test User"
    assert fetched.provider == "google"
```

- [ ] **Step 5: Run tests**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && python -m pytest tests/test_auth.py -v`
Expected: 2 tests PASS

- [ ] **Step 6: Install new deps**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && pip install PyJWT==2.9.0 google-auth==2.37.0`

- [ ] **Step 7: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/backend
git add app/models/user.py app/config.py requirements.txt tests/test_auth.py
git commit -m "feat: add User and UserResort models with JWT config"
```

---

### Task 2: Backend JWT Utilities

**Files:**
- Create: `backend/app/auth.py`
- Test: `backend/tests/test_auth.py` (append)

- [ ] **Step 1: Write failing tests for JWT create/decode and get_current_user**

Append to `backend/tests/test_auth.py`:
```python
import pytest
from app.auth import create_jwt, decode_jwt, get_current_user
from fastapi import HTTPException


def test_create_and_decode_jwt():
    token = create_jwt(user_id="user-abc", email="a@b.com")
    payload = decode_jwt(token)
    assert payload["sub"] == "user-abc"
    assert payload["email"] == "a@b.com"


def test_decode_jwt_invalid_token():
    with pytest.raises(HTTPException) as exc_info:
        decode_jwt("not.a.valid.token")
    assert exc_info.value.status_code == 401


def test_get_current_user_returns_user(db):
    import uuid
    from app.models.user import User
    uid = str(uuid.uuid4())
    user = User(id=uid, name="JWT User", email="jwt@test.com",
                provider="google", provider_id="gid-jwt")
    db.add(user)
    db.commit()
    token = create_jwt(user_id=uid, email="jwt@test.com")
    # get_current_user is an async dependency — call the inner logic
    from unittest.mock import MagicMock
    request = MagicMock()
    request.headers.get.return_value = f"Bearer {token}"
    result = get_current_user(authorization=f"Bearer {token}", db=db)
    assert result.id == uid
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && python -m pytest tests/test_auth.py::test_create_and_decode_jwt tests/test_auth.py::test_decode_jwt_invalid_token tests/test_auth.py::test_get_current_user_returns_user -v`
Expected: FAIL — `app.auth` does not exist yet

- [ ] **Step 3: Implement JWT utilities**

Create `backend/app/auth.py`:
```python
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
    # Handle "Bearer xxx" if full header is passed, or just the token
    token = authorization.split(" ")[-1] if authorization.startswith("Bearer") else authorization
    payload = decode_jwt(token)
    user = db.query(User).filter_by(id=payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && python -m pytest tests/test_auth.py -v`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/backend
git add app/auth.py tests/test_auth.py
git commit -m "feat: add JWT create/decode utilities and get_current_user dependency"
```

---

### Task 3: Backend Auth Router (Google + Apple endpoints)

**Files:**
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/routers/auth.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_auth.py` (append)

- [ ] **Step 1: Create auth schemas**

Create `backend/app/schemas/auth.py`:
```python
from pydantic import BaseModel


class GoogleAuthRequest(BaseModel):
    id_token: str


class AppleAuthRequest(BaseModel):
    identity_token: str
    name: str | None = None  # Apple only sends name on first sign-in


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: str | None
    provider: str
```

- [ ] **Step 2: Write failing tests for auth endpoints**

Append to `backend/tests/test_auth.py`:
```python
from unittest.mock import patch, MagicMock


def test_google_auth_creates_user(client):
    mock_id_info = {
        "sub": "google-new-user-123",
        "email": "new@google.com",
        "name": "New Google User",
        "picture": "https://example.com/pic.jpg",
    }
    with patch("app.routers.auth.id_token.verify_oauth2_token", return_value=mock_id_info):
        resp = client.post("/api/auth/google", json={"id_token": "fake-google-token"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["email"] == "new@google.com"
    assert data["user"]["name"] == "New Google User"
    assert "token" in data


def test_google_auth_returns_existing_user(client, db):
    import uuid
    from app.models.user import User
    uid = str(uuid.uuid4())
    db.add(User(id=uid, name="Existing", email="existing@google.com",
                provider="google", provider_id="google-existing-456"))
    db.commit()
    mock_id_info = {
        "sub": "google-existing-456",
        "email": "existing@google.com",
        "name": "Existing",
        "picture": None,
    }
    with patch("app.routers.auth.id_token.verify_oauth2_token", return_value=mock_id_info):
        resp = client.post("/api/auth/google", json={"id_token": "fake-token"})
    assert resp.status_code == 200
    assert resp.json()["user"]["id"] == uid


def test_auth_me_returns_current_user(client, db):
    import uuid
    from app.models.user import User
    from app.auth import create_jwt
    uid = str(uuid.uuid4())
    db.add(User(id=uid, name="Me User", email="me@test.com",
                provider="google", provider_id="gid-me"))
    db.commit()
    token = create_jwt(user_id=uid, email="me@test.com")
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@test.com"


def test_auth_me_rejects_no_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && python -m pytest tests/test_auth.py::test_google_auth_creates_user tests/test_auth.py::test_auth_me_returns_current_user -v`
Expected: FAIL — router not registered

- [ ] **Step 4: Implement auth router**

Create `backend/app/routers/auth.py`:
```python
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.database import get_db
from app.auth import create_jwt, get_current_user
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
            name=name,
            email=email,
            avatar_url=picture,
            provider="google",
            provider_id=provider_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_jwt(user_id=user.id, email=user.email)
    return AuthResponse(token=token, user=_user_response(user))


@router.post("/auth/apple", response_model=AuthResponse)
def apple_auth(body: AppleAuthRequest, db: Session = Depends(get_db)):
    # Apple identity token is a JWT signed by Apple.
    # In production, verify with Apple's public keys.
    # For now, decode without verification (development mode).
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
            name=name,
            email=email,
            avatar_url=None,
            provider="apple",
            provider_id=provider_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_jwt(user_id=user.id, email=user.email)
    return AuthResponse(token=token, user=_user_response(user))


@router.get("/auth/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return _user_response(user)
```

- [ ] **Step 5: Register auth router in main.py**

In `backend/app/main.py`, add after the existing router import:
```python
from app.routers import auth as auth_router
```

And after `app.include_router(resorts_router.router, prefix="/api")`:
```python
app.include_router(auth_router.router, prefix="/api")
```

- [ ] **Step 6: Run tests**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && python -m pytest tests/test_auth.py -v`
Expected: All 9 tests PASS

- [ ] **Step 7: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/backend
git add app/schemas/auth.py app/routers/auth.py app/main.py tests/test_auth.py
git commit -m "feat: add Google + Apple auth endpoints with JWT"
```

---

### Task 4: Backend User Resorts Endpoints

**Files:**
- Create: `backend/app/routers/user_resorts.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_user_resorts.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_user_resorts.py`:
```python
import uuid
import pytest
from app.models.user import User, UserResort
from app.models.resort import Resort
from app.auth import create_jwt


def _make_user(db, email="test@test.com"):
    uid = str(uuid.uuid4())
    user = User(id=uid, name="Test", email=email, provider="google", provider_id=f"gid-{uid}")
    db.add(user)
    db.commit()
    return user


def _make_resort(db, resort_id="vail", name="Vail", pass_type="epic"):
    resort = Resort(
        id=resort_id, name=name, pass_type=pass_type,
        region="Colorado", state="CO", country="US",
        latitude=39.6, longitude=-106.4,
        summit_elevation_ft=11570, vertical_drop_ft=3450,
        timezone="America/Denver", liftie_id="vail",
        onthesnow_slug="vail",
    )
    db.add(resort)
    db.commit()
    return resort


def test_get_user_resorts_empty(client, db):
    user = _make_user(db)
    token = create_jwt(user_id=user.id, email=user.email)
    resp = client.get("/api/users/me/resorts", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json() == {"resort_ids": []}


def test_put_user_resorts(client, db):
    user = _make_user(db)
    _make_resort(db, "vail", "Vail")
    _make_resort(db, "breck", "Breckenridge")
    token = create_jwt(user_id=user.id, email=user.email)
    resp = client.put(
        "/api/users/me/resorts",
        headers={"Authorization": f"Bearer {token}"},
        json={"resort_ids": ["vail", "breck"]},
    )
    assert resp.status_code == 200
    assert set(resp.json()["resort_ids"]) == {"vail", "breck"}


def test_put_user_resorts_replaces(client, db):
    user = _make_user(db)
    _make_resort(db, "vail", "Vail")
    _make_resort(db, "breck", "Breckenridge")
    token = create_jwt(user_id=user.id, email=user.email)
    # First set
    client.put("/api/users/me/resorts", headers={"Authorization": f"Bearer {token}"},
               json={"resort_ids": ["vail", "breck"]})
    # Replace with just one
    resp = client.put("/api/users/me/resorts", headers={"Authorization": f"Bearer {token}"},
                      json={"resort_ids": ["breck"]})
    assert resp.json()["resort_ids"] == ["breck"]


def test_put_user_resorts_rejects_unauthenticated(client):
    resp = client.put("/api/users/me/resorts", json={"resort_ids": ["vail"]})
    assert resp.status_code == 401
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && python -m pytest tests/test_user_resorts.py -v`
Expected: FAIL — router not found

- [ ] **Step 3: Implement user resorts router**

Create `backend/app/routers/user_resorts.py`:
```python
import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User, UserResort

router = APIRouter()


class UserResortsResponse(BaseModel):
    resort_ids: list[str]


class UpdateUserResortsRequest(BaseModel):
    resort_ids: list[str]


@router.get("/users/me/resorts", response_model=UserResortsResponse)
def get_user_resorts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(UserResort).filter_by(user_id=user.id).all()
    return UserResortsResponse(resort_ids=[r.resort_id for r in rows])


@router.put("/users/me/resorts", response_model=UserResortsResponse)
def update_user_resorts(
    body: UpdateUserResortsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Delete existing
    db.query(UserResort).filter_by(user_id=user.id).delete()
    # Insert new
    for resort_id in body.resort_ids:
        db.add(UserResort(id=str(uuid.uuid4()), user_id=user.id, resort_id=resort_id))
    db.commit()
    return UserResortsResponse(resort_ids=body.resort_ids)
```

- [ ] **Step 4: Register router in main.py**

In `backend/app/main.py`, add import:
```python
from app.routers import user_resorts as user_resorts_router
```

Add after other `include_router` calls:
```python
app.include_router(user_resorts_router.router, prefix="/api")
```

- [ ] **Step 5: Run tests**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && python -m pytest tests/test_user_resorts.py -v`
Expected: All 4 tests PASS

- [ ] **Step 6: Run all backend tests**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && python -m pytest tests/ -v`
Expected: All tests PASS (existing + new)

- [ ] **Step 7: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/backend
git add app/routers/user_resorts.py app/main.py tests/test_user_resorts.py
git commit -m "feat: add user resort preference endpoints (GET/PUT /users/me/resorts)"
```

---

### Task 5: Alembic Migration for User Tables

**Files:**
- New alembic migration file (auto-generated)

- [ ] **Step 1: Generate migration**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && alembic revision --autogenerate -m "add users and user_resorts tables"`

- [ ] **Step 2: Review the generated migration file**

Read the generated file in `backend/alembic/versions/` and verify it creates `users` and `user_resorts` tables with correct columns and constraints.

- [ ] **Step 3: Run migration**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && alembic upgrade head`

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/backend
git add alembic/versions/
git commit -m "feat: add alembic migration for users and user_resorts tables"
```

---

### Task 6: Frontend Theme System (Light + Dark)

**Files:**
- Modify: `app/constants/theme.ts`
- Create: `app/contexts/ThemeContext.tsx`

- [ ] **Step 1: Rewrite theme.ts with dual color schemes**

Replace the contents of `app/constants/theme.ts`:
```typescript
// constants/theme.ts — Alpine Morning (light) + Deep Ocean (dark)

export const LightColors = {
  // Backgrounds
  headerGradientStart: '#1e3a5f',
  headerGradientEnd: '#2d5a87',
  background: '#f0f4f8',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  // Text
  text: '#1e3a5f',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  // Borders
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  // Pass types
  epic: '#3B82F6',
  epicBg: 'rgba(59,130,246,0.1)',
  ikon: '#F97316',
  ikonBg: 'rgba(249,115,22,0.1)',
  // Crowd levels
  crowdLow: '#059669',
  crowdLowBg: 'rgba(52,211,153,0.1)',
  crowdMedium: '#d97706',
  crowdMediumBg: 'rgba(251,191,36,0.1)',
  crowdHigh: '#ef4444',
  crowdHighBg: 'rgba(239,68,68,0.1)',
  // Accents
  snowBlue: '#3B82F6',
  warning: '#d97706',
  // Header text
  headerText: '#ffffff',
  headerTextSecondary: '#a8d4f0',
};

export const DarkColors = {
  // Backgrounds
  headerGradientStart: '#0f2942',
  headerGradientEnd: '#163d5e',
  background: '#0c1f33',
  surface: '#132d47',
  surfaceAlt: '#1a3550',
  // Text
  text: '#e0eaf5',
  textSecondary: '#6a94b8',
  textMuted: '#4a7a9e',
  // Borders
  border: 'rgba(106,148,184,0.2)',
  borderSubtle: 'rgba(106,148,184,0.1)',
  // Pass types
  epic: '#7cb8f7',
  epicBg: 'rgba(59,130,246,0.2)',
  ikon: '#fb923c',
  ikonBg: 'rgba(249,115,22,0.2)',
  // Crowd levels
  crowdLow: '#6ee7b7',
  crowdLowBg: 'rgba(52,211,153,0.12)',
  crowdMedium: '#fcd34d',
  crowdMediumBg: 'rgba(251,191,36,0.12)',
  crowdHigh: '#fca5a5',
  crowdHighBg: 'rgba(239,68,68,0.12)',
  // Accents
  snowBlue: '#7cb8f7',
  warning: '#fcd34d',
  // Header text
  headerText: '#c8dff0',
  headerTextSecondary: '#5a9bc4',
};

export type ThemeColors = typeof LightColors;

// Keep legacy export for backward compatibility during migration
export const Colors = LightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 30,
  hero: 40,
};

export const Radius = {
  sm: 4,
  md: 8,
  lg: 14,
  xl: 20,
  full: 999,
};
```

- [ ] **Step 2: Create ThemeContext**

Create `app/contexts/ThemeContext.tsx`:
```tsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors, type ThemeColors } from '../constants/theme';

const STORAGE_KEY = 'powderpass_dark_mode';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LightColors,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'true') setIsDark(true);
    });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  const value = useMemo(
    () => ({ colors: isDark ? DarkColors : LightColors, isDark, toggleTheme }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

- [ ] **Step 3: Verify no import errors**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/app && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to theme.ts or ThemeContext.tsx (other pre-existing errors are OK)

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add constants/theme.ts contexts/ThemeContext.tsx
git commit -m "feat: add dual light/dark theme system with ThemeContext"
```

---

### Task 7: Frontend Auth Context + Token Storage + API Updates

**Files:**
- Create: `app/lib/tokenStorage.ts`
- Create: `app/contexts/AuthContext.tsx`
- Modify: `app/lib/api.ts`
- Modify: `app/lib/types.ts`

- [ ] **Step 1: Add auth types to types.ts**

Append to `app/lib/types.ts`:
```typescript

// Auth types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  provider: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface UserResortsResponse {
  resort_ids: string[];
}
```

- [ ] **Step 2: Create token storage**

Create `app/lib/tokenStorage.ts`:
```typescript
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'powderpass_jwt';

// Use AsyncStorage for web; on native, expo-secure-store is preferred
// but falls back to AsyncStorage if not available.
let SecureStore: typeof import('expo-secure-store') | null = null;

if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch {
    // expo-secure-store not installed — fall back to AsyncStorage
  }
}

export async function getToken(): Promise<string | null> {
  if (SecureStore) {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (SecureStore) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
}

export async function clearToken(): Promise<void> {
  if (SecureStore) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}
```

- [ ] **Step 3: Update api.ts with auth header + new methods**

Replace `app/lib/api.ts`:
```typescript
// lib/api.ts
import type {
  ResortSummary, ResortDetail, BestResortResponse,
  AuthResponse, UserProfile, UserResortsResponse,
} from './types';
import { getToken } from './tokenStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const API_KEY  = process.env.EXPO_PUBLIC_API_KEY  ?? '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'X-API-Key': API_KEY,
    'Bypass-Tunnel-Reminder': 'true',
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  // Resorts
  getResorts:      ()           => apiFetch<ResortSummary[]>('/api/resorts'),
  getBestResorts:  ()           => apiFetch<BestResortResponse>('/api/resorts/best'),
  getResortDetail: (id: string) => apiFetch<ResortDetail>(`/api/resorts/${id}`),
  // Auth
  authGoogle: (idToken: string) =>
    apiFetch<AuthResponse>('/api/auth/google', {
      method: 'POST', body: JSON.stringify({ id_token: idToken }),
    }),
  authApple: (identityToken: string, name?: string) =>
    apiFetch<AuthResponse>('/api/auth/apple', {
      method: 'POST', body: JSON.stringify({ identity_token: identityToken, name }),
    }),
  getMe: () => apiFetch<UserProfile>('/api/auth/me'),
  // User resorts
  getUserResorts: () => apiFetch<UserResortsResponse>('/api/users/me/resorts'),
  updateUserResorts: (resortIds: string[]) =>
    apiFetch<UserResortsResponse>('/api/users/me/resorts', {
      method: 'PUT', body: JSON.stringify({ resort_ids: resortIds }),
    }),
};
```

- [ ] **Step 4: Create AuthContext**

Create `app/contexts/AuthContext.tsx`:
```tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { getToken, setToken, clearToken } from '../lib/tokenStorage';
import type { UserProfile } from '../lib/types';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  savedResortIds: string[];
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInWithApple: (identityToken: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshResorts: () => Promise<void>;
  updateResorts: (ids: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  savedResortIds: [],
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
  refreshResorts: async () => {},
  updateResorts: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedResortIds, setSavedResortIds] = useState<string[]>([]);

  // Check for existing token on mount
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          const me = await api.getMe();
          setUser(me);
          const resorts = await api.getUserResorts();
          setSavedResortIds(resorts.resort_ids);
        } catch {
          await clearToken();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    const resp = await api.authGoogle(idToken);
    await setToken(resp.token);
    setUser(resp.user);
    const resorts = await api.getUserResorts();
    setSavedResortIds(resorts.resort_ids);
  }, []);

  const signInWithApple = useCallback(async (identityToken: string, name?: string) => {
    const resp = await api.authApple(identityToken, name);
    await setToken(resp.token);
    setUser(resp.user);
    const resorts = await api.getUserResorts();
    setSavedResortIds(resorts.resort_ids);
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
    setSavedResortIds([]);
  }, []);

  const refreshResorts = useCallback(async () => {
    const resorts = await api.getUserResorts();
    setSavedResortIds(resorts.resort_ids);
  }, []);

  const updateResorts = useCallback(async (ids: string[]) => {
    const resp = await api.updateUserResorts(ids);
    setSavedResortIds(resp.resort_ids);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, isAuthenticated: !!user, isLoading, savedResortIds,
        signInWithGoogle, signInWithApple, signOut, refreshResorts, updateResorts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add lib/types.ts lib/tokenStorage.ts lib/api.ts contexts/AuthContext.tsx
git commit -m "feat: add auth context, token storage, and auth API methods"
```

---

### Task 8: Mountain Logo Component

**Files:**
- Create: `app/components/MountainLogo.tsx`

- [ ] **Step 1: Create the SVG mountain logo component**

Create `app/components/MountainLogo.tsx`:
```tsx
import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Line } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  snowColor?: string;
}

export function MountainLogo({ size = 64, color = '#ffffff', snowColor = '#BAE6FD' }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {/* Outer mountain */}
        <Polygon
          points="32,8 52,48 12,48"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Inner mountain */}
        <Polygon
          points="32,20 42,42 22,42"
          fill={color + '33'}
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Snow line */}
        <Line
          x1="24" y1="36" x2="40" y2="36"
          stroke={snowColor}
          strokeWidth="2"
          opacity={0.6}
        />
      </Svg>
    </View>
  );
}
```

- [ ] **Step 2: Install react-native-svg if not already installed**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/app && npx expo install react-native-svg`

- [ ] **Step 3: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add components/MountainLogo.tsx package.json
git commit -m "feat: add geometric mountain logo SVG component"
```

---

### Task 9: Login Screen

**Files:**
- Create: `app/app/login.tsx`

- [ ] **Step 1: Create login screen**

Create `app/app/login.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../contexts/AuthContext';
import { MountainLogo } from '../components/MountainLogo';
import { LightColors, Spacing, FontSize, Radius } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.params.id_token;
      setLoading(true);
      signInWithGoogle(idToken)
        .catch(() => setError('Google sign-in failed'))
        .finally(() => setLoading(false));
    }
  }, [googleResponse]);

  const handleAppleSignIn = async () => {
    if (Platform.OS === 'web') {
      setError('Apple Sign-In is not available on web');
      return;
    }
    try {
      setLoading(true);
      const AppleAuth = require('expo-apple-authentication');
      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });
      const name = credential.fullName
        ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim()
        : undefined;
      await signInWithApple(credential.identityToken!, name || undefined);
    } catch {
      setError('Apple sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[LightColors.headerGradientStart, LightColors.headerGradientEnd, LightColors.background]}
      locations={[0, 0.4, 1]}
      style={styles.container}
    >
      <View style={styles.logoArea}>
        <MountainLogo size={64} color="#fff" snowColor="#BAE6FD" />
        <Text style={styles.wordmark}>PowderPass</Text>
        <Text style={styles.tagline}>Real-time ski conditions at a glance</Text>
      </View>

      <View style={styles.buttonArea}>
        {loading ? (
          <ActivityIndicator size="large" color={LightColors.headerGradientStart} />
        ) : (
          <>
            <Pressable style={styles.googleButton} onPress={() => googlePromptAsync()}>
              <Text style={styles.googleText}>Continue with Google</Text>
            </Pressable>

            {Platform.OS !== 'web' && (
              <Pressable style={styles.appleButton} onPress={handleAppleSignIn}>
                <Text style={styles.appleText}>Continue with Apple</Text>
              </Pressable>
            )}
          </>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <Text style={styles.terms}>
        By continuing, you agree to PowderPass Terms of Service and Privacy Policy
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  logoArea: { alignItems: 'center', marginBottom: Spacing.xxl },
  wordmark: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: Spacing.md, letterSpacing: -0.5 },
  tagline: { color: '#a8d4f0', fontSize: FontSize.md, marginTop: Spacing.xs },
  buttonArea: { width: '100%', maxWidth: 320, gap: Spacing.md },
  googleButton: {
    backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  googleText: { fontSize: FontSize.md, fontWeight: '600', color: '#1a1a2e' },
  appleButton: {
    backgroundColor: '#000', borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  appleText: { fontSize: FontSize.md, fontWeight: '600', color: '#fff' },
  errorText: { color: '#ef4444', fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.sm },
  terms: { color: '#7a9cc6', fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing.lg, maxWidth: 280 },
});
```

- [ ] **Step 2: Install required expo packages**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/app && npx expo install expo-linear-gradient expo-web-browser expo-auth-session expo-crypto`

Note: `expo-apple-authentication` is only needed for native iOS builds. Install it when building for iOS: `npx expo install expo-apple-authentication`

- [ ] **Step 3: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add app/login.tsx package.json
git commit -m "feat: add login screen with Google + Apple social auth"
```

---

### Task 10: Onboarding Screen

**Files:**
- Create: `app/app/onboarding.tsx`

- [ ] **Step 1: Create onboarding screen**

Create `app/app/onboarding.tsx`:
```tsx
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useResorts } from '../hooks/useResorts';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '../constants/theme';

type PassTab = 'epic' | 'ikon';

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { resorts } = useResorts();
  const { updateResorts } = useAuth();
  const [activeTab, setActiveTab] = useState<PassTab>('epic');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const filtered = resorts.filter((r) => r.pass_type === activeTab);
    const groups: Record<string, typeof filtered> = {};
    for (const r of filtered) {
      const region = r.state || r.region || 'Other';
      if (!groups[region]) groups[region] = [];
      groups[region].push(r);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [resorts, activeTab]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    await updateResorts(Array.from(selected));
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Pick Your Mountains</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select the resorts you want to track. You can change these anytime.
        </Text>
      </View>

      {/* Pass type tabs */}
      <View style={styles.tabs}>
        {(['epic', 'ikon'] as PassTab[]).map((tab) => {
          const isActive = activeTab === tab;
          const tabColor = tab === 'epic' ? colors.epic : colors.ikon;
          return (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                isActive
                  ? { backgroundColor: tabColor }
                  : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: isActive ? '#fff' : colors.textSecondary }]}>
                {tab === 'epic' ? 'Epic' : 'Ikon'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Resort list by region */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {grouped.map(([region, regionResorts]) => (
          <View key={region}>
            <Text style={[styles.regionLabel, { color: colors.textMuted }]}>{region.toUpperCase()}</Text>
            {regionResorts.map((resort) => {
              const isSelected = selected.has(resort.id);
              const passColor = resort.pass_type === 'epic' ? colors.epic : colors.ikon;
              return (
                <Pressable
                  key={resort.id}
                  style={[
                    styles.resortRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isSelected ? passColor : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => toggle(resort.id)}
                >
                  <View>
                    <Text style={[styles.resortName, { color: colors.text }]}>{resort.name}</Text>
                    <Text style={[styles.resortLocation, { color: colors.textMuted }]}>
                      {resort.state ? `${resort.region}, ${resort.state}` : resort.region}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected
                        ? { backgroundColor: passColor }
                        : { borderWidth: 2, borderColor: colors.border },
                    ]}
                  >
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
          {selected.size} resort{selected.size !== 1 ? 's' : ''} selected
        </Text>
        <Pressable
          style={[styles.submitButton, { opacity: selected.size === 0 ? 0.5 : 1 }]}
          onPress={handleSubmit}
          disabled={selected.size === 0}
        >
          <Text style={styles.submitText}>Let's Go</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: Spacing.lg, borderBottomWidth: 1 },
  title: { fontSize: FontSize.xl, fontWeight: '800' },
  subtitle: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  tabs: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, paddingBottom: 0 },
  tab: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full },
  tabText: { fontSize: FontSize.sm, fontWeight: '700' },
  list: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  regionLabel: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.md },
  resortRow: {
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  resortName: { fontSize: FontSize.md, fontWeight: '700' },
  resortLocation: { fontSize: FontSize.xs, marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderTopWidth: 1,
  },
  selectedCount: { fontSize: FontSize.sm },
  submitButton: {
    backgroundColor: '#1e3a5f', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
```

- [ ] **Step 2: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add app/onboarding.tsx
git commit -m "feat: add onboarding screen with mountain picker by pass type + region"
```

---

### Task 11: Explore Screen

**Files:**
- Create: `app/app/explore.tsx`

- [ ] **Step 1: Create explore screen**

Create `app/app/explore.tsx`:
```tsx
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useResorts } from '../hooks/useResorts';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '../constants/theme';

type PassTab = 'all' | 'epic' | 'ikon';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { resorts } = useResorts();
  const { savedResortIds, updateResorts } = useAuth();
  const [search, setSearch] = useState('');
  const [passTab, setPassTab] = useState<PassTab>('all');

  const savedSet = useMemo(() => new Set(savedResortIds), [savedResortIds]);

  const grouped = useMemo(() => {
    let filtered = resorts;
    if (passTab !== 'all') filtered = filtered.filter((r) => r.pass_type === passTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(q));
    }
    const groups: Record<string, typeof filtered> = {};
    for (const r of filtered) {
      const region = r.state || r.region || 'Other';
      if (!groups[region]) groups[region] = [];
      groups[region].push(r);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [resorts, passTab, search]);

  const handleToggle = async (resortId: string) => {
    const next = savedSet.has(resortId)
      ? savedResortIds.filter((id) => id !== resortId)
      : [...savedResortIds, resortId];
    await updateResorts(next);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Explore Resorts</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={{ color: colors.textMuted }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search resorts..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={styles.passTabs}>
          {(['all', 'epic', 'ikon'] as PassTab[]).map((tab) => {
            const isActive = passTab === tab;
            const tabColor = tab === 'epic' ? colors.epic : tab === 'ikon' ? colors.ikon : colors.textSecondary;
            return (
              <Pressable
                key={tab}
                style={[
                  styles.passTab,
                  isActive
                    ? { backgroundColor: tab === 'epic' ? colors.epicBg : tab === 'ikon' ? colors.ikonBg : colors.background }
                    : { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
                ]}
                onPress={() => setPassTab(tab)}
              >
                <Text style={[styles.passTabText, { color: isActive ? tabColor : colors.textMuted }]}>
                  {tab === 'all' ? 'All' : tab === 'epic' ? 'Epic' : 'Ikon'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {grouped.map(([region, regionResorts]) => (
          <View key={region}>
            <Text style={[styles.regionLabel, { color: colors.textMuted }]}>{region.toUpperCase()}</Text>
            {regionResorts.map((resort) => {
              const isSaved = savedSet.has(resort.id);
              const passColor = resort.pass_type === 'epic' ? colors.epic : colors.ikon;
              return (
                <View
                  key={resort.id}
                  style={[styles.resortRow, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.resortInfo}>
                    <View style={[styles.passBar, { backgroundColor: passColor }]} />
                    <View>
                      <Text style={[styles.resortName, { color: colors.text }]}>{resort.name}</Text>
                      <Text style={[styles.resortLocation, { color: colors.textMuted }]}>
                        {resort.state ? `${resort.region}, ${resort.state}` : resort.region}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={[
                      styles.actionButton,
                      isSaved
                        ? { backgroundColor: '#fee2e2' }
                        : { backgroundColor: '#1e3a5f' },
                    ]}
                    onPress={() => handleToggle(resort.id)}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        { color: isSaved ? '#ef4444' : '#fff' },
                      ]}
                    >
                      {isSaved ? 'Remove' : '+ Add'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: Spacing.md, borderBottomWidth: 1 },
  title: { fontSize: FontSize.xl, fontWeight: '800', marginBottom: Spacing.sm },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.sm + 2, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.md },
  passTabs: { flexDirection: 'row', gap: Spacing.sm },
  passTab: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full },
  passTabText: { fontSize: FontSize.sm, fontWeight: '700' },
  list: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  regionLabel: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.md },
  resortRow: {
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  resortInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  passBar: { width: 4, height: 32, borderRadius: 2 },
  resortName: { fontSize: FontSize.md, fontWeight: '700' },
  resortLocation: { fontSize: FontSize.xs, marginTop: 2 },
  actionButton: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.md },
  actionText: { fontSize: FontSize.sm, fontWeight: '700' },
});
```

- [ ] **Step 2: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add app/explore.tsx
git commit -m "feat: add explore screen with search, pass filter, and region grouping"
```

---

### Task 12: Profile Screen

**Files:**
- Create: `app/app/profile.tsx`

- [ ] **Step 1: Create profile screen**

Create `app/app/profile.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable, Switch, Alert, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '../constants/theme';

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, savedResortIds, signOut } = useAuth();
  const router = useRouter();

  const initials = user
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Profile header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.profileHeader}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{user?.name ?? 'Unknown'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        </View>
      </LinearGradient>

      {/* Settings list */}
      <View style={styles.settingsList}>
        <Pressable
          style={[styles.settingsRow, styles.rowFirst, { backgroundColor: colors.surface, borderBottomColor: colors.background }]}
          onPress={() => router.push('/explore')}
        >
          <Text style={[styles.settingsLabel, { color: colors.text }]}>My Resorts</Text>
          <Text style={[styles.settingsValue, { color: colors.textMuted }]}>
            {savedResortIds.length} selected ›
          </Text>
        </Pressable>

        <View style={[styles.settingsRow, { backgroundColor: colors.surface, borderBottomColor: colors.background }]}>
          <Text style={[styles.settingsLabel, { color: colors.text }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.epic }}
            thumbColor="#fff"
          />
        </View>

        <Pressable
          style={[styles.settingsRow, { backgroundColor: colors.surface, borderBottomColor: colors.background }]}
          onPress={() => Alert.alert('Coming Soon', 'Notifications will be available in a future update.')}
        >
          <Text style={[styles.settingsLabel, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.settingsValue, { color: colors.textMuted }]}>›</Text>
        </Pressable>

        <Pressable
          style={[styles.settingsRow, styles.rowLast, { backgroundColor: colors.surface }]}
          onPress={handleSignOut}
        >
          <Text style={[styles.settingsLabel, { color: '#ef4444' }]}>Sign Out</Text>
          <Text style={[styles.settingsValue, { color: colors.textMuted }]}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  profileHeader: {
    padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: FontSize.lg },
  userName: { color: '#fff', fontWeight: '800', fontSize: FontSize.lg },
  userEmail: { color: '#a8d4f0', fontSize: FontSize.sm },
  settingsList: { padding: Spacing.md },
  settingsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1,
  },
  rowFirst: { borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  rowLast: { borderBottomLeftRadius: Radius.lg, borderBottomRightRadius: Radius.lg, borderBottomWidth: 0 },
  settingsLabel: { fontSize: FontSize.md, fontWeight: '600' },
  settingsValue: { fontSize: FontSize.sm },
});
```

- [ ] **Step 2: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add app/profile.tsx
git commit -m "feat: add profile screen with dark mode toggle and sign out"
```

---

### Task 13: Update Root Layout with Auth-Aware Routing

**Files:**
- Modify: `app/app/_layout.tsx`

- [ ] **Step 1: Rewrite _layout.tsx with auth routing**

Replace `app/app/_layout.tsx`:
```tsx
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { checkPurchased } from './paywall';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LightColors } from '../constants/theme';

function AppNavigator() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading: authLoading, savedResortIds } = useAuth();
  const [paywallChecking, setPaywallChecking] = useState(true);
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    checkPurchased().then(setPurchased).finally(() => setPaywallChecking(false));
  }, []);

  if (paywallChecking || authLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator testID="layout-loading" size="large" color={colors.epic} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerGradientStart },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!purchased ? (
        <Stack.Screen testID="stack-paywall" name="paywall" options={{ headerShown: false }} />
      ) : !isAuthenticated ? (
        <Stack.Screen name="login" options={{ headerShown: false }} />
      ) : savedResortIds.length === 0 ? (
        <Stack.Screen name="onboarding" options={{ title: 'Pick Your Mountains' }} />
      ) : (
        <>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="resort/[id]" options={{ headerBackTitle: 'Home' }} />
          <Stack.Screen name="explore" options={{ title: 'Explore Resorts' }} />
          <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 2: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add app/_layout.tsx
git commit -m "feat: update root layout with auth-aware routing and theme provider"
```

---

### Task 14: Update Home Screen with New Header + Saved Resorts

**Files:**
- Modify: `app/app/index.tsx`

- [ ] **Step 1: Rewrite home screen**

Replace `app/app/index.tsx`:
```tsx
import React, { useRef, useState, useMemo } from 'react';
import { View, ScrollView, Pressable, Text, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useResorts } from '../hooks/useResorts';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ResortCard } from '../components/ResortCard';
import { BestBanner } from '../components/BestBanner';
import { FilterSheet } from '../components/FilterSheet';
import type { FilterState } from '../components/FilterSheet';
import { sortResorts, applyFilters } from '../lib/sort';
import type { PassFilter } from '../lib/sort';
import { MountainLogo } from '../components/MountainLogo';
import { Spacing, FontSize, Radius } from '../constants/theme';

const PASS_TABS: { label: string; value: PassFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Epic', value: 'epic' },
  { label: 'Ikon', value: 'ikon' },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, savedResortIds } = useAuth();
  const router = useRouter();
  const { resorts, best, loading, error, refresh } = useResorts();
  const [passFilter, setPassFilter] = useState<PassFilter>('all');
  const [filterState, setFilterState] = useState<FilterState>({ selectedRegions: new Set<string>(), sort: 'snow' });
  const [refreshing, setRefreshing] = useState(false);
  const sheetRef = useRef<any>(null);

  const savedSet = useMemo(() => new Set(savedResortIds), [savedResortIds]);

  const bestIds = useMemo(() => new Set(best.map(r => r.id)), [best]);

  // Filter to only saved resorts
  const displayed = useMemo(() => {
    const saved = resorts.filter((r) => savedSet.has(r.id));
    const filtered = applyFilters(saved, passFilter, filterState.selectedRegions);
    const sorted = sortResorts(filtered, filterState.sort);
    return sorted.filter(r => !bestIds.has(r.id));
  }, [resorts, savedSet, passFilter, filterState, bestIds]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Count fresh powder resorts
  const freshPowderCount = useMemo(() => {
    return resorts.filter((r) => savedSet.has(r.id) && r.snow && (r.snow.new_24h_in ?? 0) > 0).length;
  }, [resorts, savedSet]);

  const initials = user
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  if (loading && resorts.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator testID="loading-spinner" size="large" color={colors.snowBlue} />
      </View>
    );
  }

  if (error && resorts.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to load</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        <Pressable onPress={refresh} style={[styles.retryButton, { backgroundColor: colors.epic }]}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </Pressable>
      </View>
    );
  }

  const filteredBest = passFilter === 'all'
    ? best.filter((r) => savedSet.has(r.id))
    : best.filter((r) => savedSet.has(r.id) && r.pass_type === passFilter);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Custom header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.headerBar}
      >
        <View style={styles.headerLeft}>
          <MountainLogo size={28} color={colors.headerText} snowColor={colors.headerTextSecondary} />
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>PowderPass</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push('/explore')}>
            <Text style={{ color: colors.headerTextSecondary, fontSize: 20 }}>🔍</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/profile')} style={[styles.avatarSmall, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={{ color: colors.headerText, fontWeight: '700', fontSize: FontSize.sm }}>{initials}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Greeting */}
      <View style={[styles.greeting, { backgroundColor: colors.background }]}>
        <Text style={[styles.greetingText, { color: colors.text }]}>
          Hey {user?.name?.split(' ')[0] ?? 'there'}
          {freshPowderCount > 0
            ? ` — ${freshPowderCount} of your mountains got fresh powder overnight`
            : ''}
        </Text>
      </View>

      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.tabs}>
          {PASS_TABS.map((tab) => {
            const isActive = passFilter === tab.value;
            const activeColor = tab.value === 'epic' ? colors.epic : tab.value === 'ikon' ? colors.ikon : colors.snowBlue;
            return (
              <Pressable
                key={tab.value}
                style={[styles.tab, { borderColor: colors.border }, isActive && { backgroundColor: activeColor + '22', borderColor: activeColor }]}
                onPress={() => setPassFilter(tab.value)}
              >
                <Text style={[styles.tabText, { color: colors.textMuted }, isActive && { color: activeColor, fontWeight: '700' }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.filterButton} onPress={() => sheetRef.current?.expand()}>
          <Text style={[styles.filterButtonText, { color: colors.textMuted }]}>FILTER</Text>
          {(filterState.selectedRegions.size > 0 || filterState.sort !== 'snow') && (
            <View style={[styles.filterDot, { backgroundColor: colors.snowBlue }]} />
          )}
        </Pressable>
      </View>

      {/* Main list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.snowBlue}
            colors={[colors.snowBlue]}
          />
        }
      >
        {filteredBest.length > 0 && <BestBanner resorts={filteredBest} />}
        <View style={styles.listBody}>
          {displayed.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏔</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No resorts match your filters</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Try changing the sort or region</Text>
            </View>
          ) : (
            displayed.map((item) => <ResortCard key={item.id} resort={item} />)
          )}
        </View>
      </ScrollView>

      <FilterSheet
        ref={sheetRef}
        filterState={filterState}
        onApply={(state) => setFilterState(state)}
        filteredCount={displayed.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl, gap: Spacing.sm,
  },
  errorTitle: { fontSize: FontSize.xl, fontWeight: '800', letterSpacing: -0.5 },
  errorText: { fontSize: FontSize.sm, textAlign: 'center', marginBottom: Spacing.md },
  retryButton: { borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm, letterSpacing: 0.3 },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, paddingTop: Spacing.xxl,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarSmall: {
    width: 32, height: 32, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  greeting: { paddingHorizontal: Spacing.md + 4, paddingVertical: Spacing.sm },
  greetingText: { fontSize: FontSize.md, fontWeight: '600' },
  toolbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, gap: Spacing.sm,
  },
  tabs: { flexDirection: 'row', gap: Spacing.xs, flex: 1 },
  tab: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
  },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', letterSpacing: 0.2 },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 6 },
  filterButtonText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  list: { flex: 1 },
  listContent: { paddingBottom: Spacing.xl },
  listBody: { paddingTop: Spacing.sm },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: FontSize.md, fontWeight: '700' },
  emptySubtext: { fontSize: FontSize.sm },
});
```

- [ ] **Step 2: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add app/index.tsx
git commit -m "feat: update home screen with custom header, greeting, and saved resort filtering"
```

---

### Task 15: Update Resort Detail Header Title

**Files:**
- Modify: `app/app/resort/[id].tsx`

- [ ] **Step 1: Add dynamic header title**

In `app/app/resort/[id].tsx`, add the `useNavigation` import and set the title dynamically.

Add to imports:
```typescript
import { useNavigation } from 'expo-router';
```

Inside `ResortDetailScreen`, after `const { resort, loading, error, refresh } = ...`, add:
```typescript
const navigation = useNavigation();

React.useEffect(() => {
  if (resort) {
    navigation.setOptions({ title: resort.name });
  }
}, [resort, navigation]);
```

- [ ] **Step 2: Update colors to use useTheme**

Add to imports:
```typescript
import { useTheme } from '../../contexts/ThemeContext';
```

Inside `ResortDetailScreen`, add near the top:
```typescript
const { colors } = useTheme();
```

Replace all `Colors.` references in the styles that are used inline (like `backgroundColor: Colors.background`) to use the `colors` object from the hook. For the StyleSheet, move the theme-dependent styles to inline styles using the `colors` object.

Update the main style references:
- `styles.scroll` → add `{ backgroundColor: colors.background }`
- `styles.centered` → add `{ backgroundColor: colors.background }`
- `styles.header` → add `{ backgroundColor: colors.surface, borderBottomColor: colors.border }`
- `styles.section` → add `{ backgroundColor: colors.surface }`
- Text colors: use `{ color: colors.text }`, `{ color: colors.textSecondary }`, etc.

- [ ] **Step 3: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add app/resort/\\[id\\].tsx
git commit -m "fix: set dynamic header title on resort detail + apply theme colors"
```

---

### Task 16: Theme-ify ResortCard Component

**Files:**
- Modify: `app/components/ResortCard.tsx`

- [ ] **Step 1: Update ResortCard to use useTheme**

In `app/components/ResortCard.tsx`:

Replace the `Colors` import:
```typescript
import { useTheme } from '../contexts/ThemeContext';
```

Keep importing `Spacing, FontSize, Radius` from theme.

Inside the `ResortCard` function, add:
```typescript
const { colors } = useTheme();
```

Update all `Colors.xxx` references to `colors.xxx`. The key changes:
- `Colors.surface` → `colors.surface`
- `Colors.text` → `colors.text`
- `Colors.textSecondary` → `colors.textSecondary`
- `Colors.textMuted` → `colors.textMuted`
- `Colors.border` → `colors.border`
- `Colors.epic` → `colors.epic`
- `Colors.ikon` → `colors.ikon`
- `Colors.snowBlue` → `colors.snowBlue`
- `Colors.warning` → `colors.warning`

Move any StyleSheet properties that reference `Colors` to inline styles with the `colors` object.

- [ ] **Step 2: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add components/ResortCard.tsx
git commit -m "refactor: update ResortCard to use theme context colors"
```

---

### Task 17: Theme-ify Remaining Components

**Files:**
- Modify: `app/components/BestBanner.tsx`
- Modify: `app/components/FilterSheet.tsx`
- Modify: `app/components/FilterSheet.web.tsx`
- Modify: `app/components/SnowStats.tsx`
- Modify: `app/components/CrowdChart.tsx`
- Modify: `app/components/WeatherRow.tsx`
- Modify: `app/components/LiftList.tsx`
- Modify: `app/components/ParkingSection.tsx`

- [ ] **Step 1: Update each component**

For each component listed above, apply the same pattern as Task 16:

1. Replace `import { Colors, ... } from '../constants/theme'` with `import { useTheme } from '../contexts/ThemeContext'` (keeping `Spacing`, `FontSize`, `Radius` imports from theme)
2. Add `const { colors } = useTheme()` inside the component function
3. Replace all `Colors.xxx` with `colors.xxx`
4. Move static StyleSheet properties that used `Colors` to inline styles

Each component follows the same mechanical transformation. Process them one at a time, verifying no TypeScript errors after each.

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/app && npx tsc --noEmit --pretty 2>&1 | head -40`

- [ ] **Step 3: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add components/BestBanner.tsx components/FilterSheet.tsx components/FilterSheet.web.tsx components/SnowStats.tsx components/CrowdChart.tsx components/WeatherRow.tsx components/LiftList.tsx components/ParkingSection.tsx
git commit -m "refactor: update all remaining components to use theme context colors"
```

---

### Task 18: Update lib/utils.ts for Theme-Aware Crowd Colors

**Files:**
- Modify: `app/lib/utils.ts`

- [ ] **Step 1: Update crowdColor to accept a theme colors object**

The current `crowdColor` function imports `Colors` directly. Update it to accept the theme's color object as a parameter:

```typescript
import type { ThemeColors } from '../constants/theme';

export function crowdColor(level: string | null, colors: ThemeColors): string {
  switch (level) {
    case 'low': return colors.crowdLow;
    case 'medium': return colors.crowdMedium;
    case 'high': return colors.crowdHigh;
    default: return colors.textMuted;
  }
}
```

Update all call sites (ResortCard.tsx, CrowdChart.tsx) to pass `colors` from useTheme.

- [ ] **Step 2: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add lib/utils.ts components/ResortCard.tsx components/CrowdChart.tsx
git commit -m "refactor: make crowdColor theme-aware by accepting colors parameter"
```

---

### Task 19: Update Existing Tests

**Files:**
- Modify: `app/__tests__/components/HomeScreen.test.tsx`
- Modify: `app/__tests__/screens/Layout.test.tsx`
- Modify: various component test files

- [ ] **Step 1: Add ThemeProvider and AuthProvider wrappers to test utilities**

Create `app/__tests__/test-utils.tsx`:
```tsx
import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

export function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Update test files that render themed components**

For each test file that renders components using `useTheme()`, wrap the render call:
```tsx
import { TestWrapper } from '../test-utils';

render(<ResortCard resort={mockResort} />, { wrapper: TestWrapper });
```

- [ ] **Step 3: Run all frontend tests**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/app && npm test -- --passWithNoTests 2>&1 | tail -30`
Expected: All tests PASS (or known pre-existing failures only)

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/Users/33msw/projects/powderpass/app
git add __tests__/
git commit -m "test: add TestWrapper with ThemeProvider + AuthProvider for themed component tests"
```

---

### Task 20: Final Integration Verification

- [ ] **Step 1: Run all backend tests**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && python -m pytest tests/ -v`
Expected: All tests PASS

- [ ] **Step 2: Run all frontend tests**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/app && npm test -- --passWithNoTests`
Expected: All tests PASS

- [ ] **Step 3: Start backend and verify new endpoints**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/backend && uvicorn app.main:app --reload &`

Test endpoints:
```bash
# Health
curl http://localhost:8000/health

# Auth (will fail without real Google token, but should return 401 not 500)
curl -X POST http://localhost:8000/api/auth/google -H "Content-Type: application/json" -d '{"id_token":"fake"}'

# Existing endpoints still work
curl http://localhost:8000/api/resorts | head -c 200
```

- [ ] **Step 4: Start frontend and verify it loads**

Run: `cd /mnt/c/Users/33msw/projects/powderpass/app && EXPO_PUBLIC_API_URL=http://localhost:8000 npm run web`

Verify: Login page renders with mountain logo, Google and Apple buttons.

- [ ] **Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: final integration fixes for frontend redesign"
```
