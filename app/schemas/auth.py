from pydantic import BaseModel


class GoogleAuthRequest(BaseModel):
    id_token: str


class AppleAuthRequest(BaseModel):
    identity_token: str
    name: str | None = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: str | None
    provider: str


class AuthResponse(BaseModel):
    token: str
    user: UserResponse
