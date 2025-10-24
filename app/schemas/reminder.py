from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.database.models.enums import TransactionType, ReminderRecurrence
from app.schemas.tag import Tag


class ReminderBase(BaseModel):
    account_id: int
    category_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    type: TransactionType
    amount: Decimal
    reminder_date: date
    recurrence: ReminderRecurrence = ReminderRecurrence.NONE

    @field_validator('amount')
    def validate_amount(cls, amount):
        if amount <= 0:
            raise ValueError('Amount must be positive')
        return amount


class ReminderCreate(ReminderBase):
    user_id: int
    tags: Optional[List[int]] = []


class ReminderUpdate(BaseModel):
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[TransactionType] = None
    amount: Optional[Decimal] = None
    reminder_date: Optional[date] = None
    recurrence: Optional[ReminderRecurrence] = None
    is_completed: Optional[bool] = None
    transaction_id: Optional[int] = None
    tags: Optional[List[int]] = None

    @field_validator('amount')
    def validate_amount(cls, amount):
        if amount is not None and amount <= 0:
            raise ValueError('Amount must be positive')
        return amount


class ReminderInDB(ReminderBase):
    id: int
    user_id: int
    is_completed: bool
    transaction_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class Reminder(ReminderInDB):
    tags: List[Tag] = []
