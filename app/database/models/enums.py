from enum import Enum


class TransactionType(Enum):
    INCOME = "income"
    EXPENSE = "expense"


class ReminderRecurrence(Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"