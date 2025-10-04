from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.database.database import get_db
from app.schemas.agent import AgentProcessRequest, AgentProcessResponse
from app.schemas.user import User
from app.crud.category_crud import CategoryCrud
from app.crud.tag_crud import TagCrud
from app.agent.service import parse_transactions


router = APIRouter()


@router.post("/process", response_model=AgentProcessResponse)
async def process_agent_input(
    request: AgentProcessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Process natural language input to create transaction previews.
    The agent will parse the text and return transactions for user confirmation.
    """

    # Fetch user context
    categories = CategoryCrud.get_all_categories(db, current_user.id)
    tags = TagCrud.get_all_tags(db, current_user.id)

    # Prepare user context for agent
    user_categories = [
        {"id": cat.id, "name": cat.name, "icon": cat.icon}
        for cat in categories
    ]
    user_tags = [
        {"id": tag.id, "name": tag.name, "color": tag.color}
        for tag in tags
    ]

    # Parse transactions using agent
    transactions = parse_transactions(
        text=request.text,
        account_id=request.account_id,
        user_id=current_user.id,
        user_categories=user_categories,
        user_tags=user_tags,
    )

    return AgentProcessResponse(transactions=transactions)
