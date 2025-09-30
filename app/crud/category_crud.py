from sqlalchemy.orm import Session
from app.database.models.category import Category


class CategoryCrud:
    @staticmethod
    def create_default_categories(db: Session, user_id: int) -> list[Category]:
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

        categories = []
        for cat_data in default_categories:
            category = Category(
                user_id=user_id,
                name=cat_data["name"],
                icon=cat_data["icon"],
                color=cat_data["color"],
            )
            db.add(category)
            categories.append(category)

        db.commit()
        for category in categories:
            db.refresh(category)

        return categories

    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> list[Category]:
        return db.query(Category).filter(Category.user_id == user_id).all()

