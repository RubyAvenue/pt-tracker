from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserRead


router = APIRouter(prefix="/trainers", tags=["trainers"])


@router.get("/me", response_model=UserRead)
def read_me(user: User = Depends(get_current_user)) -> UserRead:
    return user
