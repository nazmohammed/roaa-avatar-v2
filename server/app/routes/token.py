"""Token endpoint — issues short-lived Azure Speech tokens + ICE relay info."""

import os
import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/token")
async def get_speech_token():
    """
    Fetches a 10-minute auth token from Azure Speech Services.
    The frontend uses this to call the Speech SDK directly
    without exposing the subscription key.
    """
    key = os.getenv("AZURE_SPEECH_KEY")
    region = os.getenv("AZURE_SPEECH_REGION")

    if not key or not region:
        raise HTTPException(500, "AZURE_SPEECH_KEY and AZURE_SPEECH_REGION must be set")

    url = f"https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            headers={
                "Ocp-Apim-Subscription-Key": key,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )

    if resp.status_code != 200:
        raise HTTPException(502, f"Azure token request failed: {resp.status_code}")

    return {"token": resp.text, "region": region}


@router.get("/ice")
async def get_ice_token():
    """
    Fetches ICE (TURN relay) credentials for WebRTC avatar connection.
    """
    key = os.getenv("AZURE_SPEECH_KEY")
    region = os.getenv("AZURE_SPEECH_REGION")

    if not key or not region:
        raise HTTPException(500, "AZURE_SPEECH_KEY and AZURE_SPEECH_REGION must be set")

    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1"

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            url,
            headers={"Ocp-Apim-Subscription-Key": key},
        )

    if resp.status_code != 200:
        raise HTTPException(502, f"ICE token request failed: {resp.status_code} — {resp.text}")

    return resp.json()
