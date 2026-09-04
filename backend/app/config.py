from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """환경변수로 주입되는 설정. 값 목록은 .env.example 참고."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="development", description="development | production")
    supabase_url: AnyHttpUrl = Field(description="Supabase Project URL")
    supabase_anon_key: str = Field(description="Supabase anon(public) key")
    supabase_jwt_secret: str | None = Field(
        default=None,
        description="구형 HS256 프로젝트에서만 필요. ES256(JWKS) 프로젝트는 비워 둠",
    )
    cors_origins: list[str] = Field(
        default=["http://localhost:3000"],
        description="허용할 프론트엔드 origin 목록 (JSON 배열 문자열)",
    )

    @property
    def jwks_url(self) -> str:
        return f"{str(self.supabase_url).rstrip('/')}/auth/v1/.well-known/jwks.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
