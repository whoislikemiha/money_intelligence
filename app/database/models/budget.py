from sqlalchemy import Column, Integer, ForeignKey, Text, Date, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database.models.base import BaseDbModel


class Budget(BaseDbModel):
    __tablename__ = 'budgets'

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    notes = Column(Text)

    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")

    # One budget per category
    __table_args__ = (
        UniqueConstraint('user_id', 'category_id'),
    )