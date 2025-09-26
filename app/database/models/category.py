from sqlalchemy import Column, Integer, ForeignKey, String, Boolean, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database.models.base import BaseDbModel

class Category(BaseDbModel):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String(100), nullable=False)
    icon = Column(String(50))
    color = Column(String(7))  # Hex color code

    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('user_id', 'name', name='_user_category_uc'),
    )

    def __repr__(self):
        return f"<Category(name='{self.name}', type='{self.type.value}')>"

