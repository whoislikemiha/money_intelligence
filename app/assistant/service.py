"""Financial assistant chat service"""

import asyncio
import json
import logging
from typing import AsyncGenerator, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.assistant.graph import create_assistant_graph
from app.assistant.state import AssistantState
from app.assistant.schemas.chat import UserContext
from app.crud.category_crud import CategoryCrud
from app.crud.tag_crud import TagCrud
from app.crud.budget_crud import BudgetCrud
from app.crud.transaction_crud import TransactionCrud
from app.crud.account_crud import AccountCrud

logger = logging.getLogger(__name__)


def serialize_tool_input(tool_input: Any) -> Any:
    """
    Serialize tool input for JSON transmission in SSE events.
    Handles Pydantic models, dicts, lists, and other types.

    Args:
        tool_input: The tool input to serialize

    Returns:
        JSON-serializable version of the input
    """
    # Already JSON-serializable primitives
    if isinstance(tool_input, (dict, list, str, int, float, bool, type(None))):
        return tool_input

    # Pydantic v2 models (preferred)
    if hasattr(tool_input, 'model_dump'):
        return tool_input.model_dump()

    # Pydantic v1 models (fallback)
    if hasattr(tool_input, 'dict'):
        return tool_input.dict()

    # Objects with __dict__
    if hasattr(tool_input, '__dict__'):
        return tool_input.__dict__

    # Last resort: convert to string
    return str(tool_input)


def extract_content_from_chunk(chunk_or_output) -> str:
    """
    Extract text content from LLM chunk or output.

    Args:
        chunk_or_output: The chunk or output from the LLM

    Returns:
        Extracted text content as string
    """
    if not hasattr(chunk_or_output, "content"):
        return ""

    content = chunk_or_output.content
    if not content:
        return ""

    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        # Content is a list of blocks, extract text
        return ''.join(
            block.get('text', '') if isinstance(block, dict) else str(block)
            for block in content
        )
    return str(content)


SYSTEM_PROMPT = """You are a helpful financial assistant. You help users understand their finances, create transactions, and manage their money.

You have access to tools to:
- Analyze spending patterns and trends
- View budgets and budget utilization
- List categories, tags, and budgets
- Create transactions from natural language
- Get financial insights and personalized advice

When answering questions:
1. Be conversational and friendly
2. Use the tools available to get accurate data - don't make assumptions
3. Provide clear, actionable insights
4. Format numbers as currency when appropriate
5. If you need more context, ask clarifying questions

Remember: Always use tools to get real data rather than making assumptions. If a user asks about their spending, use the analytics tools to get actual numbers.
"""


def load_user_context(db: Session, user_id: int, account_id: int) -> UserContext:
    """
    Load all user context needed for the assistant.

    Args:
        db: Database session
        user_id: Current user ID
        account_id: Current account ID

    Returns:
        UserContext with categories, tags, budgets, etc.
    """
    # Get categories
    categories = CategoryCrud.get_all_categories(db, user_id)
    categories_data = [
        {
            "id": cat.id,
            "name": cat.name,
            "icon": cat.icon,
            "color": cat.color
        }
        for cat in categories
    ]

    # Get tags
    tags = TagCrud.get_all_tags(db, user_id)
    tags_data = [
        {
            "id": tag.id,
            "name": tag.name,
            "color": tag.color
        }
        for tag in tags
    ]

    # Get budgets
    budgets = BudgetCrud.get_all_budgets(db, user_id)
    budgets_data = [
        {
            "id": budget.id,
            "category_id": budget.category_id,
            "amount": float(budget.amount),
            "notes": budget.notes
        }
        for budget in budgets
    ]

    # Get recent transactions (last 30 days)
    transactions = TransactionCrud.get_all(db, user_id)
    # Filter last 30 days
    thirty_days_ago = datetime.now() - timedelta(days=30)
    recent_transactions = [
        {
            "id": t.id,
            "amount": float(t.amount),
            "description": t.description,
            "category_id": t.category_id,
            "type": t.type.value,
            "date": t.date.isoformat()
        }
        for t in transactions
        if t.date >= thirty_days_ago.date()
    ][:50]  # Limit to 50 most recent

    # Get account balance
    account = AccountCrud.get_by_id_and_user(db, account_id, user_id)
    account_balance = float(account.current_balance) if account else 0.0

    return UserContext(
        categories=categories_data,
        tags=tags_data,
        budgets=budgets_data,
        recent_transactions=recent_transactions,
        account_balance=account_balance
    )


