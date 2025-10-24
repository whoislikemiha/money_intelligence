from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class SavingsGoalValidationMixin:
    @field_validator('target_amount')
    def validate_target_amount(cls, target_amount):
        if target_amount is not None and target_amount <= 0:
            raise ValueError('Target amount must be positive')
        return target_amount

    @field_validator('name')
    def validate_name(cls, name):
        if not name or len(name.strip()) == 0:
            raise ValueError('Name cannot be empty')
        return name.strip()

    @field_validator('notes')
    def validate_notes(cls, notes):
        if notes is not None and len(notes.strip()) == 0:
            return None
        return notes


class SavingsGoalBase(BaseModel, SavingsGoalValidationMixin):
    name: str
    target_amount: Optional[Decimal] = None
    color: str = '#10b981'
    notes: Optional[str] = None


class SavingsGoalCreate(SavingsGoalBase):
    user_id: int


class SavingsGoalUpdate(BaseModel, SavingsGoalValidationMixin):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = None
    color: Optional[str] = None
    notes: Optional[str] = None


class SavingsGoalInDB(SavingsGoalBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class SavingsGoal(SavingsGoalInDB):
    current_amount: Optional[Decimal] = None  # Calculated from transactions
