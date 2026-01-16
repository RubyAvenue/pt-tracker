from datetime import datetime
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.invite import Invite
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    BootstrapRequest,
    LoginRequest,
    SignupWithInviteRequest,
)
from app.schemas.invite import InviteCreate, InviteRead
from app.schemas.user import UserRead


router = APIRouter(prefix="/auth", tags=["auth"])
admin_router = APIRouter(prefix="/admin", tags=["admin"])


def _build_auth_response(user: User) -> AuthResponse:
    access_token = create_access_token(subject=str(user.id))
    return AuthResponse(access_token=access_token, token_type="bearer", user=user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    return _build_auth_response(user)


@router.post("/signup-with-invite", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup_with_invite(
    payload: SignupWithInviteRequest, db: Session = Depends(get_db)
) -> AuthResponse:
    invite = db.scalar(select(Invite).where(Invite.code == payload.invite_code))
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    if invite.used_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite already used")
    if invite.expires_at is not None and invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite expired")
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")
    user = User(
        email=payload.email,
        display_name=payload.display_name,
        password_hash=hash_password(payload.password),
        is_active=True,
        is_admin=False,
    )
    db.add(user)
    db.flush()
    invite.used_at = datetime.utcnow()
    invite.used_by_user_id = user.id
    db.commit()
    db.refresh(user)
    return _build_auth_response(user)


@router.post("/me", response_model=UserRead)
def read_me(user: User = Depends(get_current_user)) -> UserRead:
    return user


@admin_router.post("/bootstrap", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def bootstrap_admin(payload: BootstrapRequest, db: Session = Depends(get_db)) -> AuthResponse:
    if payload.bootstrap_token != settings.ADMIN_BOOTSTRAP_TOKEN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid bootstrap token")
    if db.scalar(select(func.count()).select_from(User)) > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bootstrap already completed")
    user = User(
        email=payload.email,
        display_name=payload.display_name,
        password_hash=hash_password(payload.password),
        is_active=True,
        is_admin=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _build_auth_response(user)


@admin_router.post("/invites", response_model=InviteRead, status_code=status.HTTP_201_CREATED)
def create_invite(
    payload: InviteCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> InviteRead:
    for _ in range(5):
        code = secrets.token_urlsafe(16)
        existing = db.scalar(select(Invite).where(Invite.code == code))
        if existing is None:
            invite = Invite(code=code, created_by_user_id=admin.id, expires_at=payload.expires_at)
            db.add(invite)
            db.commit()
            db.refresh(invite)
            return invite
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invite collision")


@admin_router.get("/invites", response_model=list[InviteRead])
def list_invites(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> list[InviteRead]:
    return db.scalars(
        select(Invite).order_by(Invite.created_at.desc()).limit(50)
    ).all()
