import os

from fastapi import APIRouter


router = APIRouter(prefix="/version", tags=["meta"])


@router.get("")
def version() -> dict[str, str]:
    return {
        "commit": os.getenv("GIT_COMMIT", "unknown"),
        "env": os.getenv("ENV", "unknown"),
        "build_time": os.getenv("BUILD_TIME", "unknown"),
    }
