from datetime import date
from typing import List, Dict, Any

from app.agent.graph import agent_graph
from app.agent.state import AgentState


SYSTEM_PROMPT = """You are a transaction parsing assistant. Parse the user's input and create transaction previews.

Available categories: {categories}
Available tags: {tags}

For each transaction mentioned:
1. Match the description to the most appropriate category from the available categories
2. Match any mentioned tags to available tags
3. Use convert_currency if currency conversion is needed
4. Use create_transaction_preview to add each transaction with:
   - amount (positive number)
   - description (brief text)
   - category_id (from available categories)
   - transaction_type ('expense' or 'income')
   - tag_ids (list of tag IDs, can be empty)
   - transaction_date (YYYY-MM-DD format, default to today: {today})

Default to 'expense' type unless income is clearly indicated.
Default to today's date unless specified.
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
