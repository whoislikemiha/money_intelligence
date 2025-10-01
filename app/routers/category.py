
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.crud.category_crud import CategoryCrud
from app.database.database import get_db
from app.schemas.category import Category, CategoryCreate
from app.schemas.user import User

router = APIRouter()

@router.get("/", response_model=list[Category])
async def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return CategoryCrud.get_all_categories(db, current_user.id)

@router.post("/", status_code=201)
async def create_category(category: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    CategoryCrud.create_category(db, current_user.id, category)

@router.delete("/{category_id}", status_code=204)
async def delete_category(category_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    CategoryCrud.delete_category(db, category_id)