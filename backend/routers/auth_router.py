import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, ActivityLog, Notification
from backend.schemas import UserCreate, UserResponse, UserUpdate, Token, ForgotPasswordRequest, ResetPasswordRequest
from backend.auth import get_password_hash, verify_password, create_access_token, get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from backend.email_service import send_simulated_email


router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        password_hash=hashed_password,
        full_name=user_in.full_name,
       role="citizen",  # citizen, operator, admin
        phone=user_in.phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log action
    log = ActivityLog(user_id=new_user.id, action="user_signup")
    db.add(log)
    
    # 1. Send simulated registration email to citizen
    send_simulated_email(
        to_email=new_user.email,
        subject="Account Registration Confirmed - APSAS",
        body=f"Hello {new_user.full_name},\n\nYour account has been successfully registered on the Smart Public Alert & Safety System (APSAS).\nEmail: {new_user.email}\nPhone: {new_user.phone or 'N/A'}\nRole: Citizen\n\nYou can now report incidents and request emergency SOS assistance directly from your safety console."
    )
    
    # 2. Notify all admins about the new registration
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        # In-app notification
        admin_notif = Notification(
            user_id=admin.id,
            title="New User Registration",
            message=f"New user registered: {new_user.full_name} ({new_user.email}) as CITIZEN.",
            type="system"
        )
        db.add(admin_notif)
        
        # Email alert
        send_simulated_email(
            to_email=admin.email,
            subject="APSAS Admin Notification - New Citizen Registered",
            body=f"Hello Admin {admin.full_name},\n\nA new user has registered on the system:\nName: {new_user.full_name}\nEmail: {new_user.email}\nPhone: {new_user.phone or 'N/A'}\nStatus: Active"
        )
        
    db.commit()
    
    return new_user


@router.post("/login", response_model=Token)
def login(login_data: UserCreate, db: Session = Depends(get_db)):  # accepts email and password in JSON body
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support."
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    # Log action
    log = ActivityLog(user_id=user.id, action="user_login")
    db.add(log)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "status": user.status
        }
    }

@router.post("/login/citizen", response_model=Token)
def login_citizen(login_data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if user.role != "citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. Citizen privileges required."
        )
    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support."
        )
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    log = ActivityLog(user_id=user.id, action="citizen_login")
    db.add(log)
    db.commit()
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "status": user.status
        }
    }

@router.post("/login/operator", response_model=Token)
def login_operator(login_data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if user.role != "operator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. Operator privileges required."
        )
    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support."
        )
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    log = ActivityLog(user_id=user.id, action="operator_login")
    db.add(log)
    db.commit()
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "status": user.status
        }
    }

@router.post("/login/admin", response_model=Token)
def login_admin(login_data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. Administrator privileges required."
        )
    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support."
        )
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    log = ActivityLog(user_id=user.id, action="admin_login")
    db.add(log)
    db.commit()
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "status": user.status
        }
    }

@router.post("/login/form", response_model=Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support."
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    # Log action
    log = ActivityLog(user_id=user.id, action="user_login_form")
    db.add(log)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "status": user.status
        }
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(user_update: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.password is not None:
        current_user.password_hash = get_password_hash(user_update.password)
        
    db.add(current_user)
    
    # Log action
    log = ActivityLog(user_id=current_user.id, action="profile_update")
    db.add(log)
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    response_msg = {"message": "If the email is registered, a password reset link has been sent."}
    
    if not user:
        return response_msg
        
    if user.status == "suspended":
        return response_msg

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    
    db.add(user)
    db.commit()
    
    # Write to console
    reset_url = f"http://localhost:5173/?screen=reset-password&token={token}"
    print(f"\n======================================================\n")
    print(f"PASSWORD RESET REQUESTED FOR: {user.email}")
    print(f"RESET LINK: {reset_url}")
    print(f"\n======================================================\n")
    
    # Send simulated email
    send_simulated_email(
        to_email=user.email,
        subject="Password Reset Request - APSAS",
        body=f"Hello {user.full_name},\n\nA password reset request was received for your APSAS account. Click the link below or copy it to your browser to change your password:\n\n{reset_url}\n\nThis recovery link is valid for 1 hour. If you did not request this, please ignore this message."
    )
    
    return {
        "message": "If the email is registered, a password reset link has been sent.",
        "debug_url": reset_url
    }


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == request.token).first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
        
    if len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
        
    user.password_hash = get_password_hash(request.password)
    user.reset_token = None
    user.reset_token_expires = None
    
    db.add(user)
    
    # Send simulated confirmation email
    send_simulated_email(
        to_email=user.email,
        subject="Password Successfully Changed - APSAS",
        body=f"Hello {user.full_name},\n\nThis is confirmation that the security password for your APSAS account ({user.email}) has been successfully updated.\nIf you did not authorize this change, please contact system administration immediately."
    )
    
    db.commit()
    
    return {"message": "Password reset successful. You can now log in with your new password."}
