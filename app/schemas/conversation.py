"""Pydantic schemas for conversation endpoints"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class MessageBase(BaseModel):
    """Base schema for a message"""
    role: str
    content: str
    tool_calls_summary: Optional[str] = None


class MessageCreate(MessageBase):
    """Schema for creating a message"""
    conversation_id: int


class Message(MessageBase):
    """Schema for a message with full details"""
    id: int
    conversation_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    """Base schema for a conversation"""
    title: str = "New Conversation"


class ConversationCreate(ConversationBase):
    """Schema for creating a conversation"""
    pass


class ConversationUpdate(BaseModel):
    """Schema for updating a conversation"""
    title: str


class Conversation(ConversationBase):
    """Schema for a conversation with full details"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationWithMessages(Conversation):
    """Schema for a conversation with its messages"""
    messages: List[Message] = []

    class Config:
        from_attributes = True


class ConversationList(BaseModel):
    """Schema for listing conversations"""
    conversations: List[Conversation]
    total: int
