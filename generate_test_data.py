"""
Script to generate realistic test data for test@email.com user
- 2 months of transaction history
- Starting balance: 5000 EUR
- Monthly income: 2000 EUR (salary)
- Monthly expenses: ~1500 EUR
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.crud.user_crud import UserCrud
from app.crud.account_crud import AccountCrud
from app.crud.category_crud import CategoryCrud
from app.crud.tag_crud import TagCrud
from app.crud.transaction_crud import TransactionCrud
from app.database.models.enums import TransactionType
from app.schemas.transaction import TransactionCreate
from app.schemas.tag import TagCreate


def get_random_time():
    """Generate random time during business hours"""
    hour = random.randint(8, 20)
    minute = random.randint(0, 59)
    return hour, minute


def generate_test_data():
    db: Session = SessionLocal()

    try:
        # Get user
        user = UserCrud.get_by_email(db, "test@email.com")
        if not user:
            print("Error: User test@email.com not found!")
            return

        print(f"Found user: {user.email} (ID: {user.id})")

        # Get or create account
        accounts = AccountCrud.get_all_by_user_id(db, user.id)
        if accounts:
            account = accounts[0]
            print(f"Using existing account: {account.name} (ID: {account.id})")
            # Update initial balance to 5000 EUR
            AccountCrud.update_initial_balance(db, account.id, 5000.0)
            print("Updated initial balance to 5000 EUR")
        else:
            account = AccountCrud.create_default_account(db, user.id, 5000.0, "EUR")
            print(f"Created new account: {account.name} (ID: {account.id})")

        # Get categories
        categories = CategoryCrud.get_all_categories(db, user.id)
        if not categories:
            print("No categories found, creating default categories...")
            categories = CategoryCrud.create_default_categories(db, user.id)

        # Create category mapping
        category_map = {cat.name: cat.id for cat in categories}
        print(f"Available categories: {list(category_map.keys())}")

        # Create tags
        tag_names = ["recurring", "cash", "online", "work-related", "personal"]
        existing_tags = TagCrud.get_all_tags(db, user.id)
        existing_tag_names = {tag.name for tag in existing_tags}

        for tag_name in tag_names:
            if tag_name not in existing_tag_names:
                TagCrud.create_tag(db, user.id, TagCreate(
                    user_id=user.id,
                    name=tag_name,
                    color="#" + ''.join(random.choices('0123456789ABCDEF', k=6))
                ))

        all_tags = TagCrud.get_all_tags(db, user.id)
        tag_map = {tag.name: tag.id for tag in all_tags}
        print(f"Created/found tags: {list(tag_map.keys())}")

        # Define expense patterns (category, min_amount, max_amount, avg_per_month, description_templates)
        expense_patterns = [
            # Daily/frequent expenses
            ("Food & Groceries", 15, 120, 15, [
                "Grocery shopping at Lidl",
                "Hofer supermarket",
                "Billa grocery shopping",
                "Farmers market",
                "Fresh produce",
                "Weekly groceries",
            ]),
            ("Food & Groceries", 8, 25, 20, [
                "Lunch at work",
                "Coffee and breakfast",
                "Quick lunch",
                "Sandwich shop",
                "Bakery",
            ]),
            ("Transportation", 2.5, 4.5, 40, [
                "Public transport ticket",
                "Bus ticket",
                "Metro fare",
                "Tram ticket",
            ]),
            ("Transportation", 40, 65, 4, [
                "Gas station",
                "Fuel",
                "Tank refill",
            ]),

            # Weekly expenses
            ("Entertainment", 10, 50, 8, [
                "Cinema tickets",
                "Netflix subscription",
                "Spotify premium",
                "Concert tickets",
                "Books",
                "Video games",
            ]),
            ("Shopping", 20, 150, 6, [
                "Clothing store",
                "New shoes",
                "Online shopping",
                "Electronics",
                "Amazon order",
            ]),

            # Monthly recurring
            ("Bills & Utilities", 45, 65, 1, [
                "Internet bill",
            ]),
            ("Bills & Utilities", 80, 120, 1, [
                "Electricity bill",
            ]),
            ("Bills & Utilities", 25, 35, 1, [
                "Mobile phone bill",
            ]),
            ("Bills & Utilities", 500, 700, 1, [
                "Rent payment",
            ]),

            # Occasional expenses
            ("Healthcare", 25, 80, 2, [
                "Pharmacy",
                "Doctor visit copay",
                "Prescription",
                "Medical supplies",
            ]),
            ("Other", 10, 100, 4, [
                "Gifts",
                "Haircut",
                "Personal care",
                "Miscellaneous",
            ]),
        ]

        # Generate transactions for the past 2 months
        end_date = datetime.now()
        start_date = end_date - timedelta(days=60)

        transactions_created = 0

        # Generate salary payments (1st of each month)
        current_date = start_date
        while current_date <= end_date:
            # Check if it's the 1st
            if current_date.day == 1:
                if current_date >= start_date and current_date <= end_date:
                    transaction = TransactionCreate(
                        user_id=user.id,
                        account_id=account.id,
                        amount=2000.0,
                        description="Monthly salary",
                        date=current_date.date(),
                        type=TransactionType.INCOME,
                        category_id=category_map.get("Income"),
                        tags=[tag_map.get("recurring")],
                    )
                    TransactionCrud.create(db, transaction)
                    transactions_created += 1
                    print(f"Created income transaction: €2000 on {current_date.strftime('%Y-%m-%d')}")

            current_date += timedelta(days=1)

        # Generate daily expenses
        current_date = start_date
        while current_date <= end_date:
            # Skip future dates
            if current_date > end_date:
                break

            # Randomly decide how many transactions to create this day (0-5)
            # Weekends have fewer transactions
            is_weekend = current_date.weekday() >= 5
            max_transactions = 3 if is_weekend else 5
            num_transactions = random.randint(0, max_transactions)

            for _ in range(num_transactions):
                # Pick a random expense pattern
                pattern = random.choice(expense_patterns)
                category_name, min_amt, max_amt, avg_per_month, descriptions = pattern

                # Adjust probability based on frequency
                # Monthly bills should only appear once per month
                if avg_per_month == 1:
                    # Only create if it's between 1st-5th of month and we haven't created it yet
                    if current_date.day > 5:
                        continue
                    # Random chance to skip
                    if random.random() > 0.3:
                        continue

                # Generate random amount
                amount = round(random.uniform(min_amt, max_amt), 2)

                # Pick random description
                description = random.choice(descriptions)

                # Select tags
                selected_tags = []
                if "bill" in description.lower() or "subscription" in description.lower():
                    selected_tags.append(tag_map.get("recurring"))
                if random.random() > 0.7:
                    selected_tags.append(tag_map.get("online"))
                if random.random() > 0.8:
                    selected_tags.append(tag_map.get("personal"))

                # Create transaction (use date only, no time)
                transaction = TransactionCreate(
                    user_id=user.id,
                    account_id=account.id,
                    amount=amount,
                    description=description,
                    date=current_date.date(),
                    type=TransactionType.EXPENSE,
                    category_id=category_map.get(category_name),
                    tags=selected_tags if selected_tags else None,
                )

                try:
                    TransactionCrud.create(db, transaction)
                    transactions_created += 1
                except Exception as e:
                    print(f"Error creating transaction: {e}")

            current_date += timedelta(days=1)

        print(f"\n✅ Successfully created {transactions_created} transactions!")

        # Print summary
        all_transactions = TransactionCrud.get_all(db, user.id)
        total_income = sum(t.amount for t in all_transactions if t.type == TransactionType.INCOME)
        total_expenses = sum(t.amount for t in all_transactions if t.type == TransactionType.EXPENSE)

        print(f"\n📊 Summary:")
        print(f"   Starting balance: €5000.00")
        print(f"   Total income: €{total_income:.2f}")
        print(f"   Total expenses: €{total_expenses:.2f}")
        print(f"   Expected final balance: €{5000 + total_income - total_expenses:.2f}")

    finally:
        db.close()


if __name__ == "__main__":
    generate_test_data()
