from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime

from app.database.models.account import Account
from app.database.models.transaction import Transaction
from app.database.models.enums import TransactionType


class AccountCrud:
    @staticmethod
    def create_default_account(db: Session, user_id: int, initial_balance: float = 0, currency: str = 'EUR') -> Account:
        account = Account(
            user_id=user_id, name="Main Account", initial_balance=initial_balance, currency=currency
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        return account

    @staticmethod
    def create_account(db: Session, user_id: int, name: str, initial_balance: float, currency: str = 'EUR') -> Account:
        account = Account(
            user_id=user_id, name=name, initial_balance=initial_balance, currency=currency
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        return account

    @staticmethod
    def get_all_by_user_id(db: Session, user_id: int) -> list[Account]:
        return db.query(Account).filter(Account.user_id == user_id).all()

    @staticmethod
    def get_by_id(db: Session, account_id: int) -> Account | None:
        return db.query(Account).filter(Account.id == account_id).first()

    @staticmethod
    def get_by_id_and_user(db: Session, account_id: int, user_id: int) -> Account | None:
        return db.query(Account).filter(
            Account.id == account_id,
            Account.user_id == user_id
        ).first()

    @staticmethod
    def update_account(
        db: Session, account_id: int, name: str | None = None, initial_balance: float | None = None, currency: str | None = None
    ) -> Account | None:
        account = db.query(Account).filter(Account.id == account_id).first()
        if account:
            if name is not None:
                account.name = name
            if initial_balance is not None:
                account.initial_balance = initial_balance
            if currency is not None:
                account.currency = currency
            db.commit()
            db.refresh(account)
        return account

    @staticmethod
    def update_initial_balance(
        db: Session, account_id: int, initial_balance: float
    ) -> Account | None:
        account = db.query(Account).filter(Account.id == account_id).first()
        if account:
            account.initial_balance = initial_balance
            db.commit()
            db.refresh(account)
        return account

    @staticmethod
    def delete_account(db: Session, account_id: int) -> bool:
        account = db.query(Account).filter(Account.id == account_id).first()
        if account:
            db.delete(account)
            db.commit()
            return True
        return False

    @staticmethod
    def get_monthly_stats(db: Session, user_id: int, account_id: int | None = None) -> dict:
        if account_id:
            account = AccountCrud.get_by_id_and_user(db, account_id, user_id)
            if not account:
                return {
                    "current_balance": 0,
                    "monthly_income": 0,
                    "monthly_expenses": 0
                }
            accounts = [account]
        else:
            accounts = AccountCrud.get_all_by_user_id(db, user_id)
            if not accounts:
                return {
                    "current_balance": 0,
                    "monthly_income": 0,
                    "monthly_expenses": 0
                }

        now = datetime.now()
        current_month = now.month
        current_year = now.year

        # Calculate total balance across all accounts
        total_balance = sum(float(acc.current_balance) for acc in accounts)

        # Calculate monthly income (filter by account_id if specified)
        income_query = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.INCOME,
            extract('month', Transaction.date) == current_month,
            extract('year', Transaction.date) == current_year
        )
        if account_id:
            income_query = income_query.filter(Transaction.account_id == account_id)
        monthly_income = income_query.scalar() or 0

        # Calculate monthly expenses (filter by account_id if specified)
        expenses_query = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE,
            extract('month', Transaction.date) == current_month,
            extract('year', Transaction.date) == current_year
        )
        if account_id:
            expenses_query = expenses_query.filter(Transaction.account_id == account_id)
        monthly_expenses = expenses_query.scalar() or 0

        return {
            "current_balance": float(total_balance),
            "monthly_income": float(monthly_income),
            "monthly_expenses": float(monthly_expenses)
        }