import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate


router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=list[ClientRead])
def list_clients(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[ClientRead]:
    stmt = select(Client).order_by(Client.created_at.desc())
    if not user.is_admin:
        stmt = stmt.where(Client.user_id == user.id)
    return db.scalars(stmt).all()


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
