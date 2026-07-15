from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers.auth import router as auth_router
from app.routers.polls import router as polls_router
from app.routers.take import router as take_router

app = FastAPI(title="KapustaDev API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(polls_router)
app.include_router(take_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
