import os
import shutil
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Incident, User, ResponseTeam, RiskZone, Notification, ActivityLog
from backend.schemas import IncidentResponse, IncidentUpdate
from backend.auth import get_current_user, RoleChecker
from backend.websocket_manager import manager
from backend.config import settings
from backend.email_service import send_simulated_email


# Import local AI features
from ml_models.image_analyzer import analyze_image
from ml_models.voice_analyzer import analyze_voice
from ml_models.priority_classifier import classify_priority

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentResponse])
def get_incidents(status: Optional[str] = None, severity: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    return query.order_by(Incident.created_at.desc()).all()

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    type: str = Form(...),
    description: Optional[str] = Form(None),
    location_lat: float = Form(...),
    location_lng: float = Form(...),
    media: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    media_url = None
    audio_url = None
    audio_transcript = None
    ai_confidence = None
    detected_class = None
    
    # 1. Process Image Upload and AI Image Analysis
    if media:
        file_ext = os.path.splitext(media.filename)[1]
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"img_{timestamp}{file_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(media.file, buffer)
        media_url = f"/uploads/{filename}"
        
        # Run YOLOv8 image analysis
        try:
            analysis = analyze_image(file_path)
            detected_class = analysis.get("detected_class")
            ai_confidence = analysis.get("confidence")
        except Exception as e:
            print(f"Error analyzing image: {e}")
            
    # 2. Process Audio Upload and AI Voice Analysis
    if audio:
        file_ext = os.path.splitext(audio.filename)[1]
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"aud_{timestamp}{file_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        audio_url = f"/uploads/{filename}"
        
        # Run local voice speech-to-text and emergency clues extraction
        try:
            voice_analysis = analyze_voice(file_path)
            audio_transcript = voice_analysis.get("transcript")
            if not description:
                description = f"Voice Transcript: {audio_transcript}"
            else:
                description = f"{description} | Voice Transcript: {audio_transcript}"
        except Exception as e:
            print(f"Error analyzing audio: {e}")

    # 3. AI Incident Priority Engine
    # Run classifier on description text to assign severity
    severity_info = classify_priority(type, description or "")
    severity = severity_info.get("severity", "medium")
    
    # 4. Map Incident to Risk Zone
    # Check if there is an overlapping zone or closest zone
    closest_zone = db.query(RiskZone).first()  # Mock association with first zone for simplicity
    zone_id = closest_zone.id if closest_zone else None
    
    # Create incident record
    new_incident = Incident(
        type=type,
        description=description,
        location_lat=location_lat,
        location_lng=location_lng,
        status="reported",
        severity=severity,
        media_url=media_url,
        audio_url=audio_url,
        audio_transcript=audio_transcript,
        ai_confidence=ai_confidence,
        citizen_id=current_user.id if current_user.role == "citizen" else None,
        operator_id=current_user.id if current_user.role == "operator" else None,
        zone_id=zone_id
    )
    
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    
    # Update zone active incidents count
    if zone_id and closest_zone:
        closest_zone.active_incidents_count += 1
        db.add(closest_zone)
        db.commit()

    # Log action
    log = ActivityLog(user_id=current_user.id, action=f"create_incident_{new_incident.id}")
    db.add(log)
    db.commit()

    # Trigger Real-Time Notification & WebSocket Broadcast
    incident_data = {
        "event": "new_incident",
        "incident": {
            "id": new_incident.id,
            "type": new_incident.type,
            "description": new_incident.description,
            "location_lat": new_incident.location_lat,
            "location_lng": new_incident.location_lng,
            "status": new_incident.status,
            "severity": new_incident.severity,
            "media_url": new_incident.media_url,
            "created_at": new_incident.created_at.isoformat()
        }
    }
    await manager.broadcast(incident_data)
    
    # 1. Notify reporting Citizen (in-app and email)
    if current_user.role == "citizen":
        citizen_notif = Notification(
            user_id=current_user.id,
            title="Incident Submitted Successfully",
            message=f"Your report for a {type} (Case ID: INC-{new_incident.id}) has been submitted and is in queue.",
            type="incident"
        )
        db.add(citizen_notif)
        
        send_simulated_email(
            to_email=current_user.email,
            subject=f"Incident Report Submitted - INC-{new_incident.id}",
            body=f"Hello {current_user.full_name},\n\nYour incident report has been received and stored in our database.\n\nCase Details:\n- Incident ID: INC-{new_incident.id}\n- Category: {type}\n- Location: ({location_lat}, {location_lng})\n- Severity (AI Scored): {severity.upper()}\n- Status: SUBMITTED (in queue)\n\nOur dispatch operators have been alerted and will assign response teams shortly."
        )

    # 2. Notify all Operators & Admins
    operators = db.query(User).filter(User.role.in_(["operator", "admin"])).all()
    for op in operators:
        # In-app notification
        notif = Notification(
            user_id=op.id,
            title="New Incident Reported",
            message=f"A {type} has been reported at ({location_lat}, {location_lng}). Severity: {severity.upper()}.",
            type="incident"
        )
        db.add(notif)
        
        # Email alert for operators on high-priority alerts
        if severity in ["high", "critical"] and op.role == "operator":
            send_simulated_email(
                to_email=op.email,
                subject=f"APSAS HIGH PRIORITY ALERT - New Incident INC-{new_incident.id}",
                body=f"Hello Operator {op.full_name},\n\nA CRITICAL/HIGH severity incident has been reported:\n- Case ID: INC-{new_incident.id}\n- Category: {type}\n- Coordinates: ({location_lat}, {location_lng})\n- Details: {description or 'None'}\n\nPlease proceed to your dashboard immediately to assign a response team."
            )
            
    db.commit()

    return new_incident

@router.get("/{id}", response_model=IncidentResponse)
def get_incident(id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.put("/{id}", response_model=IncidentResponse)
async def update_incident(
    id: int,
    incident_update: IncidentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    # Operator/Admin restriction
    if current_user.role not in ["operator", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update incidents")
        
    old_status = incident.status
    
    # Update fields
    if incident_update.status:
        incident.status = incident_update.status
        if incident_update.status == "resolved" and old_status != "resolved":
            incident.resolved_at = datetime.utcnow()
            # Release response team and update zone count
            if incident.assigned_team_id:
                team = db.query(ResponseTeam).filter(ResponseTeam.id == incident.assigned_team_id).first()
                if team:
                    team.status = "ready"
                    db.add(team)
            if incident.zone_id:
                zone = db.query(RiskZone).filter(RiskZone.id == incident.zone_id).first()
                if zone and zone.active_incidents_count > 0:
                    zone.active_incidents_count -= 1
                    db.add(zone)
                    
    if incident_update.severity:
        incident.severity = incident_update.severity
    if incident_update.operator_id:
        incident.operator_id = incident_update.operator_id
    if incident_update.assigned_team_id:
        incident.assigned_team_id = incident_update.assigned_team_id
        # Set team status to busy/dispatched
        team = db.query(ResponseTeam).filter(ResponseTeam.id == incident_update.assigned_team_id).first()
        if team:
            team.status = "dispatched" if incident.status in ["reported", "assigned", "dispatched"] else "busy"
            db.add(team)
    if incident_update.eta_minutes is not None:
        incident.eta_minutes = incident_update.eta_minutes
        
    db.add(incident)
    
    # Log action
    log = ActivityLog(user_id=current_user.id, action=f"update_incident_{id}_status_{incident.status}")
    db.add(log)
    
    # Generate Notifications and Email alerts
    if incident.citizen_id:
        citizen = db.query(User).filter(User.id == incident.citizen_id).first()
        if citizen:
            if incident_update.status and incident_update.status != old_status:
                title = "Incident Resolved" if incident.status == "resolved" else "Incident Status Updated"
                message = f"Your incident report INC-{incident.id} is now RESOLVED." if incident.status == "resolved" else f"Incident INC-{incident.id} status changed from {old_status.upper()} to {incident.status.upper()}."
                
                db.add(Notification(
                    user_id=citizen.id,
                    title=title,
                    message=message,
                    type="incident"
                ))
                
                send_simulated_email(
                    to_email=citizen.email,
                    subject=f"Incident Status Update - INC-{incident.id}",
                    body=f"Hello {citizen.full_name},\n\nYour incident report INC-{incident.id} has been updated.\n- Status: {incident.status.upper()}\n- Assigned Team: {incident.assigned_team_id or 'None'}\n- ETA: {incident.eta_minutes or 'N/A'} minutes\n\nThank you for helping keep our city safe."
                )

            if incident_update.assigned_team_id:
                team = db.query(ResponseTeam).filter(ResponseTeam.id == incident_update.assigned_team_id).first()
                team_name = team.name if team else f"Team #{incident_update.assigned_team_id}"
                
                db.add(Notification(
                    user_id=citizen.id,
                    title="Response Team Assigned",
                    message=f"Emergency Dispatch: {team_name} has been dispatched to your location.",
                    type="incident"
                ))
                
                send_simulated_email(
                    to_email=citizen.email,
                    subject=f"Response Team Dispatched - INC-{incident.id}",
                    body=f"Hello {citizen.full_name},\n\nA response team has been assigned to your case INC-{incident.id}.\n- Team: {team_name}\n- Estimated Arrival Time: {incident.eta_minutes or '6.5'} minutes\n\nCoordinates: ({incident.location_lat}, {incident.location_lng}). Please stay safe."
                )

    if incident_update.assigned_team_id:
        send_simulated_email(
            to_email=current_user.email,
            subject=f"Incident Team Dispatched Confirmation - INC-{incident.id}",
            body=f"Hello Operator {current_user.full_name},\n\nYou have successfully dispatched Team #{incident_update.assigned_team_id} to Incident INC-{incident.id}."
        )

    db.commit()
    db.refresh(incident)
    
    # Broadcast status update
    broadcast_data = {
        "event": "incident_updated",
        "incident": {
            "id": incident.id,
            "status": incident.status,
            "severity": incident.severity,
            "assigned_team_id": incident.assigned_team_id,
            "eta_minutes": incident.eta_minutes
        }
    }
    await manager.broadcast(broadcast_data)
    
    return incident
