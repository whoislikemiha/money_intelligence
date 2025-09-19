from sqlalchemy.orm import Session

from app.database.models.user import User
from app.schemas.user import UserBase


class UserCrud:
    @staticmethod
    def get(db: Session, user_id: int):
        return db.query(User).get(user_id)

    @staticmethod
    def create(db: Session, obj_in:UserBase) -> User:
        user = User(name="Aston Martin")
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
