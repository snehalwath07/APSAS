from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import ResponseTeam, User, ActivityLog
from backend.schemas import ResponseTeamResponse, ResponseTeamBase
from backend.auth import get_current_user, RoleChecker
from backend.websocket_manager import manager

router = APIRouter(prefix="/teams", tags=["Response Teams"])

@router.get("", response_model=List[ResponseTeamResponse])
def get_teams(type: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ResponseTeam)
    if type:
        query = query.filter(ResponseTeam.type == type)
    if status:
        query = query.filter(ResponseTeam.status == status)
    return query.all()

@router.post("", response_model=ResponseTeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_in: ResponseTeamBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Restriction
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Only administrators can register teams")
        
    db_team = db.query(ResponseTeam).filter(ResponseTeam.name == team_in.name).first()
    if db_team:
        raise HTTPException(status_code=400, detail="Team name already exists")
        
    new_team = ResponseTeam(**team_in.dict())
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    
    # Log action
    log = ActivityLog(user_id=current_user.id, action=f"create_team_{new_team.id}")
    db.add(log)
    db.commit()
    
    return new_team

@router.put("/{id}/location", response_model=ResponseTeamResponse)
async def update_team_location(
    id: int,
    lat: float,
    lng: float,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(ResponseTeam).filter(ResponseTeam.id == id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Response team not found")
        
    team.current_lat = lat
    team.current_lng = lng
    if status:
        team.status = status
        
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # Broadcast live location track
    await manager.broadcast({
        "event": "team_location_updated",
        "team": {
            "id": team.id,
            "name": team.name,
            "type": team.type,
            "status": team.status,
            "current_lat": team.current_lat,
            "current_lng": team.current_lng
        }
    })
    
    return team
