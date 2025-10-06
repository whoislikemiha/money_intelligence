from datetime import date
from typing import List, Dict, Any, AsyncGenerator
import logging
import time

from app.agent.graph import agent_graph
from app.agent.state import AgentState

logger = logging.getLogger(__name__)


class ExecutionTracker:
    """Tracks tool execution timing and call stack"""

    def __init__(self):
        self.start_time = time.time()
        self.tool_timings = {}  # {run_id: start_time}
        self.tool_calls = []  # [(tool_name, duration_ms)]

    def start_tool(self, run_id: str, tool_name: str):
        self.tool_timings[run_id] = time.time()
        logger.info(f"Tool call: {tool_name}")

    def end_tool(self, run_id: str, tool_name: str) -> float:
        start = self.tool_timings.get(run_id)
        if start:
            duration_ms = (time.time() - start) * 1000
            self.tool_calls.append((tool_name, duration_ms))
            logger.info(f"  └─ {tool_name}: {duration_ms:.0f}ms")
            return duration_ms
        return 0

    def finish(self):
        total_ms = (time.time() - self.start_time) * 1000
        logger.info(f"Total execution: {total_ms:.0f}ms | Tools: {len(self.tool_calls)}")
        return total_ms


SYSTEM_PROMPT = """You are a transaction parsing assistant. Your task: identify ALL transactions in the user's input and create previews for them simultaneously.

Available categories: {categories}
Available tags: {tags}

CRITICAL: Parse the entire input carefully, identify EVERY transaction (even if multiple transactions appear in one sentence), then call create_transaction_preview for ALL of them in a SINGLE response. The tools execute in parallel.

Example workflow:
Input: "Spent $50 on groceries yesterday, $20 on gas today, and $5 on coffee this morning"
Step 1: Identify 3 transactions (groceries, gas, coffee)
Step 2: Make 3 tool calls in ONE response:
  - create_transaction_preview(amount=50, description="groceries", category_id=..., transaction_type="expense", ...)
  - create_transaction_preview(amount=20, description="gas", category_id=..., transaction_type="expense", ...)
  - create_transaction_preview(amount=5, description="coffee", category_id=..., transaction_type="expense", ...)

IMPORTANT: Watch for multiple transactions in one sentence:
- "lunch 18 plus 8 for parking" = 2 separate transactions (lunch 18, parking 8)
- "coffee 5 and tip 2" = 2 separate transactions (coffee 5, tip 2)
- Each monetary amount typically represents a separate transaction

For each transaction:
- amount: positive number
- description: brief text
- category_id: match from available categories
- transaction_type: "expense" or "income" (default: "expense")
- tag_ids: list of IDs from available tags (empty list if none match)
- transaction_date: YYYY-MM-DD format (default: {today})

Date handling:
- Past: "yesterday" = {today} minus 1 day, "last week" = {today} minus 7 days, etc. - CREATE these transactions with the calculated past date
- Present: "today", "this morning" = {today} - CREATE these transactions
- Future: "tomorrow", "next week", etc. - SKIP these, do NOT create future transactions

IMPORTANT: Include ALL past and present transactions, even if mentioned at the end of the input.

Use convert_currency ONLY if explicitly needed (e.g., "50 EUR to USD"). Call it BEFORE create_transaction_preview if needed.

DO NOT call tools one by one. Analyze the full input, then make ALL tool calls at once.
"""


