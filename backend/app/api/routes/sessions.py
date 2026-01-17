import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, get_db
from app.models.client import Client
from app.models.session import Session as SessionModel
from app.models.session_item import SessionItem
from app.models.user import User
from app.schemas.session import (
    SessionCreate,
    SessionItemCreate,
    SessionItemRead,
    SessionItemUpdate,
    SessionRead,
    SessionReadWithItems,
    SessionUpdate,
)


router = APIRouter(tags=["sessions"])


def _get_client_or_404(
    client_id: uuid.UUID, db: Session, user: User
) -> Client:
    stmt = select(Client).where(Client.id == client_id)
    if not user.is_admin:
        stmt = stmt.where(Client.user_id == user.id)
    client = db.scalar(stmt)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client


def _get_session_or_404(
    session_id: uuid.UUID, db: Session, user: User
) -> SessionModel:
    stmt = select(SessionModel).where(SessionModel.id == session_id)
    if not user.is_admin:
        stmt = stmt.where(SessionModel.user_id == user.id)
    session = db.scalar(stmt)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.post(
    "/clients/{client_id}/sessions",
    response_model=SessionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    client_id: uuid.UUID,
    payload: SessionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SessionRead:
    client = _get_client_or_404(client_id, db, user)
    session = SessionModel(
        user_id=client.user_id,
        client_id=client.id,
        session_date=payload.session_date,
        status=payload.status or "planned",
        notes=payload.notes,
        exercises_text="",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/clients/{client_id}/sessions", response_model=list[SessionRead])
def list_sessions(
    client_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[SessionRead]:
    client = _get_client_or_404(client_id, db, user)
    return db.scalars(
        select(SessionModel)
        .where(SessionModel.client_id == client.id)
        .order_by(SessionModel.session_date.desc(), SessionModel.created_at.desc())
    ).all()


@router.get("/sessions/{session_id}", response_model=SessionReadWithItems)
def get_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SessionReadWithItems:
    session = db.scalar(
        select(SessionModel)
        .where(SessionModel.id == session_id)
        .options(selectinload(SessionModel.items))
    )
    if not session or (not user.is_admin and session.user_id != user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.patch("/sessions/{session_id}", response_model=SessionRead)
def update_session(
    session_id: uuid.UUID,
    payload: SessionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SessionRead:
    session = _get_session_or_404(session_id, db, user)
    if payload.session_date is not None:
        session.session_date = payload.session_date
    if payload.status is not None:
        session.status = payload.status
    if payload.notes is not None:
        session.notes = payload.notes
    db.commit()
    db.refresh(session)
    return session


@router.post(
    "/sessions/{session_id}/items",
    response_model=SessionItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_session_item(
    session_id: uuid.UUID,
    payload: SessionItemCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SessionItemRead:
    session = _get_session_or_404(session_id, db, user)
    order_index = payload.order_index
    if order_index is None:
        order_index = db.scalar(
            select(func.coalesce(func.max(SessionItem.order_index), 0))
            .where(SessionItem.session_id == session.id)
        )
        order_index = (order_index or 0) + 1
    item = SessionItem(
        session_id=session.id,
        name=payload.name,
        order_index=order_index,
        planned_weight=payload.planned_weight,
        planned_reps=payload.planned_reps,
        planned_sets=payload.planned_sets,
        actual_weight=payload.actual_weight,
        actual_reps=payload.actual_reps,
        actual_sets=payload.actual_sets,
        notes=payload.notes,
        metrics=payload.metrics,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/sessions/{session_id}/items/{item_id}", response_model=SessionItemRead)
def update_session_item(
    session_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: SessionItemUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SessionItemRead:
    session = _get_session_or_404(session_id, db, user)
    item = db.scalar(
        select(SessionItem).where(SessionItem.id == item_id, SessionItem.session_id == session.id)
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/sessions/{session_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session_item(
    session_id: uuid.UUID,
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    session = _get_session_or_404(session_id, db, user)
    item = db.scalar(
        select(SessionItem).where(SessionItem.id == item_id, SessionItem.session_id == session.id)
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session item not found")
    db.delete(item)
    db.commit()
    return None
