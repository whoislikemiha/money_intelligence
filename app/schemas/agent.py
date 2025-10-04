from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import date

from app.database.models.enums import TransactionType


class AgentProcessRequest(BaseModel):
    """Request to process natural language input"""
    text: str
    account_id: int


class TransactionPreview(BaseModel):
    """Preview of a transaction to be created"""
    amount: Decimal
    description: str
    category_id: int
    type: TransactionType
    date: date
    tags: list[int] = []


class AgentProcessResponse(BaseModel):
    """Response with transaction previews"""
    transactions: list[TransactionPreview]
