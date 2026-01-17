import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.client import Client
from app.models.session import Session as SessionModel
from app.models.session_item import SessionItem
from app.models.user import User
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate
from app.schemas.session import ExerciseHistoryItem


router = APIRouter(prefix="/clients", tags=["clients"])


def _is_admin_user(user: User) -> bool:
    if getattr(user, "role", None) == "admin":
        return True
    if getattr(user, "is_admin", False):
        return True
    if getattr(user, "is_superuser", False):
        return True
    return False


def _normalize_exercise_name(value: str) -> str:
    return " ".join(value.strip().split()).lower()


@router.get("", response_model=list[ClientRead])
def list_clients(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[ClientRead]:
    stmt = select(Client).order_by(Client.created_at.desc())
    if not _is_admin_user(user):
        stmt = stmt.where(Client.user_id == user.id)
    return db.scalars(stmt).all()


@router.get("/{client_id}/exercise-history", response_model=list[ExerciseHistoryItem])
def list_exercise_history(
    client_id: uuid.UUID,
    name: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ExerciseHistoryItem]:
    stmt = select(Client).where(Client.id == client_id)
    if not _is_admin_user(user):
        stmt = stmt.where(Client.user_id == user.id)
    client = db.scalar(stmt)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    normalized_target = _normalize_exercise_name(name)
    items_stmt = (
        select(SessionItem, SessionModel)
        .join(SessionModel, SessionItem.session_id == SessionModel.id)
        .where(SessionModel.client_id == client.id)
        .where(func.lower(SessionItem.name).like(f"%{normalized_target}%"))
        .order_by(SessionModel.session_date.desc(), SessionItem.created_at.desc())
    )
    rows = db.execute(items_stmt).all()
    matching = [
        ExerciseHistoryItem(
            session_id=session.id,
            session_date=session.session_date,
            session_status=session.status,
            item_id=item.id,
            planned_sets=item.planned_sets,
            planned_reps=item.planned_reps,
            planned_weight=item.planned_weight,
            actual_sets=item.actual_sets,
            actual_reps=item.actual_reps,
            actual_weight=item.actual_weight,
            notes=item.notes,
        )
        for item, session in rows
        if _normalize_exercise_name(item.name) == normalized_target
    ]
    return matching[offset : offset + limit]


@router.post("", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ClientRead:
    client = Client(user_id=user.id, name=payload.name)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientRead)
def get_client(
    client_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ClientRead:
    stmt = select(Client).where(Client.id == client_id)
    if not user.is_admin:
        stmt = stmt.where(Client.user_id == user.id)
    client = db.scalar(stmt)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client


@router.patch("/{client_id}", response_model=ClientRead)
def update_client(
    client_id: uuid.UUID,
    payload: ClientUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ClientRead:
    stmt = select(Client).where(Client.id == client_id)
    if not user.is_admin:
        stmt = stmt.where(Client.user_id == user.id)
    client = db.scalar(stmt)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    if payload.name is not None:
        client.name = payload.name
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    stmt = select(Client).where(Client.id == client_id)
    if not user.is_admin:
        stmt = stmt.where(Client.user_id == user.id)
    client = db.scalar(stmt)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    db.delete(client)
    db.commit()
    return None
