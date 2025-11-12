"""CRUD operations for conversations and messages"""

from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.models.conversation import Conversation, Message


class ConversationCrud:
    """CRUD operations for Conversation model"""

    @staticmethod
    def create(db: Session, user_id: int, title: str = "New Conversation") -> Conversation:
        """
        Create a new conversation.

        Args:
            db: Database session
            user_id: Owner user ID
            title: Conversation title

        Returns:
            Created conversation
        """
        conversation = Conversation(
            user_id=user_id,
            title=title
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return conversation

    @staticmethod
    def get_by_id(db: Session, conversation_id: int, user_id: int) -> Optional[Conversation]:
        """
        Get conversation by ID, ensuring it belongs to the user.

        Args:
            db: Database session
            conversation_id: Conversation ID
            user_id: User ID for security check

        Returns:
            Conversation if found and belongs to user, None otherwise
        """
        return db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        ).first()

    @staticmethod
    def get_all(db: Session, user_id: int, limit: int = 50, offset: int = 0) -> List[Conversation]:
        """
        Get all conversations for a user, ordered by most recent first.

        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of conversations to return
            offset: Number of conversations to skip

        Returns:
            List of conversations
        """
        return db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).order_by(
            desc(Conversation.updated_at)
        ).limit(limit).offset(offset).all()

    @staticmethod
    def update_title(db: Session, conversation_id: int, user_id: int, title: str) -> Optional[Conversation]:
        """
        Update conversation title.

        Args:
            db: Database session
            conversation_id: Conversation ID
            user_id: User ID for security check
            title: New title

        Returns:
            Updated conversation if found, None otherwise
        """
        conversation = ConversationCrud.get_by_id(db, conversation_id, user_id)
        if conversation:
            conversation.title = title
            conversation.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(conversation)
        return conversation

    @staticmethod
    def delete(db: Session, conversation_id: int, user_id: int) -> bool:
        """
        Delete a conversation and all its messages.

        Args:
            db: Database session
            conversation_id: Conversation ID
            user_id: User ID for security check

        Returns:
            True if deleted, False if not found
        """
        conversation = ConversationCrud.get_by_id(db, conversation_id, user_id)
        if conversation:
            db.delete(conversation)
            db.commit()
            return True
        return False

    @staticmethod
    def touch(db: Session, conversation_id: int) -> None:
        """
        Update the conversation's updated_at timestamp.
        Called when new messages are added.

        Args:
            db: Database session
            conversation_id: Conversation ID
        """
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
        if conversation:
            conversation.updated_at = datetime.utcnow()
            db.commit()


class MessageCrud:
    """CRUD operations for Message model"""

    @staticmethod
    def create(
        db: Session,
        conversation_id: int,
        role: str,
        content: str,
        tool_calls_summary: Optional[str] = None
    ) -> Message:
        """
        Create a new message in a conversation.

        Args:
            db: Database session
            conversation_id: Conversation ID
            role: Message role ("user", "assistant", "system")
            content: Message content
            tool_calls_summary: Optional JSON string of tool call metadata

        Returns:
            Created message
        """
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            tool_calls_summary=tool_calls_summary
        )
        db.add(message)
        db.commit()
        db.refresh(message)

        # Update conversation's updated_at timestamp
        ConversationCrud.touch(db, conversation_id)

        return message

    @staticmethod
    def get_conversation_messages(
        db: Session,
        conversation_id: int,
        limit: Optional[int] = None
    ) -> List[Message]:
        """
        Get messages for a conversation, ordered by creation time.
        Optionally limit to last N messages.

        Args:
            db: Database session
            conversation_id: Conversation ID
            limit: Optional limit for number of messages (gets last N messages)

        Returns:
            List of messages in chronological order
        """
        query = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at)

        if limit:
            # Get last N messages: order desc, limit, then reverse
            messages = query.order_by(desc(Message.created_at)).limit(limit).all()
            return list(reversed(messages))

        return query.all()

    @staticmethod
    def delete_conversation_messages(db: Session, conversation_id: int) -> int:
        """
        Delete all messages in a conversation.

        Args:
            db: Database session
            conversation_id: Conversation ID

        Returns:
            Number of messages deleted
        """
        count = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).delete()
        db.commit()
        return count
