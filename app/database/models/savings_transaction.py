from sqlalchemy import Column, Integer, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship

from app.database.models.base import BaseDbModel


class SavingsTransaction(BaseDbModel):
    __tablename__ = 'savings_transactions'

    savings_goal_id = Column(Integer, ForeignKey('savings_goals.id'), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)  # Positive for allocation, negative for deallocation
    description = Column(Text, nullable=True)

    savings_goal = relationship("SavingsGoal", back_populates="transactions")
