"""Pre-built SQL query templates for financial analytics"""

from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_
from datetime import datetime, timedelta, date
from typing import Optional, Union

from app.database.models.transaction import Transaction
from app.database.models.category import Category
from app.database.models.budget import Budget
from app.database.models.tag import Tag
from app.database.models.enums import TransactionType


def normalize_to_date(dt: Optional[Union[datetime, date]]) -> Optional[date]:
    """
    Normalize datetime or date to date object.

    Args:
        dt: datetime or date object, or None

    Returns:
        date object or None
    """
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.date()
    return dt


def spending_by_category_query(
    db: Session,
    user_id: int,
    account_id: Optional[int] = None,
    start_date: Optional[Union[datetime, date]] = None,
    end_date: Optional[Union[datetime, date]] = None,
    transaction_type: Optional[TransactionType] = None
):
    """
    Get spending/income grouped by category

    Returns: List of (category_name, category_id, total_amount, transaction_count)
    """
    query = db.query(
        Category.name.label('category_name'),
        Category.id.label('category_id'),
        func.sum(Transaction.amount).label('total_amount'),
        func.count(Transaction.id).label('transaction_count')
    ).join(
        Transaction, Transaction.category_id == Category.id
    ).filter(
        Transaction.user_id == user_id
    )

    if account_id:
        query = query.filter(Transaction.account_id == account_id)

    start = normalize_to_date(start_date)
    end = normalize_to_date(end_date)

    if start:
        query = query.filter(Transaction.date >= start)

    if end:
        query = query.filter(Transaction.date <= end)

    if transaction_type:
        query = query.filter(Transaction.type == transaction_type)

    query = query.group_by(Category.name, Category.id).order_by(func.sum(Transaction.amount).desc())

    return query.all()


def spending_over_time_query(
    db: Session,
    user_id: int,
    account_id: Optional[int] = None,
    start_date: Optional[Union[datetime, date]] = None,
    end_date: Optional[Union[datetime, date]] = None,
    group_by: str = 'day'  # 'day', 'week', 'month', 'year'
):
    """
    Get spending trends over time

    Returns: List of (period, income_total, expense_total)
    """
    # Build date grouping based on granularity
    if group_by == 'day':
        date_group = Transaction.date
    elif group_by == 'week':
        date_group = func.date_trunc('week', Transaction.date)
    elif group_by == 'month':
        date_group = func.date_trunc('month', Transaction.date)
    elif group_by == 'year':
        date_group = extract('year', Transaction.date)
    else:
        date_group = Transaction.date

    # Separate queries for income and expense
    income_subquery = db.query(
        date_group.label('period'),
        func.sum(Transaction.amount).label('income_total')
    ).filter(
        and_(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.INCOME
        )
    )

    expense_subquery = db.query(
        date_group.label('period'),
        func.sum(Transaction.amount).label('expense_total')
    ).filter(
        and_(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE
        )
    )

    if account_id:
        income_subquery = income_subquery.filter(Transaction.account_id == account_id)
        expense_subquery = expense_subquery.filter(Transaction.account_id == account_id)

    start = normalize_to_date(start_date)
    end = normalize_to_date(end_date)

    if start:
        income_subquery = income_subquery.filter(Transaction.date >= start)
        expense_subquery = expense_subquery.filter(Transaction.date >= start)

    if end:
        income_subquery = income_subquery.filter(Transaction.date <= end)
        expense_subquery = expense_subquery.filter(Transaction.date <= end)

    income_subquery = income_subquery.group_by('period').subquery()
    expense_subquery = expense_subquery.group_by('period').subquery()

    # Combine results
    query = db.query(
        func.coalesce(income_subquery.c.period, expense_subquery.c.period).label('period'),
        func.coalesce(income_subquery.c.income_total, 0).label('income'),
        func.coalesce(expense_subquery.c.expense_total, 0).label('expense')
    ).outerjoin(
        expense_subquery, income_subquery.c.period == expense_subquery.c.period
    ).order_by('period')

    return query.all()


