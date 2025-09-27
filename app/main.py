from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.config import settings
from app.crud.user_crud import UserCrud
from app.database.database import get_db
from app.routers import auth
from app.schemas.user import User, UserCreate


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["authentication"])


@app.get("/api")
async def root():
    return {"message": "Money Intelligence API", "version": settings.VERSION}



