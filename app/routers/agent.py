from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json

from app.auth.dependencies import get_current_active_user
from app.database.database import get_db
from app.schemas.agent import AgentProcessRequest, AgentProcessResponse
from app.schemas.user import User
from app.crud.category_crud import CategoryCrud
from app.crud.tag_crud import TagCrud
from app.agent.service import parse_transactions, parse_transactions_stream


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


@router.post("/process-stream")
async def process_agent_input_stream(
    request: AgentProcessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Stream transaction previews as they are created in real-time.
    Uses Server-Sent Events (SSE) to push transactions to the client as soon as
    each tool call completes, enabling parallel processing and real-time UI updates.
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

    async def event_generator():
        """Generate SSE events for each transaction as it's created"""
        try:
            async for transaction in parse_transactions_stream(
                text=request.text,
                account_id=request.account_id,
                user_id=current_user.id,
                user_categories=user_categories,
                user_tags=user_tags,
            ):
                # Convert to JSON and format as SSE
                event_data = json.dumps({
                    "type": "transaction",
                    "data": transaction
                })
                yield f"data: {event_data}\n\n"

            # Send completion event
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            # Send error event
            error_data = json.dumps({
                "type": "error",
                "message": str(e)
            })
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
