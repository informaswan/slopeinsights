# app/routers/feedback.py
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Security
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.limiter import limiter
from app.models.feedback import Feedback
from app.notify import send_feedback_email
from app.schemas.errors import ErrorResponse
from app.schemas.feedback import FeedbackRequest, FeedbackResponse

logger = logging.getLogger(__name__)
router = APIRouter()

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def _require_api_key(api_key: str = Security(_api_key_header)):
    if settings.environment == "development" or not settings.api_key:
        return api_key
    if api_key != settings.api_key:
        raise HTTPException(status_code=401, detail=ErrorResponse(error="Unauthorized", code=401).model_dump())
    return api_key


@router.post("/feedback", response_model=FeedbackResponse)
@limiter.limit("5/hour")
def submit_feedback(
    request: Request,  # required by slowapi's decorator
    body: FeedbackRequest,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    _: str = Depends(_require_api_key),
):
    if body.website.strip():
        # Honeypot tripped: pretend it worked so bots don't adapt, store nothing.
        return FeedbackResponse()
    db.add(Feedback(category=body.category, message=body.message, email=body.email))
    db.commit()
    background.add_task(send_feedback_email, body.category, body.message, body.email)
    return FeedbackResponse()
