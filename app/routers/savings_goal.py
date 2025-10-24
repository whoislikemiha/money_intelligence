from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.crud.savings_goal_crud import SavingsGoalCrud
from app.crud.savings_transaction_crud import SavingsTransactionCrud
from app.database.database import get_db
from app.schemas.savings_goal import SavingsGoal, SavingsGoalCreate, SavingsGoalUpdate
from app.schemas.savings_transaction import SavingsTransaction, SavingsTransactionCreate
from app.schemas.user import User

router = APIRouter()


@router.get("/", response_model=list[SavingsGoal])
async def get_savings_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return SavingsGoalCrud.get_all_savings_goals(db, current_user.id)


@router.get("/with-amounts")
async def get_all_savings_goals_with_amounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all savings goals with their current amounts calculated from transactions"""
    return SavingsGoalCrud.get_all_savings_goals_with_amounts(db, current_user.id)


@router.get("/{savings_goal_id}", response_model=SavingsGoal)
async def get_savings_goal(
    savings_goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    savings_goal = SavingsGoalCrud.get_savings_goal_by_id(db, savings_goal_id, current_user.id)
    if not savings_goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")
    return savings_goal


@router.post("/", response_model=SavingsGoal, status_code=status.HTTP_201_CREATED)
async def create_savings_goal(
    savings_goal: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    savings_goal.user_id = current_user.id
    return SavingsGoalCrud.create_savings_goal(db, current_user.id, savings_goal)


@router.put("/{savings_goal_id}", response_model=SavingsGoal)
async def update_savings_goal(
    savings_goal_id: int,
    savings_goal_update: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    savings_goal = SavingsGoalCrud.update_savings_goal(db, savings_goal_id, current_user.id, savings_goal_update)
    if not savings_goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")
    return savings_goal


@router.delete("/{savings_goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings_goal(
    savings_goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    success = SavingsGoalCrud.delete_savings_goal(db, savings_goal_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")


# Transaction endpoints
@router.get("/{savings_goal_id}/transactions", response_model=list[SavingsTransaction])
async def get_savings_goal_transactions(
    savings_goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all transactions for a specific savings goal"""
    # Verify the savings goal belongs to the current user
    savings_goal = SavingsGoalCrud.get_savings_goal_by_id(db, savings_goal_id, current_user.id)
    if not savings_goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")

    return SavingsTransactionCrud.get_transactions_by_goal(db, savings_goal_id)


@router.post("/{savings_goal_id}/transactions", response_model=SavingsTransaction, status_code=status.HTTP_201_CREATED)
async def create_savings_transaction(
    savings_goal_id: int,
    savings_transaction: SavingsTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new transaction (allocation or deallocation) for a savings goal"""
    # Verify the savings goal belongs to the current user
    savings_goal = SavingsGoalCrud.get_savings_goal_by_id(db, savings_goal_id, current_user.id)
    if not savings_goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")

    # Ensure the transaction is for the correct savings goal
    savings_transaction.savings_goal_id = savings_goal_id

    return SavingsTransactionCrud.create_savings_transaction(db, savings_transaction)


@router.delete("/{savings_goal_id}/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings_transaction(
    savings_goal_id: int,
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a transaction from a savings goal"""
    # Verify the savings goal belongs to the current user
    savings_goal = SavingsGoalCrud.get_savings_goal_by_id(db, savings_goal_id, current_user.id)
    if not savings_goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")

    # Verify the transaction exists and belongs to this savings goal
    transaction = SavingsTransactionCrud.get_transaction_by_id(db, transaction_id)
    if not transaction or transaction.savings_goal_id != savings_goal_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    success = SavingsTransactionCrud.delete_transaction(db, transaction_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
