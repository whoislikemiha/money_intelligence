from pydantic import BaseModel
from typing import Optional, Any, Literal


class MessageChunkEvent(BaseModel):
    """Streaming text chunk from assistant"""
    type: Literal["message_chunk"] = "message_chunk"
    content: str
    is_final: bool = False


class ToolStartEvent(BaseModel):
    """Tool execution started"""
    type: Literal["tool_start"] = "tool_start"
    tool_name: str
    tool_input: dict[str, Any]


class ToolEndEvent(BaseModel):
    """Tool execution completed"""
    type: Literal["tool_end"] = "tool_end"
    tool_name: str
    tool_output: Any
    success: bool
    error: Optional[str] = None


class ConfirmationNeededEvent(BaseModel):
    """CRUD operation requires user confirmation"""
    type: Literal["confirmation_needed"] = "confirmation_needed"
    confirmation_id: str
    tool_name: str
    action: str
    data: dict[str, Any]
    description: str


class ThinkingEvent(BaseModel):
    """Assistant is processing/thinking"""
    type: Literal["thinking"] = "thinking"
    message: Optional[str] = None


class DoneEvent(BaseModel):
    """Chat stream completed"""
    type: Literal["done"] = "done"
    conversation_id: str


class ErrorEvent(BaseModel):
    """Error occurred during chat"""
    type: Literal["error"] = "error"
    message: str
    recoverable: bool = True
