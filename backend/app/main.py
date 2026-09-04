from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health, me, questions


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="SelfFit Backend", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(me.router)
    app.include_router(questions.router)
    return app


app = create_app()
