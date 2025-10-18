"""Transaction creation tool - delegates to existing transaction agent"""

from typing import Annotated
from langchain_core.tools import tool
from sqlalchemy.orm import Session
import json

from app.agent.service import parse_transactions
from app.crud.category_crud import CategoryCrud
from app.crud.tag_crud import TagCrud


def create_transaction_tools(db: Session, user_id: int, account_id: int):
    """Factory to create transaction tools with database and user context"""

    @tool
    def create_transactions(
        text: Annotated[str, "Natural language description of transactions to create"]
    ) -> str:
        """
        Parse natural language text to create transaction previews.
        Use this when the user wants to add transactions by describing them.

        Examples:
        - "I spent $50 on groceries yesterday"
        - "Add coffee for $5, lunch $15, and gas $40"
        - "Got paid $2000 today"

        Returns transaction previews that the user will review and confirm.
        """
        # Get user context for the transaction agent
        categories = CategoryCrud.get_all_categories(db, user_id)
        tags = TagCrud.get_all_tags(db, user_id)

        user_categories = [
            {"id": cat.id, "name": cat.name, "icon": cat.icon}
            for cat in categories
        ]
        user_tags = [
            {"id": tag.id, "name": tag.name, "color": tag.color}
            for tag in tags
        ]

        # Use the existing transaction agent
        transactions = parse_transactions(
            text=text,
            account_id=account_id,
            user_id=user_id,
            user_categories=user_categories,
            user_tags=user_tags,
        )

        if not transactions:
            return "No transactions were identified in that text. Please provide more specific information like amounts and descriptions."

        # Return structured JSON that service layer can detect
        # Format: JSON object with __special_event__ marker
        result = {
            "__special_event__": "transaction_previews",
            "transactions": transactions,
            "count": len(transactions),
            "message": f"Found {len(transactions)} transaction(s) to create"
        }

        return json.dumps(result)

    return [create_transactions]
