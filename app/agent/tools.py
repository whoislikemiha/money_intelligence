from typing import Annotated
from langchain_core.tools import tool


@tool
def create_transaction_preview(
    amount: Annotated[float, "Transaction amount (must be positive)"],
    description: Annotated[str, "Brief description of the transaction"],
    category_id: Annotated[int, "Category ID for this transaction"],
    transaction_type: Annotated[str, "Transaction type: 'expense' or 'income'"],
    tag_ids: Annotated[list[int], "List of tag IDs to apply"] = None,
    transaction_date: Annotated[str, "Date in YYYY-MM-DD format"] = None,
) -> str:
    """
    Create a transaction preview. Use this tool for each transaction you want to create.
    The transaction will be added to a preview list for user confirmation.
    """
    return f"Transaction preview created: {amount} - {description} (category: {category_id})"


@tool
def convert_currency(
    amount: Annotated[float, "Amount to convert"],
    from_currency: Annotated[str, "Source currency code (e.g., EUR, USD)"],
    to_currency: Annotated[str, "Target currency code (e.g., USD, EUR)"],
) -> float:
    """
    Convert an amount from one currency to another using current exchange rates.
    Returns the converted amount.
    """
    # TODO: Implement actual currency conversion API call
    # For now, return a mock conversion
    return amount * 1.1  # Placeholder

