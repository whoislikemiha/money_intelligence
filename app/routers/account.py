from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.crud.account_crud import AccountCrud
from app.database.database import get_db
from app.schemas.account import Account, AccountCreate, AccountUpdate, MonthlyStats
from app.schemas.user import User

router = APIRouter()


@router.get("/", response_model=list[Account])
async def get_all_accounts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    accounts = AccountCrud.get_all_by_user_id(db, user_id=current_user.id)
    return accounts


@router.post("/", response_model=Account, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_create: AccountCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    account = AccountCrud.create_account(
        db,
        user_id=current_user.id,
        name=account_create.name,
        initial_balance=account_create.initial_balance,
        currency=account_create.currency
    )
    return account


@router.get("/{account_id}", response_model=Account)
async def get_account(
    account_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    account = AccountCrud.get_by_id_and_user(db, account_id=account_id, user_id=current_user.id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    return account


@router.put("/{account_id}", response_model=Account)
async def update_account(
    account_id: int,
    account_update: AccountUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    account = AccountCrud.get_by_id_and_user(db, account_id=account_id, user_id=current_user.id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )

    updated_account = AccountCrud.update_account(
        db,
        account_id=account_id,
        name=account_update.name,
        initial_balance=account_update.initial_balance,
        currency=account_update.currency
    )

    if not updated_account:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update account"
        )

    return updated_account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    account = AccountCrud.get_by_id_and_user(db, account_id=account_id, user_id=current_user.id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )

    success = AccountCrud.delete_account(db, account_id=account_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )


@router.get("/monthly-stats/", response_model=MonthlyStats)
async def get_monthly_stats(
    account_id: int | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get monthly stats for all accounts or a specific account."""
    return AccountCrud.get_monthly_stats(db, user_id=current_user.id, account_id=account_id)