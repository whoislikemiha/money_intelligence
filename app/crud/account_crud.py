from sqlalchemy.orm import Session
from app.database.models.account import Account


class AccountCrud:
    @staticmethod
    def create_default_account(db: Session, user_id: int) -> Account:
        account = Account(
            user_id=user_id,
            name="Main Account",
            current_balance=0,
            initial_balance=0
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        return account

    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> Account:
        return db.query(Account).filter(Account.user_id == user_id).first()

