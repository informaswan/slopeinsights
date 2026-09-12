# app/schemas/errors.py
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    error: str
    code: int
