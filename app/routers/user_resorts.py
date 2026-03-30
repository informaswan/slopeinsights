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
    db.query(UserResort).filter_by(user_id=user.id).delete()
    for resort_id in body.resort_ids:
        db.add(UserResort(id=str(uuid.uuid4()), user_id=user.id, resort_id=resort_id))
    db.commit()
    return UserResortsResponse(resort_ids=body.resort_ids)
