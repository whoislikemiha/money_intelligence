from typing import TypedDict, Annotated, Any
from langgraph.graph.message import add_messages


class AssistantState(TypedDict):
    """State for the financial assistant chat"""
    messages: Annotated[list, add_messages]
    account_id: int
    user_id: int
    user_context: dict[str, Any]  # Categories, tags, budgets, recent transactions
    pending_confirmations: list[dict]  # CRUD operations awaiting user approval
