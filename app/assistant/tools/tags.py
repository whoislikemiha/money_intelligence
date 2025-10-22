"""Tag management tools"""

from langchain_core.tools import tool
from sqlalchemy.orm import Session

from app.assistant.schemas.tools import ListTagsInput
from app.crud.tag_crud import TagCrud


def create_tag_tools(db: Session, user_id: int):
    """Factory to create tag tools with database and user context"""

    @tool(args_schema=ListTagsInput)
    def list_tags() -> str:
        """
        List all available tags.
        Shows tag names and colors.
        """
        tags = TagCrud.get_all_tags(db, user_id)

        if not tags:
            return "No tags found. You can create tags to add additional labels to your transactions."

        lines = ["Your tags:"]
        for tag in tags:
            color = tag.color or "gray"
            lines.append(f"- {tag.name} (ID: {tag.id}, color: {color})")

        return "\n".join(lines)

    return [list_tags]
