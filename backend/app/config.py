# 42Nexus - Configuration Settings
# This file is for: ADMIRAL (Backend Dev 1)
# Description: Application configuration using pydantic-settings

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    FT_CLIENT_ID: str
    FT_CLIENT_SECRET: str
    FT_REDIRECT_URI: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 86400  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()
