from sqlalchemy.orm import Session

from app.auth.auth import get_password_hash, verify_password
from app.database.models.user import User
from app.schemas.user import UserCreate


class UserCrud:
    @staticmethod
    def get(db: Session, user_id: int) -> User:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> User:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def create(db: Session, obj_in: UserCreate) -> User:
        hashed_password = get_password_hash(obj_in.password)
        user = User(
            name=obj_in.name,
            email=obj_in.email,
            hashed_password=hashed_password,
            currency=obj_in.currency,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> User:
        user = UserCrud.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
