from sqlalchemy import Column, DateTime, Integer, func, Boolean
from sqlalchemy.orm import declarative_base, declared_attr

Base = declarative_base()


class BaseDbModel(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True)
    create_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

