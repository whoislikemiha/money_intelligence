from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date, timedelta
from decimal import Decimal

from app.auth.dependencies import get_current_active_user
from app.database.database import get_db
from app.database.models.transaction import Transaction
from app.database.models.category import Category
from app.database.models.account import Account
from app.database.models.enums import TransactionType
from app.schemas.user import User

router = APIRouter()


@router.get("/dashboard-summary")
async def get_dashboard_summary(
    account_id: int = Query(..., description="Account ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard summary with current balance, last 30 days income and expenses.
    """
    # Get account for current balance
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()

    if not account:
        return {
            "current_balance": 0.0,
            "income_last_30_days": 0.0,
            "expenses_last_30_days": 0.0
        }

    # Calculate date range for last 30 days
    end_date = date.today()
    start_date = end_date - timedelta(days=30)

    # Get all transactions for this account
    all_transactions = db.query(Transaction).filter(
        Transaction.account_id == account_id,
        Transaction.user_id == current_user.id
    ).all()

    # Calculate current balance
    current_balance = float(account.initial_balance)
    for txn in all_transactions:
        if txn.type == TransactionType.INCOME:
            current_balance += float(txn.amount)
        else:
            current_balance -= float(txn.amount)

    # Get last 30 days transactions
    recent_transactions = db.query(Transaction).filter(
        Transaction.account_id == account_id,
        Transaction.user_id == current_user.id,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).all()

    # Calculate income and expenses for last 30 days
    income_last_30_days = sum(
        float(txn.amount) for txn in recent_transactions
        if txn.type == TransactionType.INCOME
    )

    expenses_last_30_days = sum(
        float(txn.amount) for txn in recent_transactions
        if txn.type == TransactionType.EXPENSE
    )

    return {
        "current_balance": current_balance,
        "income_last_30_days": income_last_30_days,
        "expenses_last_30_days": expenses_last_30_days
    }


@router.get("/spending-breakdown")
async def get_spending_breakdown(
    account_id: int = Query(..., description="Account ID"),
    start_date: date | None = Query(None, description="Start date for filtering"),
    end_date: date | None = Query(None, description="End date for filtering"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get category-wise spending breakdown for a specified date range.
    Returns total spending per category with percentages.
    Defaults to current month if no dates provided.
    """
    # Use provided dates or default to current month
    if start_date is None or end_date is None:
        now = datetime.now()
        month_start = date(now.year, now.month, 1)
        if now.month == 12:
            month_end = date(now.year + 1, 1, 1)
        else:
            month_end = date(now.year, now.month + 1, 1)
    else:
        month_start = start_date
        month_end = end_date

    # Query to get spending per category for the current month
    query = (
        db.query(
            Transaction.category_id,
            Category.name.label('category_name'),
            Category.icon.label('category_icon'),
            Category.color.label('category_color'),
            func.sum(Transaction.amount).label('total')
        )
        .join(Category, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.account_id == account_id,
            Transaction.type == TransactionType.EXPENSE,
            Transaction.date >= month_start,
            Transaction.date < month_end
        )
        .group_by(
            Transaction.category_id,
            Category.name,
            Category.icon,
            Category.color
        )
        .order_by(func.sum(Transaction.amount).desc())
    )

    results = query.all()

    # Calculate total spending for percentage calculation
    total_spending = sum(float(r.total) for r in results)

    # Format response
    breakdown = []
    for row in results:
        breakdown.append({
            "category_id": row.category_id,
            "category_name": row.category_name,
            "category_icon": row.category_icon,
            "category_color": row.category_color,
            "total": float(row.total),
            "percentage": (float(row.total) / total_spending * 100) if total_spending > 0 else 0
        })

    return breakdown


@router.get("/spending-timeline")
async def get_spending_timeline(
    account_id: int = Query(..., description="Account ID"),
    start_date: date | None = Query(None, description="Start date for filtering"),
    end_date: date | None = Query(None, description="End date for filtering"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get daily income and expense timeline for a specified date range.
    Returns daily totals for income, expenses, and net change.
    Defaults to current month if no dates provided.
    """
    # Use provided dates or default to current month
    if start_date is None or end_date is None:
        now = datetime.now()
        month_start = date(now.year, now.month, 1)
        if now.month == 12:
            month_end = date(now.year + 1, 1, 1)
        else:
            month_end = date(now.year, now.month + 1, 1)
    else:
        month_start = start_date
        month_end = end_date

    # Query transactions for the current month
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.account_id == account_id,
            Transaction.date >= month_start,
            Transaction.date < month_end
        )
        .all()
    )

    # Group by date and calculate income/expense
    daily_data = {}
    for txn in transactions:
        date_str = txn.date.strftime('%b %d')
        if date_str not in daily_data:
            daily_data[date_str] = {
                'date': date_str,
                'income': 0.0,
                'expense': 0.0,
                'net': 0.0
            }

        amount = float(txn.amount)
        if txn.type == TransactionType.INCOME:
            daily_data[date_str]['income'] += amount
            daily_data[date_str]['net'] += amount
        else:
            daily_data[date_str]['expense'] += amount
            daily_data[date_str]['net'] -= amount

    # Convert to list and sort by date
    timeline = list(daily_data.values())

    # Sort by parsing the date string back
    # Use the year from month_start for date parsing
    current_year = month_start.year
    def parse_date(date_str):
        return datetime.strptime(f"{date_str} {current_year}", '%b %d %Y')

    timeline.sort(key=lambda x: parse_date(x['date']))

    return timeline
