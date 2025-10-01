from sqlalchemy import Column, Integer, ForeignKey, Numeric, String, Date, Index, CheckConstraint
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship, validates

from app.database.models.base import BaseDbModel
from app.database.models.enums import TransactionType


class Transaction(BaseDbModel):
    __tablename__ = 'transactions'

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    account_id = Column(Integer, ForeignKey('accounts.id'), nullable=False)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    type = Column(SQLEnum(TransactionType), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(String(255))
    date = Column(Date, nullable=False, index=True)

    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    tags = relationship("Tag", secondary="transaction_tags", back_populates="transactions")

    __table_args__ = (
        Index('ix_transaction_user_date', 'user_id', 'date'),
        Index('ix_transaction_user_category', 'user_id', 'category_id'),
    )

    @validates('amount')
    def validate_amount(self, key, value):
        if value <= 0:
            raise ValueError("Amount must be positive")
        return value

    def __repr__(self):
        return f"<Transaction(amount={self.amount}, date={self.date}, type='{self.type.value}')>"
