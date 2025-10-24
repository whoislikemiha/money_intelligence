from sqlalchemy import Column, Integer, ForeignKey, String, Numeric
from sqlalchemy.orm import relationship

from app.database.models.base import BaseDbModel
from app.database.models.enums import TransactionType


class Account(BaseDbModel):
    __tablename__ = 'accounts'

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String(100), default="Main Account")
    initial_balance = Column(Numeric(12, 2), default=0)
    currency = Column(String(3), default='EUR', nullable=False)

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="account", cascade="all, delete-orphan")

    @property
    def current_balance(self):
        """Calculate current balance from initial balance and all transactions"""
        balance = float(self.initial_balance)
        for transaction in self.transactions:
            if transaction.type == TransactionType.INCOME:
                balance += float(transaction.amount)
            else: 
                balance -= float(transaction.amount)
        return balance

    def __repr__(self):
        return f"<Account(name='{self.name}', balance={self.current_balance})>"
