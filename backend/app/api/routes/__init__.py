from app.api.routes.auth import admin_router, router as auth_router
from app.api.routes.clients import router as clients_router
from app.api.routes.health import router as health_router
from app.api.routes.sessions import router as sessions_router
from app.api.routes.trainers import router as trainers_router

__all__ = [
    "auth_router",
    "admin_router",
    "clients_router",
    "health_router",
    "sessions_router",
    "trainers_router",
]
