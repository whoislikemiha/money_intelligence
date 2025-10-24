"""
Database initialization script.
Creates all tables defined in the models.
"""
from app.database.database import engine
from app.database.models.base import BaseDbModel
from app.database.models import (
    User, Account, Category, Tag, TransactionTag,
    Transaction, Budget, Reminder, SavingsGoal, SavingsTransaction
)

def init_db():
    """Create all tables in the database."""
    print("Creating database tables...")
    BaseDbModel.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
