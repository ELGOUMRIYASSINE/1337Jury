# 1337Jury - Configuration
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Environment mode
    ENV: str = os.getenv("ENV", "development")
    
    # Database
    DATABASE_URL: str
    
    # 42 OAuth API
    FT_CLIENT_ID: str
    FT_CLIENT_SECRET: str
    FT_REDIRECT_URI: str
    FT_AUTH_REDIRECT: str
    FT_AUTH_URL: str = "https://api.intra.42.fr/oauth/authorize"
    FT_TOKEN_URL: str = "https://api.intra.42.fr/oauth/token"
    FT_API_URL: str = "https://api.intra.42.fr/v2"
    
    # JWT Settings
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 86400
    
    # Frontend URL
    FRONTEND_URL: str

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        return self.ENV.lower() == "development"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()