from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, Field



class GetSpendingByCategoryInput(BaseModel):
    """Input schema for get_spending_by_category tool"""
    period: Literal["today", "week", "month", "year", "all"] = Field(
        default="month",
        description="Time period to analyze"
    )
    transaction_type: Optional[Literal["income", "expense"]] = Field(
        default="expense",
        description="Filter by transaction type"
    )


class GetSpendingTrendsInput(BaseModel):
    """Input schema for get_spending_trends tool"""
    period: Literal["week", "month", "quarter", "year"] = Field(
        default="month",
        description="Time period to analyze"
    )
    group_by: Literal["day", "week", "month"] = Field(
        default="day",
        description="Group results by time unit"
    )


class GetBudgetAnalysisInput(BaseModel):
    """Input schema for get_budget_analysis tool"""
    month: Optional[int] = Field(
        default=None,
        ge=1,
        le=12,
        description="Month number (1-12), defaults to current month"
    )
    year: Optional[int] = Field(
        default=None,
        ge=2000,
        le=2100,
        description="Year (e.g., 2024), defaults to current year"
    )


class GetTopExpensesInput(BaseModel):
    """Input schema for get_top_expenses tool"""
    period: Literal["week", "month", "year", "all"] = Field(
        default="month",
        description="Time period to analyze"
    )
    limit: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Number of top expenses to return"
    )


class GetIncomeVsExpenseInput(BaseModel):
    """Input schema for get_income_vs_expense tool"""
    period: Literal["today", "week", "month", "year", "all"] = Field(
        default="month",
        description="Time period to analyze"
    )


class GetSpendingByTagInput(BaseModel):
    """Input schema for get_spending_by_tag tool"""
    period: Literal["week", "month", "year", "all"] = Field(
        default="month",
        description="Time period to analyze"
    )



class ListCategoriesInput(BaseModel):
    """Input schema for list_categories tool (no parameters)"""
    pass


class ListTagsInput(BaseModel):
    """Input schema for list_tags tool (no parameters)"""
    pass


class ListBudgetsInput(BaseModel):
    """Input schema for list_budgets tool (no parameters)"""
    pass



class CreateTransactionsInput(BaseModel):
    """Input schema for create_transactions tool"""
    text: str = Field(
        description="Natural language description of transactions to create. "
                    "Examples: 'I spent $50 on groceries yesterday', "
                    "'Add coffee for $5, lunch $15, and gas $40', "
                    "'Got paid $2000 today'"
    )


class TransactionPreview(BaseModel):
    """Transaction preview output schema"""
    amount: float = Field(description="Transaction amount (positive number)")
    description: str = Field(description="Transaction description")
    category_id: int = Field(description="Category ID")
    type: Literal["income", "expense"] = Field(description="Transaction type")
    date: str = Field(description="Transaction date in YYYY-MM-DD format")
    tags: list[int] = Field(default_factory=list, description="List of tag IDs")


class TransactionPreviewsOutput(BaseModel):
    """Output schema for transaction creation tool"""
    transactions: list[TransactionPreview] = Field(
        description="List of transaction previews to be confirmed by user"
    )
    count: int = Field(description="Number of transactions identified")
    message: str = Field(description="Human-readable summary message")



class GetFinancialAdviceInput(BaseModel):
    """Input schema for get_financial_advice tool"""
    question: str = Field(
        description="Specific financial question or area for advice. "
                    "Examples: 'How can I save more money?', "
                    "'Should I increase my entertainment budget?', "
                    "'What's a good budget for groceries?'"
    )
    context: Optional[str] = Field(
        default=None,
        description="Additional context like recent spending, budgets, or financial goals"
    )



class CategoryInfo(BaseModel):
    """Category information"""
    id: int
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None


class TagInfo(BaseModel):
    """Tag information"""
    id: int
    name: str
    color: Optional[str] = None


class BudgetInfo(BaseModel):
    """Budget information"""
    id: int
    category_id: int
    category_name: str
    category_icon: Optional[str] = None
    amount: float
    notes: Optional[str] = None


class SpendingCategoryBreakdown(BaseModel):
    """Spending breakdown by category"""
    category_name: str
    amount: float
    percentage: float
    transaction_count: int


class SpendingByCategoryOutput(BaseModel):
    """Output schema for spending by category analysis"""
    total_amount: float
    categories: list[SpendingCategoryBreakdown]
    summary: str


class TrendDataPoint(BaseModel):
    """Single data point in spending trend"""
    period: str
    income: float
    expenses: float
    net: float


class SpendingTrendsOutput(BaseModel):
    """Output schema for spending trends analysis"""
    data_points: list[TrendDataPoint]
    summary: str


class BudgetUtilizationItem(BaseModel):
    """Budget utilization for a single category"""
    category_name: str
    budget_amount: float
    spent_amount: float
    remaining: float
    utilization_percent: float
    status: Literal["on_track", "warning", "over_budget"]


class BudgetUtilizationOutput(BaseModel):
    """Output schema for budget utilization analysis"""
    budgets: list[BudgetUtilizationItem]
    total_budgeted: float
    total_spent: float
    summary: str


class TopExpenseItem(BaseModel):
    """Single top expense item"""
    description: str
    amount: float
    category: str
    date: str
    tags: list[str]


class TopExpensesOutput(BaseModel):
    """Output schema for top expenses analysis"""
    expenses: list[TopExpenseItem]
    total_amount: float
    summary: str


class IncomeVsExpenseOutput(BaseModel):
    """Output schema for income vs expense analysis"""
    total_income: float
    total_expenses: float
    net_savings: float
    total_transactions: int
    summary: str


class TagSpendingBreakdown(BaseModel):
    """Spending breakdown by tag"""
    tag_name: str
    amount: float
    percentage: float
    transaction_count: int


class SpendingByTagOutput(BaseModel):
    """Output schema for spending by tag analysis"""
    total_amount: float
    tags: list[TagSpendingBreakdown]
    summary: str
