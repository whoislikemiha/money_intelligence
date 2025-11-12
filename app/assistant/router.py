"""FastAPI router for the financial assistant"""

import asyncio
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json
import logging
from typing import List

from app.auth.dependencies import get_current_active_user
from app.database.database import get_db
from app.schemas.user import User
from app.schemas.conversation import (
    Conversation,
    ConversationWithMessages,
    ConversationUpdate,
    ConversationList
)
from app.assistant.schemas.chat import ChatRequest, ChatResponse
from app.assistant.service import chat, chat_stream
from app.crud.conversation_crud import ConversationCrud, MessageCrud

logger = logging.getLogger(__name__)


router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def assistant_chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Non-streaming chat endpoint.
    Send a message and get a complete response.
    """
    response_text = chat(
        message=request.message,
        user_id=current_user.id,
        account_id=request.account_id,
        db=db
    )

    return ChatResponse(
        message=response_text,
        conversation_id=request.conversation_id or "default"
    )


@router.post("/chat-stream")
async def assistant_chat_stream(
    chat_request: ChatRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Streaming chat endpoint using Server-Sent Events.
    Streams assistant responses, tool executions, and other events in real-time.

    Events:
    - thinking: Assistant is processing
    - tool_start: Tool execution started
    - tool_end: Tool execution completed
    - message_chunk: Streaming text from assistant
    - done: Conversation complete
    - error: Error occurred
    """

    async def event_generator():
        """Generate SSE events for chat stream with client disconnection detection"""
        stream_task = None
        try:
            # Create the chat stream generator
            stream_gen = chat_stream(
                message=chat_request.message,
                user_id=current_user.id,
                account_id=chat_request.account_id,
                db=db,
                conversation_id=chat_request.conversation_id
            )

            # Stream events while monitoring for client disconnection
            async for event in stream_gen:
                # Check if client is still connected
                if await http_request.is_disconnected():
                    logger.info(
                        "Client disconnected, stopping stream",
                        extra={
                            "user_id": current_user.id,
                            "account_id": chat_request.account_id
                        }
                    )
                    # Close the stream generator
                    await stream_gen.aclose()
                    break

                # Stream each event as SSE
                event_data = json.dumps(event)
                yield f"data: {event_data}\n\n"

            # Send completion event (only if not disconnected)
            if not await http_request.is_disconnected():
                yield f"data: {json.dumps({'type': 'done', 'conversation_id': chat_request.conversation_id or 'default'})}\n\n"

        except asyncio.CancelledError:
            logger.info(
                "Stream cancelled",
                extra={
                    "user_id": current_user.id,
                    "account_id": chat_request.account_id
                }
            )
            # Re-raise to ensure proper cleanup
            raise
        except Exception as e:
            logger.error(
                "Stream error in router",
                extra={
                    "user_id": current_user.id,
                    "account_id": chat_request.account_id,
                    "error": str(e)
                },
                exc_info=True
            )
            # Send error event
            error_data = json.dumps({
                "type": "error",
                "message": "An error occurred while streaming the response.",
                "recoverable": False
            })
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


# Conversation management endpoints

@router.get("/conversations", response_model=ConversationList)
async def get_conversations(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get all conversations for the current user.
    Returns conversations ordered by most recent first.
    """
    conversations = ConversationCrud.get_all(db, current_user.id, limit, offset)
    total = len(conversations)  # For pagination info

    return ConversationList(
        conversations=conversations,
        total=total
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a specific conversation with all its messages.
    """
    conversation = ConversationCrud.get_by_id(db, conversation_id, current_user.id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation


@router.patch("/conversations/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: int,
    update_data: ConversationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update a conversation (currently only title).
    """
    conversation = ConversationCrud.update_title(
        db, conversation_id, current_user.id, update_data.title
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a conversation and all its messages.
    """
    success = ConversationCrud.delete(db, conversation_id, current_user.id)

    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {"message": "Conversation deleted successfully"}
