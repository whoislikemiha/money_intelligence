from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.crud.budget_crud import BudgetCrud
from app.database.database import get_db
from app.schemas.budget import Budget, BudgetCreate, BudgetUpdate
from app.schemas.user import User

router = APIRouter()


@router.get("/", response_model=list[Budget])
async def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return BudgetCrud.get_all_budgets(db, current_user.id)


@router.get("/with-spending")
async def get_all_budgets_with_spending(
    month: int = None,
    year: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all budgets with spending data for specified month/year (defaults to current month)"""
    return BudgetCrud.get_all_budgets_with_spending(db, current_user.id, month, year)


@router.get("/{budget_id}", response_model=Budget)
async def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    budget = BudgetCrud.get_budget_by_id(db, budget_id, current_user.id)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


@router.get("/category/{category_id}", response_model=Budget)
async def get_budget_by_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    budget = BudgetCrud.get_budget_by_category(db, category_id, current_user.id)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found for this category")
    return budget


@router.post("/", response_model=Budget, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    budget.user_id = current_user.id
    return BudgetCrud.create_budget(db, current_user.id, budget)


@router.put("/{budget_id}", response_model=Budget)
async def update_budget(
    budget_id: int,
    budget_update: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    budget = BudgetCrud.update_budget(db, budget_id, current_user.id, budget_update)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    success = BudgetCrud.delete_budget(db, budget_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
