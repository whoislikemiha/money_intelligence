from sqlalchemy import Column, Integer, ForeignKey, String, Numeric
from sqlalchemy.orm import relationship

from app.database.models.base import BaseDbModel


class Account(BaseDbModel):
    __tablename__ = 'accounts'

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True)
    name = Column(String(100), default="Main Account")
    current_balance = Column(Numeric(12, 2), default=0)
    initial_balance = Column(Numeric(12, 2), default=0)

    user = relationship("User", back_populates="account")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Account(name='{self.name}', balance={self.current_balance})>"