def budget_utilization_query(
    db: Session,
    user_id: int,
    account_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None
):
    """
    Compare spending vs budgets for each category

    Returns: List of (category_name, budget_amount, spent_amount, remaining, utilization_percent)
    """
    # Default to current month if not specified
    if not month or not year:
        now = datetime.now()
        month = month or now.month
        year = year or now.year

    # Get budgets with their categories
    budgets_query = db.query(
        Budget.category_id,
        Category.name.label('category_name'),
        Budget.amount.label('budget_amount')
    ).join(
        Category, Budget.category_id == Category.id
    ).filter(
        Budget.user_id == user_id
    )

    budgets = budgets_query.all()

    results = []
    for budget in budgets:
        # Calculate spending for this category in the specified period
        spending_query = db.query(
            func.sum(Transaction.amount)
        ).filter(
            and_(
                Transaction.user_id == user_id,
                Transaction.category_id == budget.category_id,
                Transaction.type == TransactionType.EXPENSE,
                extract('month', Transaction.date) == month,
                extract('year', Transaction.date) == year
            )
        )

        if account_id:
            spending_query = spending_query.filter(Transaction.account_id == account_id)

        spent_amount = spending_query.scalar() or 0
        budget_amount = float(budget.budget_amount)
        remaining = budget_amount - float(spent_amount)
        utilization_percent = (float(spent_amount) / budget_amount * 100) if budget_amount > 0 else 0

        results.append({
            'category_name': budget.category_name,
            'category_id': budget.category_id,
            'budget_amount': budget_amount,
            'spent_amount': float(spent_amount),
            'remaining': remaining,
            'utilization_percent': utilization_percent
        })

    return results


def top_expenses_query(
    db: Session,
    user_id: int,
    account_id: Optional[int] = None,
    start_date: Optional[Union[datetime, date]] = None,
    end_date: Optional[Union[datetime, date]] = None,
    limit: int = 10
):
    """
    Get top N highest expense transactions

    Returns: List of (date, description, amount, category_name)
    """
    query = db.query(
        Transaction.date,
        Transaction.description,
        Transaction.amount,
        Category.name.label('category_name')
    ).outerjoin(
        Category, Transaction.category_id == Category.id
    ).filter(
        and_(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE
        )
    )

    if account_id:
        query = query.filter(Transaction.account_id == account_id)

    start = normalize_to_date(start_date)
    end = normalize_to_date(end_date)

    if start:
        query = query.filter(Transaction.date >= start)

    if end:
        query = query.filter(Transaction.date <= end)

    query = query.order_by(Transaction.amount.desc()).limit(limit)

    return query.all()


def income_vs_expense_summary(
    db: Session,
    user_id: int,
    account_id: Optional[int] = None,
    start_date: Optional[Union[datetime, date]] = None,
    end_date: Optional[Union[datetime, date]] = None
):
    """
    Get total income, expense, and net for a period

    Returns: dict with income, expense, net, transaction_count
    """
    query = db.query(
        Transaction.type,
        func.sum(Transaction.amount).label('total'),
        func.count(Transaction.id).label('count')
    ).filter(
        Transaction.user_id == user_id
    )

    if account_id:
        query = query.filter(Transaction.account_id == account_id)

    start = normalize_to_date(start_date)
    end = normalize_to_date(end_date)

    if start:
        query = query.filter(Transaction.date >= start)

    if end:
        query = query.filter(Transaction.date <= end)

    results = query.group_by(Transaction.type).all()

    income = 0
    expense = 0
    income_count = 0
    expense_count = 0

    for result in results:
        if result.type == TransactionType.INCOME:
            income = float(result.total)
            income_count = result.count
        else:
            expense = float(result.total)
            expense_count = result.count

    return {
        'income': income,
        'expense': expense,
        'net': income - expense,
        'income_count': income_count,
        'expense_count': expense_count,
        'total_transactions': income_count + expense_count
    }


def spending_by_tag_query(
    db: Session,
    user_id: int,
    account_id: Optional[int] = None,
    start_date: Optional[Union[datetime, date]] = None,
    end_date: Optional[Union[datetime, date]] = None
):
    """
    Get spending grouped by tag

    Returns: List of (tag_name, tag_id, total_amount, transaction_count)
    """
    query = db.query(
        Tag.name.label('tag_name'),
        Tag.id.label('tag_id'),
        func.sum(Transaction.amount).label('total_amount'),
        func.count(Transaction.id).label('transaction_count')
    ).join(
        Transaction.tags
    ).filter(
        Transaction.user_id == user_id
    )

    if account_id:
        query = query.filter(Transaction.account_id == account_id)

    start = normalize_to_date(start_date)
    end = normalize_to_date(end_date)

    if start:
        query = query.filter(Transaction.date >= start)

    if end:
        query = query.filter(Transaction.date <= end)

    query = query.group_by(Tag.name, Tag.id).order_by(func.sum(Transaction.amount).desc())

    return query.all()
