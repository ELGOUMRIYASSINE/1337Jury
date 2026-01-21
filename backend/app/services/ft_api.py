# 42Nexus - 42 API Service
# This file is for: ADMIRAL (Backend Dev 1)
# Description: 42 OAuth API integration

import httpx
from app.config import settings

FT_AUTH_URL = "https://api.intra.42.fr/oauth/authorize"
FT_TOKEN_URL = "https://api.intra.42.fr/oauth/token"
FT_USER_URL = "https://api.intra.42.fr/v2/me"


def get_authorization_url() -> str:
    """Generate 42 OAuth authorization URL"""
    params = {
        "client_id": settings.FT_CLIENT_ID,
        "redirect_uri": settings.FT_REDIRECT_URI,
        "response_type": "code",
        "scope": "public"
    }
    return f"{FT_AUTH_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"


async def exchange_code_for_token(code: str) -> dict:
    """Exchange authorization code for access token"""
    async with httpx.AsyncClient() as client:
        response = await client.post(FT_TOKEN_URL, data={
            "grant_type": "authorization_code",
            "client_id": settings.FT_CLIENT_ID,
            "client_secret": settings.FT_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.FT_REDIRECT_URI
        })
        return response.json()


async def get_user_info(access_token: str) -> dict:
    """Get user information from 42 API"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            FT_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        return response.json()
