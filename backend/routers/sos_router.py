from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import SOSRequest, User, ResponseTeam, Notification, ActivityLog
from backend.schemas import SOSRequestResponse, SOSRequestCreate, SOSRequestUpdate
from backend.auth import get_current_user
from backend.websocket_manager import manager
from backend.email_service import send_simulated_email


router = APIRouter(prefix="/sos", tags=["SOS Emergency"])

@router.get("", response_model=List[SOSRequestResponse])
def get_sos_requests(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(SOSRequest)
    if status:
        query = query.filter(SOSRequest.status == status)
    return query.order_by(SOSRequest.created_at.desc()).all()

@router.post("", response_model=SOSRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_sos(
    sos_in: SOSRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find closest response team (simple distance calculation)
    # Filter teams of type 'rescue' or 'security' that are 'ready'
    teams = db.query(ResponseTeam).filter(ResponseTeam.status == "ready").all()
    assigned_team_id = None
    
    if teams:
        # Simple Euclidean distance search
        closest_team = min(
            teams, 
            key=lambda t: (t.current_lat - sos_in.location_lat)**2 + (t.current_lng - sos_in.location_lng)**2
        )
        assigned_team_id = closest_team.id
        closest_team.status = "dispatched"
        db.add(closest_team)
        
    new_sos = SOSRequest(
        citizen_id=current_user.id if current_user.role == "citizen" else None,
        location_lat=sos_in.location_lat,
        location_lng=sos_in.location_lng,
        status="pending",
        assigned_team_id=assigned_team_id
    )
    db.add(new_sos)
    db.commit()
    db.refresh(new_sos)
    
    # Log action
    log = ActivityLog(user_id=current_user.id, action=f"trigger_sos_{new_sos.id}")
    db.add(log)
    
    # 1. Notify the reporting Citizen
    if current_user.role == "citizen":
        citizen_notif = Notification(
            user_id=current_user.id,
            title="SOS Distress Signal Broadcasted",
            message="Your emergency SOS alert has been received. Response teams are being coordinated to your location.",
            type="sos"
        )
        db.add(citizen_notif)
        
        send_simulated_email(
            to_email=current_user.email,
            subject="SOS DISTRESS SIGNAL RECEIVED - APSAS EMERGENCY",
            body=f"Hello {current_user.full_name},\n\nWe have received your SOS distress broadcast at {new_sos.created_at.strftime('%Y-%m-%d %H:%M:%S')}.\n- SOS ID: SOS-{new_sos.id}\n- Coordinates: ({new_sos.location_lat}, {new_sos.location_lng})\n\nOur operators have acknowledged the alarm and dispatched a safety response team to your location. Please stay calm, remain where you are if safe, and await instructions."
        )

    # 2. Real-Time Broadcast
    sos_data = {
        "event": "new_sos",
        "sos": {
            "id": new_sos.id,
            "citizen_name": current_user.full_name,
            "location_lat": new_sos.location_lat,
            "location_lng": new_sos.location_lng,
            "status": new_sos.status,
            "assigned_team_id": new_sos.assigned_team_id,
            "created_at": new_sos.created_at.isoformat()
        }
    }
    await manager.broadcast(sos_data)
    
    # 3. Notify all Operators & Admins
    operators = db.query(User).filter(User.role.in_(["operator", "admin"])).all()
    for op in operators:
        # In-app notification
        notif = Notification(
            user_id=op.id,
            title="CRITICAL: SOS Distress Signal",
            message=f"SOS triggered by {current_user.full_name} at ({new_sos.location_lat}, {new_sos.location_lng})!",
            type="sos"
        )
        db.add(notif)
        
        # Email alerts
        if op.role == "operator":
            send_simulated_email(
                to_email=op.email,
                subject=f"🆘 APSAS EMERGENCY: CRITICAL SOS REQUEST SOS-{new_sos.id}",
                body=f"Hello Operator {op.full_name},\n\nDistress alarm triggered:\n- User: {current_user.full_name}\n- Email: {current_user.email}\n- Coordinates: ({new_sos.location_lat}, {new_sos.location_lng})\n- Time: {new_sos.created_at.isoformat()}\n\nPlease verify live feed coordinates on the Operations Map and allocate dispatch teams."
            )
        elif op.role == "admin":
            send_simulated_email(
                to_email=op.email,
                subject=f"APSAS System Notification - Critical SOS Distress Event",
                body=f"Hello Admin {op.full_name},\n\nA citizen has triggered a critical SOS alert:\n- Citizen Name: {current_user.full_name}\n- Coords: ({new_sos.location_lat}, {new_sos.location_lng})\n- Status: PENDING DISPATCH"
            )
            
    db.commit()
    
    return new_sos

@router.put("/{id}", response_model=SOSRequestResponse)
async def update_sos(
    id: int,
    sos_update: SOSRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sos = db.query(SOSRequest).filter(SOSRequest.id == id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS request not found")
        
    if current_user.role not in ["operator", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to manage SOS requests")
        
    old_status = sos.status
    
    if sos_update.status:
        sos.status = sos_update.status
        if sos_update.status == "resolved" and old_status != "resolved":
            sos.resolved_at = datetime.utcnow()
            # Free up response team
            if sos.assigned_team_id:
                team = db.query(ResponseTeam).filter(ResponseTeam.id == sos.assigned_team_id).first()
                if team:
                    team.status = "ready"
                    db.add(team)
                    
    if sos_update.assigned_team_id:
        # Free previous team if any
        if sos.assigned_team_id:
            old_team = db.query(ResponseTeam).filter(ResponseTeam.id == sos.assigned_team_id).first()
            if old_team:
                old_team.status = "ready"
                db.add(old_team)
        sos.assigned_team_id = sos_update.assigned_team_id
        new_team = db.query(ResponseTeam).filter(ResponseTeam.id == sos_update.assigned_team_id).first()
        if new_team:
            new_team.status = "dispatched"
            db.add(new_team)
            
    db.add(sos)
    
    # Log action
    log = ActivityLog(user_id=current_user.id, action=f"update_sos_{id}_status_{sos.status}")
    db.add(log)
    
    # Generate Notifications and Email alerts
    if sos.citizen_id:
        citizen = db.query(User).filter(User.id == sos.citizen_id).first()
        if citizen:
            if sos_update.status and sos_update.status != old_status:
                title = "SOS Emergency Resolved" if sos.status == "resolved" else "SOS Acknowledged"
                message = f"Your emergency SOS alarm SOS-{sos.id} has been marked as RESOLVED." if sos.status == "resolved" else f"Dispatchers have acknowledged your SOS alarm SOS-{sos.id} and routed help."
                
                db.add(Notification(
                    user_id=citizen.id,
                    title=title,
                    message=message,
                    type="sos"
                ))
                
                send_simulated_email(
                    to_email=citizen.email,
                    subject=f"SOS Distress Update - SOS-{sos.id}",
                    body=f"Hello {citizen.full_name},\n\nYour emergency distress alarm has been updated:\n- Status: {sos.status.upper()}\n- Dispatch Team ID: {sos.assigned_team_id or 'None'}\n\nOur operators are monitoring your situation closely. Please stay safe."
                )

            if sos_update.assigned_team_id:
                team = db.query(ResponseTeam).filter(ResponseTeam.id == sos_update.assigned_team_id).first()
                team_name = team.name if team else f"Team #{sos_update.assigned_team_id}"
                
                db.add(Notification(
                    user_id=citizen.id,
                    title="SOS Rescue Dispatched",
                    message=f"Rescue team {team_name} is actively responding to your coordinates.",
                    type="sos"
                ))
                
                send_simulated_email(
                    to_email=citizen.email,
                    subject=f"Rescue Team Dispatched - SOS-{sos.id}",
                    body=f"Hello {citizen.full_name},\n\nEmergency dispatch is confirmed for case SOS-{sos.id}.\n- Dispatched Unit: {team_name}\n- Coords: ({sos.location_lat}, {sos.location_lng})\n\nHelp is on the way. Please stay calm."
                )

    if sos_update.assigned_team_id:
        send_simulated_email(
            to_email=current_user.email,
            subject=f"SOS Rescue Dispatched Confirmation - SOS-{sos.id}",
            body=f"Hello Operator {current_user.full_name},\n\nYou have successfully dispatched Team #{sos_update.assigned_team_id} to SOS Emergency SOS-{sos.id}."
        )

    db.commit()
    db.refresh(sos)
    
    # Broadcast updates
    await manager.broadcast({
        "event": "sos_updated",
        "sos": {
            "id": sos.id,
            "status": sos.status,
            "assigned_team_id": sos.assigned_team_id
        }
    })
    
    return sos
