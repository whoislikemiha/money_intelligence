from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    initial_balance: float = 0
    currency: str = 'EUR'


class UserUpdate(BaseModel):
    name: Optional[str] = None


class UserInDB(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool
    onboarding_completed: bool
    model_config = ConfigDict(from_attributes=True)


class User(UserInDB):
    pass


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None