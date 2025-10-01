from datetime import datetime
from decimal import Decimal
from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from app.database.models.budget import Budget
from app.database.models.transaction import Transaction
from app.database.models.enums import TransactionType
from app.schemas.budget import BudgetCreate, BudgetUpdate


class BudgetCrud:
    @staticmethod
    def create_budget(db: Session, user_id: int, budget: BudgetCreate) -> Budget:
        budget_data = budget.model_dump()
        new_budget = Budget(
            user_id=user_id,
            category_id=budget_data["category_id"],
            amount=budget_data["amount"],
            notes=budget_data.get("notes"),
        )
        db.add(new_budget)
        db.commit()
        db.refresh(new_budget)
        return new_budget

    @staticmethod
    def get_all_budgets(db: Session, user_id: int) -> list[Budget]:
        return db.query(Budget).filter(Budget.user_id == user_id).all()

    @staticmethod
    def get_budget_by_id(db: Session, budget_id: int, user_id: int) -> Budget | None:
        return db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()

    @staticmethod
    def get_budget_by_category(db: Session, category_id: int, user_id: int) -> Budget | None:
        return db.query(Budget).filter(Budget.category_id == category_id, Budget.user_id == user_id).first()

    @staticmethod
    def update_budget(db: Session, budget_id: int, user_id: int, budget_update: BudgetUpdate) -> Budget | None:
        budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
        if not budget:
            return None

        update_data = budget_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(budget, field, value)

        db.commit()
        db.refresh(budget)
        return budget

    @staticmethod
    def delete_budget(db: Session, budget_id: int, user_id: int) -> bool:
        budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
        if not budget:
            return False

        db.delete(budget)
        db.commit()
        return True

    @staticmethod
    def get_budget_spending(db: Session, budget_id: int, user_id: int, month: int = None, year: int = None):
        """Calculate spending for a budget in a specific month/year"""
        budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
        if not budget:
            return None

        # Default to current month/year
        if month is None or year is None:
            now = datetime.now()
            month = month or now.month
            year = year or now.year

        # Sum expenses for this category in the specified month
        spent = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.category_id == budget.category_id,
            Transaction.type == TransactionType.EXPENSE,
            extract('month', Transaction.date) == month,
            extract('year', Transaction.date) == year
        ).scalar() or Decimal(0)

        return {
            "spent": float(spent),
            "remaining": float(budget.amount - spent),
            "percentage": float((spent / budget.amount * 100) if budget.amount > 0 else 0)
        }

    @staticmethod
    def get_all_budgets_with_spending(db: Session, user_id: int, month: int = None, year: int = None):
        """Get all budgets with spending data for a specific month/year"""
        budgets = BudgetCrud.get_all_budgets(db, user_id)

        # Default to current month/year
        if month is None or year is None:
            now = datetime.now()
            month = month or now.month
            year = year or now.year

        result = []
        for budget in budgets:
            # Sum expenses for this category in the specified month
            spent = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user_id,
                Transaction.category_id == budget.category_id,
                Transaction.type == TransactionType.EXPENSE,
                extract('month', Transaction.date) == month,
                extract('year', Transaction.date) == year
            ).scalar() or Decimal(0)

            budget_dict = {
                "id": budget.id,
                "user_id": budget.user_id,
                "category_id": budget.category_id,
                "amount": budget.amount,
                "notes": budget.notes,
                "created_at": budget.created_at,
                "updated_at": budget.updated_at,
                "category": budget.category,
                "spent": float(spent),
                "remaining": float(budget.amount - spent),
                "percentage": float((spent / budget.amount * 100) if budget.amount > 0 else 0)
            }
            result.append(budget_dict)

        return result
