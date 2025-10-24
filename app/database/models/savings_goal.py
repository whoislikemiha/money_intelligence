from sqlalchemy import Column, Integer, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship

from app.database.models.base import BaseDbModel


class SavingsGoal(BaseDbModel):
    __tablename__ = 'savings_goals'

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(Text, nullable=False)
    target_amount = Column(Numeric(12, 2), nullable=True)
    color = Column(Text, nullable=False, default='#10b981')  # Default green
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="savings_goals")
    transactions = relationship("SavingsTransaction", back_populates="savings_goal", cascade="all, delete-orphan")
