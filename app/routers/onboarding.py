from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.crud.account_crud import AccountCrud
from app.crud.budget_crud import BudgetCrud
from app.crud.category_crud import CategoryCrud
from app.crud.savings_goal_crud import SavingsGoalCrud
from app.crud.tag_crud import TagCrud
from app.crud.user_crud import UserCrud
from app.database.database import get_db
from app.database.models.user import User
from app.schemas.budget import BudgetCreate, Budget
from app.schemas.category import CategoryCreate, Category
from app.schemas.savings_goal import SavingsGoalCreate, SavingsGoal
from app.schemas.tag import TagCreate, Tag

router = APIRouter()


class OnboardingCategoryCreate(CategoryCreate):
    """Category creation during onboarding with optional is_selected flag"""

    is_selected: bool = True


class OnboardingBudgetCreate(BudgetCreate):
    """Budget creation during onboarding with optional tags"""

    tags: List[str] = []


class OnboardingCompleteRequest(BaseModel):
    """Data needed to complete onboarding"""

    initial_balance: float
    currency: str


@router.post("/categories", response_model=List[Category])
async def create_onboarding_categories(
    categories: List[OnboardingCategoryCreate],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Bulk create categories during onboarding.
    Only creates categories where is_selected=True.
    """
    created_categories = []

    for cat_data in categories:
        if cat_data.is_selected:
            # Remove is_selected before creating
            cat_dict = cat_data.model_dump(exclude={"is_selected"})
            cat_create = CategoryCreate(**cat_dict)
            category = CategoryCrud.create_category(db, current_user.id, cat_create)
            created_categories.append(category)

    return created_categories


@router.post("/budgets", response_model=List[Budget])
async def create_onboarding_budgets(
    budgets: List[OnboardingBudgetCreate],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Bulk create budgets during onboarding.
    Automatically creates tags if they don't exist and associates them with the budget.
    """
    created_budgets = []

    for budget_data in budgets:
        # Extract tags
        tag_names = budget_data.tags

        # Create budget without tags
        budget_dict = budget_data.model_dump(exclude={"tags"})
        budget_create = BudgetCreate(**budget_dict)
        budget = BudgetCrud.create_budget(db, current_user.id, budget_create)

        # Create/get tags and associate with budget
        if tag_names:
            for tag_name in tag_names:
                # Check if tag exists
                existing_tag = TagCrud.get_tag_by_name(db, current_user.id, tag_name)
                if not existing_tag:
                    # Create new tag with random color
                    tag_create = TagCreate(name=tag_name, color="#A0A0A0")
                    existing_tag = TagCrud.create_tag(db, current_user.id, tag_create)

                # TODO: Associate tag with budget's category
                # Note: Tags are associated with transactions/reminders, not budgets directly
                # This might need schema adjustment if we want budget-specific tags

        created_budgets.append(budget)

    return created_budgets


@router.post("/savings-goals", response_model=List[SavingsGoal])
async def create_onboarding_savings_goals(
    savings_goals: List[SavingsGoalCreate],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Bulk create savings goals during onboarding.
    """
    created_goals = []

    for goal_data in savings_goals:
        goal = SavingsGoalCrud.create_savings_goal(db, current_user.id, goal_data)
        created_goals.append(goal)

    return created_goals


@router.post("/complete")
async def complete_onboarding(
    data: OnboardingCompleteRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Mark onboarding as complete and create the default account.
    This should be called after all onboarding steps are done.
    """
    if current_user.onboarding_completed:
        raise HTTPException(status_code=400, detail="Onboarding already completed")

    # Create default account with provided initial balance and currency
    AccountCrud.create_default_account(
        db, current_user.id, data.initial_balance, data.currency
    )

    # Mark onboarding as complete
    current_user.onboarding_completed = True
    db.commit()
    db.refresh(current_user)

    return {"message": "Onboarding completed successfully", "user": current_user}


@router.get("/default-categories", response_model=List[dict])
async def get_default_categories():
    """
    Get the list of default categories with their icons and colors.
    This is used to pre-populate the category selection during onboarding.
    """
    default_categories = [
        {"name": "Food & Groceries", "icon": "🍽", "color": "#FF6B6B"},
        {"name": "Transportation", "icon": "🚗", "color": "#4ECDC4"},
        {"name": "Shopping", "icon": "🛍", "color": "#45B7D1"},
        {"name": "Entertainment", "icon": "🎬", "color": "#FFA07A"},
        {"name": "Bills & Utilities", "icon": "⚡", "color": "#98D8C8"},
        {"name": "Healthcare", "icon": "🏥", "color": "#FF9F9B"},
        {"name": "Income", "icon": "💰", "color": "#90EE90"},
        {"name": "Other", "icon": "📝", "color": "#D3D3D3"},
    ]
    return default_categories


@router.get("/category-suggestions", response_model=List[dict])
async def get_category_suggestions():
    """
    Get additional category suggestions that users can add during onboarding.
    """
    suggestions = [
        {"name": "Education", "icon": "📚", "color": "#9B59B6"},
        {"name": "Fitness & Sports", "icon": "🏋️", "color": "#E74C3C"},
        {"name": "Travel", "icon": "✈️", "color": "#3498DB"},
        {"name": "Gifts & Donations", "icon": "🎁", "color": "#F39C12"},
        {"name": "Pet Care", "icon": "🐾", "color": "#16A085"},
        {"name": "Beauty & Personal Care", "icon": "💄", "color": "#E91E63"},
        {"name": "Home & Garden", "icon": "🏡", "color": "#8BC34A"},
        {"name": "Insurance", "icon": "🛡️", "color": "#607D8B"},
        {"name": "Subscriptions", "icon": "📱", "color": "#FF5722"},
        {"name": "Coffee & Dining Out", "icon": "☕", "color": "#795548"},
    ]
    return suggestions
