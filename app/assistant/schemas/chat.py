from pydantic import BaseModel
from typing import Optional, Any


class ChatRequest(BaseModel):
    """Request to send a message to the assistant"""
    message: str
    account_id: int
    conversation_id: Optional[str] = None  # For future multi-turn support


class ChatResponse(BaseModel):
    """Response from the assistant"""
    message: str
    conversation_id: str
    tool_calls: Optional[list[dict[str, Any]]] = None


class ToolConfirmationRequest(BaseModel):
    """Request user confirmation for a CRUD operation"""
    confirmation_id: str
    tool_name: str
    action: str  # "create_budget", "create_category", "create_tag"
    data: dict[str, Any]  # The data to be created
    description: str  # Human-readable description


class ToolConfirmationResponse(BaseModel):
    """User's response to a confirmation request"""
    confirmation_id: str
    approved: bool
    modified_data: Optional[dict[str, Any]] = None  # User can modify before approval


class UserContext(BaseModel):
    """User context loaded at conversation start"""
    categories: list[dict[str, Any]]
    tags: list[dict[str, Any]]
    budgets: list[dict[str, Any]]
    recent_transactions: list[dict[str, Any]]
    account_balance: float