async def chat_stream(
    message: str,
    user_id: int,
    account_id: int,
    db: Session
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Stream chat responses with tool execution updates.

    Args:
        message: User's message
        user_id: Current user ID
        account_id: Current account ID
        db: Database session

    Yields:
        Event dictionaries with different types for streaming

    Cancellation:
        This function respects asyncio cancellation. When cancelled (e.g., due to
        client disconnection), it will:
        1. Stop streaming events
        2. Close the graph iterator
        3. Clean up resources
        Note: Tools that are currently executing cannot be interrupted mid-execution,
        but no new tools will be started after cancellation.
    """
    logger.info(
        "Starting chat stream",
        extra={
            "user_id": user_id,
            "account_id": account_id,
            "message_length": len(message)
        }
    )

    # Load user context
    user_context = load_user_context(db, user_id, account_id)
    logger.debug(
        "User context loaded",
        extra={
            "user_id": user_id,
            "categories_count": len(user_context.categories),
            "tags_count": len(user_context.tags),
            "budgets_count": len(user_context.budgets),
            "transactions_count": len(user_context.recent_transactions)
        }
    )

    # Create the assistant graph
    graph = create_assistant_graph(db, user_id, account_id, user_context.model_dump())

    # Build initial state
    initial_state: AssistantState = {
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": message
            }
        ],
        "account_id": account_id,
        "user_id": user_id,
        "user_context": user_context.model_dump(),
        "pending_confirmations": []
    }

    # Yield thinking event
    yield {"type": "thinking"}

    graph_iterator = None
    try:
        # Stream events from the graph
        graph_iterator = graph.astream_events(initial_state, version="v2")

        async for event in graph_iterator:
            event_type = event["event"]

            # Tool execution started
            if event_type == "on_tool_start":
                tool_name = event.get("name", "")
                tool_input = event.get("data", {}).get("input", {})

                # Ensure tool_input is JSON serializable
                serializable_input = serialize_tool_input(tool_input)

                yield {
                    "type": "tool_start",
                    "tool_name": tool_name,
                    "tool_input": serializable_input
                }

                logger.info(
                    "Tool execution started",
                    extra={
                        "tool_name": tool_name,
                        "user_id": user_id,
                        "account_id": account_id
                    }
                )

            # Tool execution completed
            elif event_type == "on_tool_end":
                tool_name = event.get("name", "")
                output = event.get("data", {}).get("output", "")

                # Convert output to string to ensure JSON serialization
                if hasattr(output, "content"):
                    output_str = output.content
                else:
                    output_str = str(output) if output else ""

                # Check if this is a special event response (structured JSON with marker)
                special_event_handled = False
                try:
                    output_data = json.loads(output_str)

                    if isinstance(output_data, dict) and "__special_event__" in output_data:
                        event_type_name = output_data["__special_event__"]

                        if event_type_name == "transaction_previews":
                            # Emit special event for transaction previews
                            yield {
                                "type": "transaction_previews",
                                "transactions": output_data.get("transactions", []),
                                "count": output_data.get("count", 0)
                            }

                            # Use the message for tool output
                            output_str = output_data.get("message", "Transaction previews ready")
                            special_event_handled = True

                except (json.JSONDecodeError, KeyError, TypeError):
                    # Not a special event, treat as normal output
                    pass
                except Exception as e:
                    logger.error(f"Error handling special event: {e}", exc_info=True)

                yield {
                    "type": "tool_end",
                    "tool_name": tool_name,
                    "tool_output": output_str,
                    "success": True
                }

                logger.info(
                    "Tool execution completed",
                    extra={
                        "tool_name": tool_name,
                        "user_id": user_id,
                        "account_id": account_id,
                        "output_length": len(output_str),
                        "special_event": special_event_handled
                    }
                )

            # LLM chunk (streaming response)
            elif event_type == "on_chat_model_stream":
                chunk = event.get("data", {}).get("chunk", {})
                content_str = extract_content_from_chunk(chunk)

                # Only yield if there's actual content
                if content_str:
                    yield {
                        "type": "message_chunk",
                        "content": content_str,
                        "is_final": False
                    }

            # LLM response complete
            elif event_type == "on_chat_model_end":
                # Send final marker to signal completion
                # Don't send content here as it was already streamed via on_chat_model_stream
                yield {
                    "type": "message_chunk",
                    "content": "",
                    "is_final": True
                }

    except asyncio.CancelledError:
        logger.info(
            "Chat stream cancelled by client",
            extra={
                "user_id": user_id,
                "account_id": account_id
            }
        )
        yield {
            "type": "error",
            "message": "Request cancelled",
            "recoverable": False
        }
        raise
    except Exception as e:
        logger.error(
            "Chat stream error",
            extra={
                "user_id": user_id,
                "account_id": account_id,
                "error_type": type(e).__name__,
                "error_message": str(e)
            },
            exc_info=True
        )
        # Provide user-friendly error messages
        error_message = "An error occurred while processing your request."
        if "rate" in str(e).lower() or "quota" in str(e).lower():
            error_message = "Service temporarily unavailable due to rate limits. Please try again in a moment."
        elif "timeout" in str(e).lower():
            error_message = "Request timed out. Please try again."
        elif "database" in str(e).lower() or "connection" in str(e).lower():
            error_message = "Database connection error. Please try again."

        yield {
            "type": "error",
            "message": error_message,
            "recoverable": True
        }
    finally:
        # Cleanup: Ensure graph iterator is closed if still active
        if graph_iterator is not None:
            try:
                await graph_iterator.aclose()
                logger.debug(
                    "Graph iterator closed",
                    extra={
                        "user_id": user_id,
                        "account_id": account_id
                    }
                )
            except Exception as e:
                logger.warning(
                    "Error closing graph iterator",
                    extra={
                        "user_id": user_id,
                        "account_id": account_id,
                        "error": str(e)
                    }
                )

        logger.info(
            "Chat stream ended",
            extra={
                "user_id": user_id,
                "account_id": account_id
            }
        )


def chat(
    message: str,
    user_id: int,
    account_id: int,
    db: Session
) -> str:
    """
    Non-streaming chat (for testing or simple use cases).

    Args:
        message: User's message
        user_id: Current user ID
        account_id: Current account ID
        db: Database session

    Returns:
        Assistant's response as a string
    """
    # Load user context
    user_context = load_user_context(db, user_id, account_id)

    # Create the assistant graph
    graph = create_assistant_graph(db, user_id, account_id, user_context.model_dump())

    # Build initial state
    initial_state: AssistantState = {
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": message
            }
        ],
        "account_id": account_id,
        "user_id": user_id,
        "user_context": user_context.model_dump(),
        "pending_confirmations": []
    }

    # Run the graph
    final_state = graph.invoke(initial_state)

    # Extract the last assistant message
    for message in reversed(final_state["messages"]):
        if hasattr(message, "content") and message.content:
            return message.content

    return "I'm sorry, I couldn't process that request."
