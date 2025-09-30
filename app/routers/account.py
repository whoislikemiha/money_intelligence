from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.crud.account_crud import AccountCrud
from app.database.database import get_db
from app.schemas.account import Account, AccountUpdate
from app.schemas.user import User

router = APIRouter()


@router.get("/", response_model=Account)
async def get_my_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    account = AccountCrud.get_by_user_id(db, user_id=current_user.id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    return account


@router.put("/initial-balance", response_model=Account)
async def update_initial_balance(
    account_update: AccountUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    account = AccountCrud.get_by_user_id(db, user_id=current_user.id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )

    updated_account = AccountCrud.update_initial_balance(
        db, account_id=account.id, initial_balance=account_update.initial_balance
    )

    if not updated_account:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update account"
        )

    return updated_account