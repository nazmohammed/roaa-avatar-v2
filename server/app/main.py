"""ROAA Avatar — FastAPI backend."""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.token import router as token_router
from app.routes.match import router as match_router

app = FastAPI(title="ROAA Avatar API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(token_router, prefix="/api")
app.include_router(match_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "roaa-avatar"}
