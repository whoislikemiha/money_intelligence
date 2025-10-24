from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.database.database import get_db
from app.crud.reminder_crud import ReminderCrud
from app.schemas.reminder import Reminder, ReminderCreate, ReminderUpdate
from app.schemas.user import User


router = APIRouter()


@router.post("/", status_code=201)
async def create_reminder(
        reminder: ReminderCreate,
        db: Session = Depends(get_db)
):
    return ReminderCrud.create(db, reminder)


@router.get("/", response_model=list[Reminder])
async def get_reminders(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    return ReminderCrud.get_all(db, current_user.id)


@router.get("/due", response_model=list[Reminder])
async def get_due_reminders(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all reminders that are due (not completed and reminder_date <= today)"""
    return ReminderCrud.get_due_reminders(db, current_user.id)


@router.delete("/{reminder_id}", status_code=204)
async def delete_reminder(
        reminder_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
):
    success = ReminderCrud.delete(db, reminder_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")


@router.put("/{reminder_id}", response_model=Reminder)
async def update_reminder(
        reminder_id: int,
        reminder_update: ReminderUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
):
    reminder = ReminderCrud.update(db, reminder_id, current_user.id, reminder_update)
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    return reminder
