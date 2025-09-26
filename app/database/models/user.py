from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship

from app.database.models.base import BaseDbModel


class User(BaseDbModel):
    __tablename__ = 'users'

    name = Column(String, unique=False, nullable=False)
    email = Column(String, unique=False, nullable=False)
    currency = Column(String(3), default='EUR')

    account = relationship("Account", back_populates="user", uselist=False, cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    tags = relationship("Tag", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(name={self.name}, id={self.id} with balance{self.balance}"
