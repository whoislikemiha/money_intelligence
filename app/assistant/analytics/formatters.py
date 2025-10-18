"""Format query results for LLM consumption and frontend display"""

from typing import Any
from datetime import datetime


def format_spending_by_category(results: list) -> dict[str, Any]:
    """Format spending by category results"""
    if not results:
        return {
            "summary": "No transactions found for the specified period.",
            "data": [],
            "total": 0
        }

    data = []
    total = 0
    for row in results:
        amount = float(row.total_amount)
        total += amount
        data.append({
            "category_name": row.category_name,
            "category_id": row.category_id,
            "amount": amount,
            "transaction_count": row.transaction_count
        })

    # Add percentages
    for item in data:
        item["percentage"] = (item["amount"] / total * 100) if total > 0 else 0

    summary = f"Total spending across {len(data)} categories: ${total:.2f}. "
    if data:
        top_category = data[0]
        summary += f"Highest spending: {top_category['category_name']} (${top_category['amount']:.2f}, {top_category['percentage']:.1f}%)"

    return {
        "summary": summary,
        "data": data,
        "total": total,
        "category_count": len(data)
    }


def format_spending_over_time(results: list, group_by: str = 'day') -> dict[str, Any]:
    """Format spending trends over time"""
    if not results:
        return {
            "summary": "No transaction data found for the specified period.",
            "data": [],
            "total_income": 0,
            "total_expense": 0
        }

    data = []
    total_income = 0
    total_expense = 0

    for row in results:
        income = float(row.income) if row.income else 0
        expense = float(row.expense) if row.expense else 0
        total_income += income
        total_expense += expense

        # Format period based on grouping
        if isinstance(row.period, datetime):
            period_str = row.period.strftime('%Y-%m-%d')
        else:
            period_str = str(row.period)

        data.append({
            "period": period_str,
            "income": income,
            "expense": expense,
            "net": income - expense
        })

    summary = f"Period analysis ({group_by}): Total income ${total_income:.2f}, Total expense ${total_expense:.2f}, Net ${total_income - total_expense:.2f}"

    return {
        "summary": summary,
        "data": data,
        "total_income": total_income,
        "total_expense": total_expense,
        "net": total_income - total_expense,
        "period_count": len(data),
        "group_by": group_by
    }


def format_budget_utilization(results: list) -> dict[str, Any]:
    """Format budget vs spending comparison"""
    if not results:
        return {
            "summary": "No budgets found.",
            "data": [],
            "total_budgeted": 0,
            "total_spent": 0
        }

    data = results  # Already in dict format from query
    total_budgeted = sum(item["budget_amount"] for item in data)
    total_spent = sum(item["spent_amount"] for item in data)

    over_budget = [item for item in data if item["utilization_percent"] > 100]
    near_limit = [item for item in data if 80 <= item["utilization_percent"] <= 100]

    summary = f"Budget overview: ${total_spent:.2f} spent of ${total_budgeted:.2f} budgeted ({(total_spent/total_budgeted*100) if total_budgeted > 0 else 0:.1f}%). "

    if over_budget:
        summary += f"{len(over_budget)} category(ies) over budget. "
    if near_limit:
        summary += f"{len(near_limit)} category(ies) near limit. "

    return {
        "summary": summary,
        "data": data,
        "total_budgeted": total_budgeted,
        "total_spent": total_spent,
        "over_budget_count": len(over_budget),
        "near_limit_count": len(near_limit)
    }


def format_top_expenses(results: list) -> dict[str, Any]:
    """Format top expenses list"""
    if not results:
        return {
            "summary": "No expenses found for the specified period.",
            "data": []
        }

    data = []
    total = 0

    for row in results:
        amount = float(row.amount)
        total += amount
        data.append({
            "date": row.date.isoformat() if hasattr(row.date, 'isoformat') else str(row.date),
            "description": row.description or "No description",
            "amount": amount,
            "category": row.category_name or "Uncategorized"
        })

    summary = f"Top {len(data)} expenses totaling ${total:.2f}. "
    if data:
        summary += f"Highest: {data[0]['description']} (${data[0]['amount']:.2f} on {data[0]['date']})"

    return {
        "summary": summary,
        "data": data,
        "total": total
    }


def format_income_vs_expense(result: dict) -> dict[str, Any]:
    """Format income vs expense summary"""
    income = result["income"]
    expense = result["expense"]
    net = result["net"]

    if net > 0:
        status = "positive"
        summary = f"You're in the green! Income: ${income:.2f}, Expense: ${expense:.2f}, Net savings: ${net:.2f}"
    elif net < 0:
        status = "negative"
        summary = f"Spending exceeded income. Income: ${income:.2f}, Expense: ${expense:.2f}, Deficit: ${abs(net):.2f}"
    else:
        status = "neutral"
        summary = f"Break even. Income: ${income:.2f}, Expense: ${expense:.2f}"

    return {
        "summary": summary,
        "data": {
            "income": income,
            "expense": expense,
            "net": net,
            "income_count": result["income_count"],
            "expense_count": result["expense_count"],
            "total_transactions": result["total_transactions"]
        },
        "status": status
    }


def format_spending_by_tag(results: list) -> dict[str, Any]:
    """Format spending by tag results"""
    if not results:
        return {
            "summary": "No tagged transactions found for the specified period.",
            "data": [],
            "total": 0
        }

    data = []
    total = 0
    for row in results:
        amount = float(row.total_amount)
        total += amount
        data.append({
            "tag_name": row.tag_name,
            "tag_id": row.tag_id,
            "amount": amount,
            "transaction_count": row.transaction_count
        })

    # Add percentages
    for item in data:
        item["percentage"] = (item["amount"] / total * 100) if total > 0 else 0

    summary = f"Total spending across {len(data)} tags: ${total:.2f}. "
    if data:
        top_tag = data[0]
        summary += f"Most used tag: {top_tag['tag_name']} (${top_tag['amount']:.2f}, {top_tag['transaction_count']} transactions)"

    return {
        "summary": summary,
        "data": data,
        "total": total,
        "tag_count": len(data)
    }
