"""Generate conversation titles using Claude Haiku"""

import logging
from langchain_anthropic import ChatAnthropic
from app.config import settings

logger = logging.getLogger(__name__)


def generate_conversation_title(first_message: str) -> str:
    """
    Generate a concise, descriptive title for a conversation based on the first message.
    Uses Claude Haiku for fast, cost-effective title generation.

    Args:
        first_message: The user's first message in the conversation

    Returns:
        Generated title (max 50 characters) or truncated first message on error
    """
    try:
        # Initialize Haiku model (fast and cheap)
        llm = ChatAnthropic(
            model="claude-haiku-4-20250514",
            temperature=0,
            max_tokens=50,  # Titles should be short
            api_key=settings.ANTHROPIC_API_KEY
        )

        # Prompt for title generation
        prompt = f"""Generate a concise, descriptive title (max 5 words) for a conversation that starts with this message:

"{first_message}"

Return ONLY the title, no quotes, no explanation. Make it brief and descriptive.

Examples:
- "How much did I spend on groceries?" → "Grocery Spending Analysis"
- "Create a budget for dining out" → "Dining Budget Creation"
- "Show me my transactions from last week" → "Last Week Transactions"
"""

        # Generate title
        response = llm.invoke(prompt)
        title = response.content.strip()

        # Clean up title (remove quotes if present)
        title = title.strip('"\'')

        # Truncate to 50 characters if needed
        if len(title) > 50:
            title = title[:47] + "..."

        logger.info(f"Generated title: {title}")
        return title

    except Exception as e:
        logger.error(f"Error generating title: {e}", exc_info=True)

        # Fallback: truncate first message
        fallback_title = first_message[:47] + "..." if len(first_message) > 50 else first_message
        logger.info(f"Using fallback title: {fallback_title}")
        return fallback_title
