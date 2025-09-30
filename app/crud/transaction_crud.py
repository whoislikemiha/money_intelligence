from sqlalchemy.orm import Session

from app.database.models.transaction import Transaction
from app.database.models.tag import Tag
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionCrud:

    @staticmethod
    def create(db: Session, transaction_data: TransactionCreate):
        transaction_dict = transaction_data.model_dump(exclude={'tags'})
        db_transaction = Transaction(**transaction_dict)
        db.add(db_transaction)
        db.flush()  # Get the transaction ID before commit

        # Handle tags if provided
        if transaction_data.tags:
            tags = db.query(Tag).filter(Tag.id.in_(transaction_data.tags)).all()
            db_transaction.tags = tags

        db.commit()
        db.refresh(db_transaction)
        return db_transaction

    @staticmethod
    def get_all(db: Session, user_id: int):
        return db.query(Transaction).filter(Transaction.user_id == user_id).all()

    @staticmethod
    def get_by_id(db: Session, transaction_id: int):
        return db.query(Transaction).filter(Transaction.id == transaction_id).first()

    @staticmethod
    def delete(db: Session, transaction_id: int):
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if transaction:
            db.delete(transaction)
            db.commit()

    @staticmethod
    def update(db: Session, transaction_id: int, transaction_update: TransactionUpdate):
        update_data = transaction_update.model_dump(exclude_unset=True)
        db.query(Transaction).filter(Transaction.id == transaction_id).update(update_data)
        db.commit()
        return db.query(Transaction).filter(Transaction.id == transaction_id).first()