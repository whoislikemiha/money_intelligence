"""Conversation and Message models for assistant chat history"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.database.models.base import Base


class Conversation(Base):
    """
    Represents a chat conversation with the financial assistant.
    Each conversation belongs to a user and can span multiple accounts.
    """

    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), default="New Conversation", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at"
    )

    # Indexes for performance
    __table_args__ = (
        Index("idx_conversations_user_updated", "user_id", "updated_at"),
    )


class Message(Base):
    """
    Represents a single message within a conversation.
    Stores user messages, assistant responses, and optionally system prompts.
    """

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    tool_calls_summary = Column(Text, nullable=True)  # JSON string of tool call metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    # Indexes for performance
    __table_args__ = (
        Index("idx_messages_conversation_created", "conversation_id", "created_at"),
    )
