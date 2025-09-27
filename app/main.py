from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.config import settings
from app.crud.user_crud import UserCrud
from app.database.database import get_db, engine
from app.database.models.base import Base
from app.routers import auth
from app.schemas.user import User, UserCreate

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["authentication"])


@app.get("/")
async def root():
    return {"message": "Money Intelligence API", "version": settings.VERSION}


@app.post(f"{settings.API_V1_STR}/users", response_model=User)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new user (protected endpoint)."""
    user = UserCrud.create(db=db, obj_in=user)
    return user


@app.get(f"{settings.API_V1_STR}/users/me", response_model=User)
async def read_user_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user


