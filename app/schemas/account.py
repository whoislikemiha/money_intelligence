from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AccountBase(BaseModel):
    name: str
    current_balance: float
    initial_balance: float
    currency: str


class AccountCreate(BaseModel):
    name: str
    initial_balance: float = 0
    currency: str = 'EUR'


class AccountUpdate(BaseModel):
    name: str | None = None
    initial_balance: float | None = None
    currency: str | None = None


class AccountInDB(AccountBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class Account(AccountInDB):
    pass


class MonthlyStats(BaseModel):
    current_balance: float
    monthly_income: float
    monthly_expenses: float

