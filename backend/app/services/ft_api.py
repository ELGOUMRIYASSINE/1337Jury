# 1337Jury - 42 API Service
# This file is for: ADMIRAL (Backend Dev 1)
# Description: 42 OAuth API integration

import httpx
from typing import Optional
from app.config import settings


class FTApiService:
    def __init__(self):
        self.client_id = settings.FT_CLIENT_ID
        self.client_secret = settings.FT_CLIENT_SECRET
        self.redirect_uri = settings.FT_REDIRECT_URI

    def get_authorization_url(self) -> str:
        return settings.FT_AUTH_REDIRECT

    async def exchange_code_for_token(self, code: str) -> Optional[dict]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    settings.FT_TOKEN_URL,
                    data={
                        "grant_type": "authorization_code",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "code": code,
                        "redirect_uri": self.redirect_uri,
                    },
                    timeout=30.0,
                )
                return response.json() if response.status_code == 200 else None
            except Exception as e:
                print(f"Token exchange error: {e}")
                return None

    async def get_user_info(self, access_token: str) -> Optional[dict]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{settings.FT_API_URL}/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=30.0,
                )
                return response.json() if response.status_code == 200 else None
            except Exception as e:
                print(f"User info error: {e}")
                return None


ft_api = FTApiService()