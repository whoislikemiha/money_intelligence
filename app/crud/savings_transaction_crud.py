from sqlalchemy.orm import Session
from app.database.models.savings_transaction import SavingsTransaction
from app.schemas.savings_transaction import SavingsTransactionCreate


class SavingsTransactionCrud:
    @staticmethod
    def create_savings_transaction(db: Session, savings_transaction: SavingsTransactionCreate) -> SavingsTransaction:
        savings_transaction_data = savings_transaction.model_dump()
        new_transaction = SavingsTransaction(
            savings_goal_id=savings_transaction_data["savings_goal_id"],
            amount=savings_transaction_data["amount"],
            description=savings_transaction_data.get("description"),
        )
        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)
        return new_transaction

    @staticmethod
    def get_transactions_by_goal(db: Session, savings_goal_id: int) -> list[SavingsTransaction]:
        """Get all transactions for a specific savings goal"""
        return db.query(SavingsTransaction).filter(
            SavingsTransaction.savings_goal_id == savings_goal_id
        ).order_by(SavingsTransaction.created_at.desc()).all()

    @staticmethod
    def get_transaction_by_id(db: Session, transaction_id: int) -> SavingsTransaction | None:
        return db.query(SavingsTransaction).filter(SavingsTransaction.id == transaction_id).first()

    @staticmethod
    def delete_transaction(db: Session, transaction_id: int) -> bool:
        transaction = db.query(SavingsTransaction).filter(SavingsTransaction.id == transaction_id).first()
        if not transaction:
            return False

        db.delete(transaction)
        db.commit()
        return True
