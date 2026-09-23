from typing import Literal
from pydantic import BaseModel, Field, field_validator


class FeedbackRequest(BaseModel):
    category: Literal["idea", "bug", "data", "other"] = "other"
    message: str = Field(min_length=3, max_length=2000)
    email: str | None = Field(default=None, max_length=254)
    # Honeypot: hidden in the UI, so a real person never fills it. Bots do.
    website: str = ""

    @field_validator("message")
    @classmethod
    def _message_not_blank(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("message is too short")
        return v

    @field_validator("email")
    @classmethod
    def _email_shape(cls, v: str | None) -> str | None:
        v = (v or "").strip()
        if not v:
            return None
        if "@" not in v or " " in v or v.startswith("@") or v.endswith("@"):
            raise ValueError("email doesn't look valid")
        return v


class FeedbackResponse(BaseModel):
    ok: bool = True
