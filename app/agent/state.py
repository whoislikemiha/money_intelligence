from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """State for the transaction parsing agent"""
    messages: Annotated[list, add_messages]
    account_id: int
    user_id: int
    user_categories: list[dict]  # [{id, name}, ...]
    user_tags: list[dict]  # [{id, name, color}, ...]
    transactions_to_create: list[dict]  # Accumulator for parsed transactions