def parse_transactions(
    text: str,
    account_id: int,
    user_id: int,
    user_categories: List[Dict[str, Any]],
    user_tags: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Parse natural language text into transaction previews using the agent.

    Args:
        text: Natural language input from user
        account_id: Account to create transactions in
        user_id: Current user ID
        user_categories: List of user's categories
        user_tags: List of user's tags

    Returns:
        List of transaction dictionaries
    """

    # Build initial state
    initial_state: AgentState = {
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT.format(
                    categories=user_categories,
                    tags=user_tags,
                    today=date.today().isoformat(),
                )
            },
            {
                "role": "user",
                "content": text
            }
        ],
        "account_id": account_id,
        "user_id": user_id,
        "user_categories": user_categories,
        "user_tags": user_tags,
        "transactions_to_create": [],
    }

    # Run the agent
    final_state = agent_graph.invoke(initial_state)

    # Extract transaction previews from tool calls
    transactions = []
    today = date.today().isoformat()

    for message in final_state["messages"]:
        if hasattr(message, "tool_calls") and message.tool_calls:
            for tool_call in message.tool_calls:
                if tool_call["name"] == "create_transaction_preview":
                    args = tool_call["args"]
                    transactions.append({
                        "amount": args["amount"],
                        "description": args["description"],
                        "category_id": args["category_id"],
                        "type": args["transaction_type"],
                        "date": args.get("transaction_date") or today,
                        "tags": args.get("tag_ids", []) or [],
                    })

    return transactions


async def parse_transactions_stream(
    text: str,
    account_id: int,
    user_id: int,
    user_categories: List[Dict[str, Any]],
    user_tags: List[Dict[str, Any]],
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Stream transaction previews as they are created (event-based).

    Yields transaction dictionaries as soon as each tool call completes,
    allowing for real-time UI updates.

    Args:
        text: Natural language input from user
        account_id: Account to create transactions in
        user_id: Current user ID
        user_categories: List of user's categories
        user_tags: List of user's tags

    Yields:
        Transaction dictionaries as they are created
    """
    # Build initial state
    initial_state: AgentState = {
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT.format(
                    categories=user_categories,
                    tags=user_tags,
                    today=date.today().isoformat(),
                )
            },
            {
                "role": "user",
                "content": text
            }
        ],
        "account_id": account_id,
        "user_id": user_id,
        "user_categories": user_categories,
        "user_tags": user_tags,
        "transactions_to_create": [],
    }

    today = date.today().isoformat()
    tracker = ExecutionTracker()
    tool_calls_seen = set()  # Track which tool calls we've already processed

    # Stream events from the graph
    async for event in agent_graph.astream_events(initial_state, version="v2"):
        event_type = event["event"]

        # Stream LLM output as it's being generated (incremental tool calls)
        if event_type == "on_chat_model_stream":
            chunk = event.get("data", {}).get("chunk", {})

            # Check if this chunk contains tool call information
            if hasattr(chunk, "tool_call_chunks") and chunk.tool_call_chunks:
                for tool_chunk in chunk.tool_call_chunks:
                    # When a tool call is complete in the stream
                    if tool_chunk.get("name") == "create_transaction_preview":
                        tool_id = tool_chunk.get("id")
                        args = tool_chunk.get("args")

                        # Only process complete tool calls we haven't seen yet
                        if tool_id and args and tool_id not in tool_calls_seen:
                            # Check if args has all required fields
                            if all(key in args for key in ["amount", "description", "category_id", "transaction_type"]):
                                tool_calls_seen.add(tool_id)
                                logger.info(f"Streaming tool call: ${args['amount']} - {args['description']}")

                                transaction = {
                                    "amount": args["amount"],
                                    "description": args["description"],
                                    "category_id": args["category_id"],
                                    "type": args["transaction_type"],
                                    "date": args.get("transaction_date") or today,
                                    "tags": args.get("tag_ids", []) or [],
                                }
                                yield transaction

        # Log LLM thinking/reasoning when complete
        elif event_type == "on_chat_model_end":
            output = event.get("data", {}).get("output", {})
            if hasattr(output, "content"):
                reasoning = output.content
                if reasoning:
                    logger.info(f"Agent reasoning: {reasoning[:200]}...")

            # Log final tool call summary
            if hasattr(output, "tool_calls") and output.tool_calls:
                logger.info(f"Agent requested {len(output.tool_calls)} tool calls total")

        elif event_type == "on_tool_start":
            run_id = event.get("run_id", "")
            tool_name = event.get("name", "")
            tracker.start_tool(run_id, tool_name)

        elif event_type == "on_tool_end":
            run_id = event.get("run_id", "")
            tool_name = event.get("name", "")
            tracker.end_tool(run_id, tool_name)

            if tool_name == "create_transaction_preview":
                tool_input = event["data"].get("input", {})
                transaction = {
                    "amount": tool_input["amount"],
                    "description": tool_input["description"],
                    "category_id": tool_input["category_id"],
                    "type": tool_input["transaction_type"],
                    "date": tool_input.get("transaction_date") or today,
                    "tags": tool_input.get("tag_ids", []) or [],
                }
                yield transaction

    tracker.finish()
