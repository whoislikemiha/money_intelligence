from decimal import Decimal
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database.models.savings_goal import SavingsGoal
from app.database.models.savings_transaction import SavingsTransaction
from app.schemas.savings_goal import SavingsGoalCreate, SavingsGoalUpdate


class SavingsGoalCrud:
    @staticmethod
    def create_savings_goal(db: Session, user_id: int, savings_goal: SavingsGoalCreate) -> SavingsGoal:
        savings_goal_data = savings_goal.model_dump()
        new_savings_goal = SavingsGoal(
            user_id=user_id,
            name=savings_goal_data["name"],
            target_amount=savings_goal_data.get("target_amount"),
            color=savings_goal_data.get("color", "#10b981"),
            notes=savings_goal_data.get("notes"),
        )
        db.add(new_savings_goal)
        db.commit()
        db.refresh(new_savings_goal)
        return new_savings_goal

    @staticmethod
    def get_all_savings_goals(db: Session, user_id: int) -> list[SavingsGoal]:
        return db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()

    @staticmethod
    def get_savings_goal_by_id(db: Session, savings_goal_id: int, user_id: int) -> SavingsGoal | None:
        return db.query(SavingsGoal).filter(SavingsGoal.id == savings_goal_id, SavingsGoal.user_id == user_id).first()

    @staticmethod
    def update_savings_goal(db: Session, savings_goal_id: int, user_id: int, savings_goal_update: SavingsGoalUpdate) -> SavingsGoal | None:
        savings_goal = db.query(SavingsGoal).filter(SavingsGoal.id == savings_goal_id, SavingsGoal.user_id == user_id).first()
        if not savings_goal:
            return None

        update_data = savings_goal_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(savings_goal, field, value)

        db.commit()
        db.refresh(savings_goal)
        return savings_goal

    @staticmethod
    def delete_savings_goal(db: Session, savings_goal_id: int, user_id: int) -> bool:
        savings_goal = db.query(SavingsGoal).filter(SavingsGoal.id == savings_goal_id, SavingsGoal.user_id == user_id).first()
        if not savings_goal:
            return False

        db.delete(savings_goal)
        db.commit()
        return True

    @staticmethod
    def get_current_amount(db: Session, savings_goal_id: int) -> Decimal:
        """Calculate the current amount saved for a savings goal from all transactions"""
        total = db.query(func.sum(SavingsTransaction.amount)).filter(
            SavingsTransaction.savings_goal_id == savings_goal_id
        ).scalar() or Decimal(0)
        return total

    @staticmethod
    def get_all_savings_goals_with_amounts(db: Session, user_id: int):
        """Get all savings goals with their current amounts calculated"""
        savings_goals = SavingsGoalCrud.get_all_savings_goals(db, user_id)

        result = []
        for goal in savings_goals:
            current_amount = SavingsGoalCrud.get_current_amount(db, goal.id)

            goal_dict = {
                "id": goal.id,
                "user_id": goal.user_id,
                "name": goal.name,
                "target_amount": goal.target_amount,
                "color": goal.color,
                "notes": goal.notes,
                "created_at": goal.created_at,
                "updated_at": goal.updated_at,
                "current_amount": float(current_amount),
            }
            result.append(goal_dict)

        return result
