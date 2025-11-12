"""Financial advice tool"""

from langchain_core.tools import tool
from langchain_anthropic import ChatAnthropic
from sqlalchemy.orm import Session

from app.assistant.schemas.tools import GetFinancialAdviceInput
from app.config import settings


def create_advice_tools(db: Session, user_id: int, user_context: dict):
    """Factory to create financial advice tools with context"""

    @tool(args_schema=GetFinancialAdviceInput)
    def get_financial_advice(question: str, context: str | None = None) -> str:
        """
        Get personalized financial advice based on the user's data and question.
        Use this when the user asks for advice, suggestions, or recommendations.

        Examples:
        - "How can I save more money?"
        - "Should I increase my entertainment budget?"
        - "What's a good budget for groceries?"
        """
        # Build context from user data
        # TODO: most of this is useless, change
        context_parts = [
            f"User's current account balance: ${user_context.get('account_balance', 0):.2f}",
            f"Number of categories: {len(user_context.get('categories', []))}",
            f"Number of active budgets: {len(user_context.get('budgets', []))}",
            f"Recent transactions: {len(user_context.get('recent_transactions', []))} in last 30 days",
        ]

        if context:
            context_parts.append(f"Additional context: {context}")

        full_context = "\n".join(context_parts)

        # Use LLM for advice generation
        llm = ChatAnthropic(
            model="claude-haiku-4-5-20251001",
            temperature=0.3,  # Slight creativity for advice TODO: play with temp, not sure how creative we want it
            max_tokens=1024,
            api_key=settings.ANTHROPIC_API_KEY,
        )

        advice_prompt = f"""You are a helpful financial advisor. Provide practical, actionable advice based on the user's question and their financial context.

                            User's Question: {question}

                            User's Financial Context:
                            {full_context}

                            Provide specific, actionable advice that is:
                            1. Practical and realistic
                            2. Based on their current situation
                            3. Encouraging and supportive
                            4. Focused on sustainable habits

                            Keep your response concise (1-3 paragraphs) and avoid generic advice."""

        response = llm.invoke([{"role": "user", "content": advice_prompt}])

        return response.content

    return [get_financial_advice]
