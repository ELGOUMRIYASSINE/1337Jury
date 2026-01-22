# 1337Jury - Configuration
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://localhost/1337jury"
    FT_CLIENT_ID: str = ""
    FT_CLIENT_SECRET: str = ""
    FT_REDIRECT_URI: str = "http://localhost:8000/api/auth/callback"
    FT_AUTH_URL: str = "https://api.intra.42.fr/oauth/authorize"
    FT_TOKEN_URL: str = "https://api.intra.42.fr/oauth/token"
    FT_API_URL: str = "https://api.intra.42.fr/v2"
    JWT_SECRET: str = "change-this"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 86400
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()