from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Notification, User
from backend.schemas import NotificationResponse
from backend.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all in-app notifications for the authenticated user, sorted by date descending.
    """
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()

@router.put("/{id}/read", response_model=NotificationResponse)
def mark_notification_read(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a specific notification as read.
    """
    notif = db.query(Notification).filter(Notification.id == id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

@router.post("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all unread notifications for the active user as read.
    """
    db.query(Notification).filter(
        Notification.user_id == current_user.id, 
        Notification.is_read == False
    ).update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read."}

@router.delete("/{id}")
def delete_notification(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a specific notification.
    """
    notif = db.query(Notification).filter(Notification.id == id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted successfully."}

@router.delete("")
def clear_all_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete all notifications for the active user.
    """
    db.query(Notification).filter(Notification.user_id == current_user.id).delete(synchronize_session=False)
    db.commit()
    return {"message": "All notifications cleared."}
