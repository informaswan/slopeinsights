import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User, UserResort
from app.models.resort import Resort

logger = logging.getLogger(__name__)

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
    logger.info(f"Updating resorts for user {user.id}: {body.resort_ids}")

    # Validate all resort IDs exist
    valid_ids = []
    for resort_id in body.resort_ids:
        resort = db.query(Resort).filter_by(id=resort_id).first()
        if not resort:
            logger.warning(f"Resort {resort_id} not found, skipping")
            continue
        valid_ids.append(resort_id)

    if not valid_ids:
        raise HTTPException(status_code=400, detail="No valid resorts provided")

    logger.info(f"Valid resort IDs after validation: {valid_ids}")

    db.query(UserResort).filter_by(user_id=user.id).delete()
    for resort_id in valid_ids:
        db.add(UserResort(id=str(uuid.uuid4()), user_id=user.id, resort_id=resort_id))
    db.commit()

    logger.info(f"Successfully saved {len(valid_ids)} resorts for user {user.id}")
    return UserResortsResponse(resort_ids=valid_ids)
