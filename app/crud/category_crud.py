from sqlalchemy.orm import Session
from app.database.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


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
    def create_category(db: Session, user_id: int, category: CategoryCreate) -> Category:
        category_data = category.model_dump()
        category = Category(
            user_id=user_id,
            name=category_data["name"],
            icon=category_data["icon"],
            color=category_data["color"],
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def delete_category(db: Session, category_id: int):
        from app.database.models.transaction import Transaction

        category = db.query(Category).filter(Category.id == category_id).first()
        if category:
            # Set category_id to NULL for all transactions with this category
            db.query(Transaction).filter(Transaction.category_id == category_id).update(
                {Transaction.category_id: None}
            )
            db.delete(category)
            db.commit()

    @staticmethod
    def get_all_categories(db: Session, user_id: int):
        return db.query(Category).filter(Category.user_id == user_id).all()

    @staticmethod
    def update_category(db: Session, category_id: int, user_id: int, category_update: CategoryUpdate) -> Category | None:
        category = db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()
        if not category:
            return None
        update_data = category_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)
        db.commit()
        db.refresh(category)
        return category
