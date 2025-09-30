from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.database.models.enums import TransactionType
from app.schemas.tag import Tag


class TransactionBase(BaseModel):
    account_id: int
    category_id: int
    type: TransactionType
    amount: Decimal
    description: Optional[str] = None
    date: date

    @field_validator('amount')
    def validate_amount(cls, amount):
        if amount <= 0:
            raise ValueError('Amount must be positive')
        return amount


class TransactionCreate(TransactionBase):
    user_id: int
    tags: Optional[List[int]] = []


class TransactionUpdate(BaseModel):
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    type: Optional[TransactionType] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    date: Optional[date] = None
    tags: Optional[List[int]] = None

    @field_validator('amount')
    def validate_amount(cls, amount):
        if amount is not None and amount <= 0:
            raise ValueError('Amount must be positive')
        return amount


class TransactionInDB(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class Transaction(TransactionInDB):
    tags: List[Tag] = []