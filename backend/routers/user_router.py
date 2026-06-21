from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, ActivityLog, Notification
from backend.schemas import UserResponse, AuditLogResponse
from backend.auth import get_current_user, RoleChecker
from backend.email_service import send_simulated_email


router = APIRouter(prefix="/users", tags=["User Management"])

# Helper dependencies
admin_required = RoleChecker(["admin"])

# ================= USER MANAGEMENT ENDPOINTS =================

@router.get("", response_model=List[UserResponse])
def get_all_users(
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return users

@router.put("/{id}/role", response_model=UserResponse)
def update_user_role(
    id: int,
    role: str,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    if role not in ["admin", "operator", "citizen"]:
        raise HTTPException(status_code=400, detail="Invalid role value")
        
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent demoting the last admin
    if user.id == current_user.id and role != "admin":
        other_admins = db.query(User).filter(User.role == "admin", User.id != current_user.id).count()
        if other_admins == 0:
            raise HTTPException(status_code=400, detail="Cannot demote the only system administrator.")
            
    old_role = user.role
    user.role = role
    db.add(user)
    
    # Log action
    log = ActivityLog(user_id=current_user.id, action=f"promote_user_{id}_to_{role}")
    db.add(log)
    
    # Create notifications and email alerts
    # Notify target user
    db.add(Notification(
        user_id=user.id,
        title="Account Role Updated",
        message=f"Your APSAS account role has been updated from {old_role.upper()} to {role.upper()}.",
        type="system"
    ))
    
    send_simulated_email(
        to_email=user.email,
        subject="APSAS Security Alert - Account Role Changed",
        body=f"Hello {user.full_name},\n\nAn administrator has changed your account role from {old_role.upper()} to {role.upper()}.\nPlease sign in again to access your updated dashboard."
    )
    
    # Notify admins
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        if admin.id != current_user.id:
            db.add(Notification(
                user_id=admin.id,
                title="User Role Changed",
                message=f"Admin {current_user.full_name} updated role of user {user.full_name} to {role.upper()}.",
                type="system"
            ))
            
        send_simulated_email(
            to_email=admin.email,
            subject="APSAS Admin Notification - User Role Promotion/Demotion",
            body=f"Hello Admin {admin.full_name},\n\nUser {user.full_name} ({user.email}) role has been changed:\n- Previous Role: {old_role.upper()}\n- New Role: {role.upper()}\n- Action By: {current_user.full_name}"
        )
        
    db.commit()
    db.refresh(user)
    return user

@router.put("/{id}/status", response_model=UserResponse)
def update_user_status(
    id: int,
    status: str,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    if status not in ["active", "suspended"]:
        raise HTTPException(status_code=400, detail="Invalid status value")
        
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent suspending self
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot suspend your own administrator account.")
        
    old_status = user.status
    user.status = status
    db.add(user)
    
    # Log action
    log = ActivityLog(user_id=current_user.id, action=f"change_status_user_{id}_to_{status}")
    db.add(log)
    
    # Notifications and email alerts
    # Notify target user
    if status == "active":
        db.add(Notification(
            user_id=user.id,
            title="Account Re-Activated",
            message="Your safety console access has been re-activated by system administration.",
            type="system"
        ))
        
    send_simulated_email(
        to_email=user.email,
        subject=f"APSAS Account Status - {status.upper()}",
        body=f"Hello {user.full_name},\n\nYour APSAS safety command center account status has been changed to: {status.upper()}.\n" + 
             ("If you believe this is an error, please contact system administration support." if status == "suspended" else "You can now log back in to access safety tools.")
    )
    
    # Notify admins
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        if admin.id != current_user.id:
            db.add(Notification(
                user_id=admin.id,
                title="User Status Changed",
                message=f"Admin {current_user.full_name} changed status of {user.email} to {status.upper()}.",
                type="system"
            ))
            
        send_simulated_email(
            to_email=admin.email,
            subject="APSAS Admin Notification - User Status Update",
            body=f"Hello Admin {admin.full_name},\n\nUser {user.full_name} ({user.email}) status has been updated:\n- Previous Status: {old_status.upper()}\n- New Status: {status.upper()}\n- Action By: {current_user.full_name}"
        )
        
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{id}")
def delete_user(
    id: int,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent deleting self
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrator account.")
        
    db.delete(user)
    
    # Log action
    log = ActivityLog(user_id=current_user.id, action=f"delete_user_{id}")
    db.add(log)
    
    db.commit()
    return {"message": "User deleted successfully."}

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Fetch all user activity logs, including user details (restricted to admin).
    """
    # Join ActivityLog with User
    logs = db.query(
        ActivityLog.id,
        ActivityLog.user_id,
        ActivityLog.action,
        ActivityLog.ip_address,
        ActivityLog.created_at,
        User.email.label("user_email"),
        User.full_name.label("user_name")
    ).outerjoin(User, ActivityLog.user_id == User.id).order_by(ActivityLog.created_at.desc()).all()
    
    return logs



