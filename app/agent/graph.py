from typing import Literal
from langchain_anthropic import ChatAnthropic
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from app.agent.state import AgentState
from app.agent.tools import (
    create_transaction_preview,
    convert_currency,
)
from app.config import settings


# Define the tools
tools = [
    create_transaction_preview,
    convert_currency,
]


def create_agent_graph():
    """Create and compile the LangGraph agent"""

    # Initialize LLM with tools
    llm = ChatAnthropic(
        model="claude-haiku-4-5-20251001",
        temperature=0,
        max_tokens=4096,  # Increased from default 1024 to handle many transactions
        api_key=settings.ANTHROPIC_API_KEY
    )
    llm_with_tools = llm.bind_tools(tools)

    # Define the agent node
    def agent_node(state: AgentState):
        """Agent reasoning node - decides which tools to call"""
        messages = state["messages"]
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    # Define conditional edge logic
    def should_continue(state: AgentState) -> Literal["tools", "end"]:
        """Determine if we should continue to tools or end"""
        messages = state["messages"]
        last_message = messages[-1]

        # If there are no tool calls, we're done
        if not hasattr(last_message, "tool_calls") or not last_message.tool_calls:
            return "end"
        return "tools"

    # Build the graph
    workflow = StateGraph(AgentState)

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

    # After tools execute, end (no loop back)
    workflow.add_edge("tools", END)

    # Compile the graph
    return workflow.compile()


# Create the graph instance
agent_graph = create_agent_graph()
