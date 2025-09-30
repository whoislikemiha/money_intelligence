from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, validator, field_validator

from app.schemas.category import Category


class BudgetValidationMixin(BaseModel):
    @field_validator('amount')
    def validate_amount(cls, amount):
        if amount <= 0:
            raise ValueError('Budget amount must be positive')
        return amount

    @field_validator('notes')
    def validate_notes(cls, notes):
        if notes is not None and len(notes.strip()) == 0:
            return None
        return notes

class BudgetBase(BudgetValidationMixin):
    category_id: int
    amount: Decimal
    notes: Optional[str] = None

class BudgetCreate(BudgetBase):
    user_id: int


class BudgetUpdate(BudgetValidationMixin):
    amount: Optional[Decimal] = None
    notes: Optional[str] = None


class BudgetInDB(BudgetBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class Budget(BudgetInDB):
    category: Optional[Category] = None