from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.database.database import get_db
from app.crud.transaction_crud import TransactionCrud
from app.schemas.transaction import Transaction, TransactionCreate, TransactionUpdate
from app.schemas.user import User

router = APIRouter()


@router.post("/", status_code=201)
async def create_transaction(
        transaction: TransactionCreate,
        db: Session = Depends(get_db)
):
    return TransactionCrud.create(db, transaction)

@router.get("/", response_model=list[Transaction])
async def get_transactions(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    return TransactionCrud.get_all(db, current_user.id)

@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(
        transaction_id: int,
        db: Session = Depends(get_db)
):
    return TransactionCrud.delete(db, transaction_id)

@router.put("/{transaction_id}", response_model=Transaction)
async def update_transaction(
        transaction_id: int,
        transaction_update: TransactionUpdate,
        db: Session = Depends(get_db)
):
    TransactionCrud.update(db, transaction_id, transaction_update)