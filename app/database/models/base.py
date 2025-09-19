from sqlalchemy import Column, DateTime, Integer, func
from sqlalchemy.orm import declarative_base, declared_attr

Base = declarative_base()


class BaseDbModel(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True)
    create_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name based on class name of children"""
        return cls.__name__.lower()
