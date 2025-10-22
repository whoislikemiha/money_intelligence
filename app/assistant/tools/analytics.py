"""Analytics tools for financial insights"""

from langchain_core.tools import tool
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.assistant.schemas.tools import (
    GetSpendingByCategoryInput,
    GetSpendingTrendsInput,
    GetBudgetAnalysisInput,
    GetTopExpensesInput,
    GetIncomeVsExpenseInput,
    GetSpendingByTagInput,
)
from app.assistant.analytics.queries import (
    spending_by_category_query,
    spending_over_time_query,
    budget_utilization_query,
    top_expenses_query,
    income_vs_expense_summary,
    spending_by_tag_query
)
from app.assistant.analytics.formatters import (
    format_spending_by_category,
    format_spending_over_time,
    format_budget_utilization,
    format_top_expenses,
    format_income_vs_expense,
    format_spending_by_tag
)
from app.database.models.enums import TransactionType


# These tools need database access, so they'll be created as factory functions
# that receive a db session

def create_analytics_tools(db: Session, user_id: int, account_id: int):
    """Factory to create analytics tools with database and user context"""

    @tool(args_schema=GetSpendingByCategoryInput)
    def get_spending_by_category(
        period: str = "month",
        transaction_type: str | None = "expense"
    ) -> str:
        """
        Get spending or income broken down by category.
        Returns total amount and transaction count for each category.
        """
        # Parse period
        end_date = datetime.now()
        start_date = None

        if period == "today":
            start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "week":
            start_date = end_date - timedelta(days=7)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
        elif period == "year":
            start_date = end_date - timedelta(days=365)

        # Parse transaction type
        trans_type = None
        if transaction_type == "income":
            trans_type = TransactionType.INCOME
        elif transaction_type == "expense":
            trans_type = TransactionType.EXPENSE

        results = spending_by_category_query(
            db=db,
            user_id=user_id,
            account_id=account_id,
            start_date=start_date,
            end_date=end_date,
            transaction_type=trans_type
        )

        formatted = format_spending_by_category(results)
        return formatted["summary"] + "\n\nDetailed breakdown:\n" + "\n".join(
            f"- {item['category_name']}: ${item['amount']:.2f} ({item['percentage']:.1f}%, {item['transaction_count']} transactions)"
            for item in formatted["data"]
        )

    @tool(args_schema=GetSpendingTrendsInput)
    def get_spending_trends(
        period: str = "month",
        group_by: str = "day"
    ) -> str:
        """
        Get spending trends over time, showing income and expenses by day/week/month.
        Useful for understanding spending patterns and trends.
        """
        # Parse period
        end_date = datetime.now()
        if period == "week":
            start_date = end_date - timedelta(days=7)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
        elif period == "quarter":
            start_date = end_date - timedelta(days=90)
        elif period == "year":
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)

        results = spending_over_time_query(
            db=db,
            user_id=user_id,
            account_id=account_id,
            start_date=start_date,
            end_date=end_date,
            group_by=group_by
        )

        formatted = format_spending_over_time(results, group_by)
        return formatted["summary"]

    @tool(args_schema=GetBudgetAnalysisInput)
    def get_budget_analysis(
        month: int | None = None,
        year: int | None = None
    ) -> str:
        """
        Analyze budget utilization for each category.
        Shows how much has been spent vs budgeted amounts.
        Highlights categories over budget or nearing limits.
        """
        results = budget_utilization_query(
            db=db,
            user_id=user_id,
            account_id=account_id,
            month=month,
            year=year
        )

        formatted = format_budget_utilization(results)
        if not formatted["data"]:
            return formatted["summary"]

        details = []
        for item in formatted["data"]:
            status = "✓" if item["utilization_percent"] <= 80 else "⚠" if item["utilization_percent"] <= 100 else "✗"
            details.append(
                f"{status} {item['category_name']}: ${item['spent_amount']:.2f} / ${item['budget_amount']:.2f} "
                f"({item['utilization_percent']:.1f}%, ${item['remaining']:.2f} remaining)"
            )

        return formatted["summary"] + "\n\n" + "\n".join(details)

    @tool(args_schema=GetTopExpensesInput)
    def get_top_expenses(
        period: str = "month",
        limit: int = 10
    ) -> str:
        """
        Get the highest expense transactions for a given period.
        Useful for identifying large purchases or unusual spending.
        """
        # Validate and clamp limit
        limit = max(1, min(50, limit))

        # Parse period
        end_date = datetime.now()
        start_date = None

        if period == "week":
            start_date = end_date - timedelta(days=7)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
        elif period == "year":
            start_date = end_date - timedelta(days=365)

        results = top_expenses_query(
            db=db,
            user_id=user_id,
            account_id=account_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )

        formatted = format_top_expenses(results)
        if not formatted["data"]:
            return formatted["summary"]

        details = []
        for i, item in enumerate(formatted["data"], 1):
            details.append(
                f"{i}. {item['description']} - ${item['amount']:.2f} ({item['category']}, {item['date']})"
            )

        return formatted["summary"] + "\n\n" + "\n".join(details)

    @tool(args_schema=GetIncomeVsExpenseInput)
    def get_income_vs_expense(
        period: str = "month"
    ) -> str:
        """
        Compare total income vs expenses for a period.
        Shows net savings or deficit.
        """
        # Parse period
        end_date = datetime.now()
        start_date = None

        if period == "today":
            start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "week":
            start_date = end_date - timedelta(days=7)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
        elif period == "year":
            start_date = end_date - timedelta(days=365)

        result = income_vs_expense_summary(
            db=db,
            user_id=user_id,
            account_id=account_id,
            start_date=start_date,
            end_date=end_date
        )

        formatted = format_income_vs_expense(result)
        return formatted["summary"] + f" (Based on {formatted['data']['total_transactions']} transactions)"

    @tool(args_schema=GetSpendingByTagInput)
    def get_spending_by_tag(
        period: str = "month"
    ) -> str:
        """
        Get spending broken down by tags.
        Useful for tracking spending across custom categories like projects, people, or purposes.
        """
        # Parse period
        end_date = datetime.now()
        start_date = None

        if period == "week":
            start_date = end_date - timedelta(days=7)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
        elif period == "year":
            start_date = end_date - timedelta(days=365)

        results = spending_by_tag_query(
            db=db,
            user_id=user_id,
            account_id=account_id,
            start_date=start_date,
            end_date=end_date
        )

        formatted = format_spending_by_tag(results)
        if not formatted["data"]:
            return formatted["summary"]

        details = []
        for item in formatted["data"]:
            details.append(
                f"- {item['tag_name']}: ${item['amount']:.2f} ({item['percentage']:.1f}%, {item['transaction_count']} transactions)"
            )

        return formatted["summary"] + "\n\n" + "\n".join(details)

    return [
        get_spending_by_category,
        get_spending_trends,
        get_budget_analysis,
        get_top_expenses,
        get_income_vs_expense,
        get_spending_by_tag
    ]
