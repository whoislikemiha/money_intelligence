from fastapi import FastAPI
from fastapi import Depends
from sqlalchemy.orm import Session

from app.crud.user_crud import UserCrud
from app.database.database import get_db
from app.schemas.user import UserBase
from app.database.database import engine
from app.database.models.base import Base

# TODO: remove when setting up the model and migrations
Base.metadata.create_all(bind=engine)
app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Disi ti"}


@app.post("/user")
async def create_user(user: UserBase, db: Session = Depends(get_db)):
    user = UserCrud.create(db=db, obj_in=user)
    return user
