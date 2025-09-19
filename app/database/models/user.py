from sqlalchemy import Column, String, Integer

from base import BaseDbModel


class User(BaseDbModel):
    name = Column(String, unique=False, nullable=False)
    balance = Column(Integer, default=1000000)

    def __repr__(self):
        return f"<User(name={self.name}, id={self.id} with balance{self.balance}"
