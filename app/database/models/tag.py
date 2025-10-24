from sqlalchemy import Column, Integer, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database.models.base import BaseDbModel, Base


class Tag(BaseDbModel):
    __tablename__ = 'tags'

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String(50), nullable=False)
    color = Column(String(7))  # Hex color code

    user = relationship("User", back_populates="tags")
    transactions = relationship("Transaction", secondary="transaction_tags", back_populates="tags")
    reminders = relationship("Reminder", secondary="reminder_tags", back_populates="tags")

    __table_args__ = (
        UniqueConstraint('user_id', 'name', name='_user_tag_uc'),
    )

    def __repr__(self):
        return f"<Tag(name='{self.name}')>"



class TransactionTag(Base):
    __tablename__ = 'transaction_tags'

    transaction_id = Column(Integer, ForeignKey('transactions.id'), primary_key=True)
    tag_id = Column(Integer, ForeignKey('tags.id'), primary_key=True)


class ReminderTag(Base):
    __tablename__ = 'reminder_tags'

    reminder_id = Column(Integer, ForeignKey('reminders.id'), primary_key=True)
    tag_id = Column(Integer, ForeignKey('tags.id'), primary_key=True)
