from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin_router, auth_router, clients_router, health_router, trainers_router
from app.core.config import settings


docs_enabled = settings.ENV.lower() != "production"
app = FastAPI(
    title=settings.APP_NAME,
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json" if docs_enabled else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(clients_router, prefix=settings.API_V1_STR)
app.include_router(trainers_router, prefix=settings.API_V1_STR)
