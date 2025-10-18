"""Category management tools"""

from typing import Annotated
from langchain_core.tools import tool
from sqlalchemy.orm import Session

from app.crud.category_crud import CategoryCrud


def create_category_tools(db: Session, user_id: int):
    """Factory to create category tools with database and user context"""

    @tool
    def list_categories() -> str:
        """
        List all available categories.
        Shows category names, icons, and colors.
        """
        categories = CategoryCrud.get_all_categories(db, user_id)

        if not categories:
            return "No categories found. You can create categories to organize your transactions."

        lines = ["Your categories:"]
        for cat in categories:
            icon = cat.icon or "📁"
            color = cat.color or "gray"
            lines.append(f"- {icon} {cat.name} (ID: {cat.id}, color: {color})")

        return "\n".join(lines)

    return [list_categories]
