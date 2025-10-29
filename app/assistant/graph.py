"""LangGraph workflow for the financial assistant"""

from typing import Literal
from langchain_anthropic import ChatAnthropic
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from sqlalchemy.orm import Session

from app.assistant.state import AssistantState
from app.assistant.tools.analytics import create_analytics_tools
from app.assistant.tools.categories import create_category_tools
from app.assistant.tools.tags import create_tag_tools
from app.assistant.tools.budgets import create_budget_tools
from app.assistant.tools.transactions import create_transaction_tools
from app.assistant.tools.advice import create_advice_tools
from app.config import settings


def create_assistant_graph(db: Session, user_id: int, account_id: int, user_context: dict = None):
    """
    Create and compile the financial assistant graph.

    Args:
        db: Database session for tool access
        user_id: Current user ID
        account_id: Current account ID

    Returns:
        Compiled LangGraph workflow
    """

    # Collect all tools
    tools = []
    tools.extend(create_analytics_tools(db, user_id, account_id))
    tools.extend(create_category_tools(db, user_id))
    tools.extend(create_tag_tools(db, user_id))
    tools.extend(create_budget_tools(db, user_id))
    tools.extend(create_transaction_tools(db, user_id, account_id))
    if user_context:
        tools.extend(create_advice_tools(db, user_id, user_context))

    # Initialize LLM with tools
    llm = ChatAnthropic(
        model="claude-sonnet-4-5-20250929",  # Using Sonnet 4.5 for better reasoning
        temperature=0,
        max_tokens=4096,
        api_key=settings.ANTHROPIC_API_KEY
    )
    llm_with_tools = llm.bind_tools(tools)

    # Define the agent node
    def agent_node(state: AssistantState):
        """Agent reasoning node - decides which tools to call or responds"""
        messages = state["messages"]
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    # Define conditional edge logic
    def should_continue(state: AssistantState) -> Literal["tools", "end"]:
        """Determine if we should continue to tools or end"""
        messages = state["messages"]
        last_message = messages[-1]

        # If there are no tool calls, we're done
        if not hasattr(last_message, "tool_calls") or not last_message.tool_calls:
            return "end"
        return "tools"

    # Build the graph
    workflow = StateGraph(AssistantState)

    # Add nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", ToolNode(tools))

    # Set entry point
    workflow.set_entry_point("agent")

    # Add edges
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            "end": END,
        },
    )

    # After tools execute, go back to agent for synthesis
    workflow.add_edge("tools", "agent")

    # Compile the graph
    return workflow.compile()
