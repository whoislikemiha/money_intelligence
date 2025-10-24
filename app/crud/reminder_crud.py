from datetime import date
from sqlalchemy.orm import Session

from app.database.models.reminder import Reminder
from app.database.models.tag import Tag
from app.schemas.reminder import ReminderCreate, ReminderUpdate


class ReminderCrud:

    @staticmethod
    def create(db: Session, reminder_data: ReminderCreate):
        reminder_dict = reminder_data.model_dump(exclude={'tags'})
        db_reminder = Reminder(**reminder_dict)
        db.add(db_reminder)
        db.flush()  # Get the reminder ID before commit

        # Handle tags if provided
        if reminder_data.tags:
            tags = db.query(Tag).filter(Tag.id.in_(reminder_data.tags)).all()
            db_reminder.tags = tags

        db.commit()
        db.refresh(db_reminder)
        return db_reminder

    @staticmethod
    def get_all(db: Session, user_id: int):
        return db.query(Reminder).filter(Reminder.user_id == user_id).all()

    @staticmethod
    def get_by_id(db: Session, reminder_id: int, user_id: int):
        return db.query(Reminder).filter(
            Reminder.id == reminder_id,
            Reminder.user_id == user_id
        ).first()

    @staticmethod
    def get_due_reminders(db: Session, user_id: int, current_date: date = None):
        """Get all reminders that are due (not completed and reminder_date <= current_date)"""
        if current_date is None:
            current_date = date.today()

        return db.query(Reminder).filter(
            Reminder.user_id == user_id,
            Reminder.is_completed == False,
            Reminder.reminder_date <= current_date
        ).order_by(Reminder.reminder_date).all()

    @staticmethod
    def delete(db: Session, reminder_id: int, user_id: int):
        reminder = db.query(Reminder).filter(
            Reminder.id == reminder_id,
            Reminder.user_id == user_id
        ).first()
        if reminder:
            db.delete(reminder)
            db.commit()
        return reminder is not None

    @staticmethod
    def update(db: Session, reminder_id: int, user_id: int, reminder_update: ReminderUpdate):
        reminder = db.query(Reminder).filter(
            Reminder.id == reminder_id,
            Reminder.user_id == user_id
        ).first()
        if not reminder:
            return None

        update_data = reminder_update.model_dump(exclude_unset=True, exclude={'tags'})
        for field, value in update_data.items():
            setattr(reminder, field, value)

        # Handle tags if provided
        if reminder_update.tags is not None:
            tags = db.query(Tag).filter(Tag.id.in_(reminder_update.tags)).all()
            reminder.tags = tags

        db.commit()
        db.refresh(reminder)
        return reminder
