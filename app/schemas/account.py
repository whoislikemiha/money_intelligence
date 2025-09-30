from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AccountBase(BaseModel):
    name: str
    current_balance: float
    initial_balance: float


class AccountCreate(AccountBase):
    user_id: int


class AccountUpdate(BaseModel):
    initial_balance: float


class AccountInDB(AccountBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class Account(AccountInDB):
    pass

