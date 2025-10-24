from sqlalchemy import Column, Integer, ForeignKey, Numeric, String, Date, Boolean, Index
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship, validates

from app.database.models.base import BaseDbModel
from app.database.models.enums import TransactionType, ReminderRecurrence


class Reminder(BaseDbModel):
    __tablename__ = 'reminders'

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    account_id = Column(Integer, ForeignKey('accounts.id'), nullable=False)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    type = Column(SQLEnum(TransactionType), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    reminder_date = Column(Date, nullable=False, index=True)
    recurrence = Column(SQLEnum(ReminderRecurrence), nullable=False, default=ReminderRecurrence.NONE)
    is_completed = Column(Boolean, nullable=False, default=False)
    transaction_id = Column(Integer, ForeignKey('transactions.id'), nullable=True)

    user = relationship("User", back_populates="reminders")
    account = relationship("Account", back_populates="reminders")
    category = relationship("Category", back_populates="reminders")
    transaction = relationship("Transaction")
    tags = relationship("Tag", secondary="reminder_tags", back_populates="reminders")

    __table_args__ = (
        Index('ix_reminder_user_date', 'user_id', 'reminder_date'),
        Index('ix_reminder_completed', 'is_completed', 'reminder_date'),
    )

    @validates('amount')
    def validate_amount(self, key, value):
        if value <= 0:
            raise ValueError("Amount must be positive")
        return value

    def __repr__(self):
        return f"<Reminder(name='{self.name}', amount={self.amount}, date={self.reminder_date}, recurrence='{self.recurrence.value}')>"
