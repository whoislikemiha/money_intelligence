"""Budget management tools"""

from typing import Annotated
from langchain_core.tools import tool
from sqlalchemy.orm import Session

from app.crud.budget_crud import BudgetCrud
from app.crud.category_crud import CategoryCrud


def create_budget_tools(db: Session, user_id: int):
    """Factory to create budget tools with database and user context"""

    @tool
    def list_budgets() -> str:
        """
        List all budgets with their categories and amounts.
        Shows which categories have budget limits set.
        """
        budgets = BudgetCrud.get_all_budgets(db, user_id)

        if not budgets:
            return "No budgets found. You can create budgets to track spending limits for each category."

        # Get categories for name lookup
        categories = {cat.id: cat for cat in CategoryCrud.get_all_categories(db, user_id)}

        lines = ["Your budgets:"]
        total_budgeted = 0

        for budget in budgets:
            category = categories.get(budget.category_id)
            category_name = category.name if category else f"Category {budget.category_id}"
            category_icon = category.icon if category else "📁"
            amount = float(budget.amount)
            total_budgeted += amount

            notes = f" ({budget.notes})" if budget.notes else ""
            lines.append(f"- {category_icon} {category_name}: ${amount:.2f}{notes}")

        lines.append(f"\nTotal budgeted: ${total_budgeted:.2f}")

        return "\n".join(lines)

    return [list_budgets]
