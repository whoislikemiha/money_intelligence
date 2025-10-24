from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class SavingsTransactionValidationMixin:
    @field_validator('amount')
    def validate_amount(cls, amount):
        if amount == 0:
            raise ValueError('Amount cannot be zero')
        return amount

    @field_validator('description')
    def validate_description(cls, description):
        if description is not None and len(description.strip()) == 0:
            return None
        return description


class SavingsTransactionBase(BaseModel, SavingsTransactionValidationMixin):
    savings_goal_id: int
    amount: Decimal
    description: Optional[str] = None


class SavingsTransactionCreate(SavingsTransactionBase):
    pass


class SavingsTransactionInDB(SavingsTransactionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class SavingsTransaction(SavingsTransactionInDB):
    pass
