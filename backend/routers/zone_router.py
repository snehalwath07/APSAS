from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import RiskZone, User, ActivityLog
from backend.schemas import RiskZoneResponse, RiskZoneBase
from backend.auth import get_current_user
from ml_models.risk_predictor import predict_risk

router = APIRouter(prefix="/zones", tags=["Risk Zones"])

@router.get("", response_model=List[RiskZoneResponse])
def get_zones(db: Session = Depends(get_db)):
    return db.query(RiskZone).all()

@router.get("/predict-risk")
def get_predicted_risk(lat: float, lng: float, weather: int = 0):
    """
    Predicts the safety score (0-100) and risk level of any coordinate point in the city.
    Uses trained Random Forest ML models with dynamic fallback.
    """
    prediction = predict_risk(lat=lat, lng=lng, weather=weather)
    return prediction

@router.post("", response_model=RiskZoneResponse, status_code=status.HTTP_201_CREATED)
def create_zone(
    zone_in: RiskZoneBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Only administrators can manage risk zones")
        
    db_zone = db.query(RiskZone).filter(RiskZone.name == zone_in.name).first()
    if db_zone:
        raise HTTPException(status_code=400, detail="Risk zone name already exists")
        
    new_zone = RiskZone(**zone_in.dict())
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)
    
    # Log action
    log = ActivityLog(user_id=current_user.id, action=f"create_zone_{new_zone.id}")
    db.add(log)
    db.commit()
    
    return new_zone

@router.put("/{id}", response_model=RiskZoneResponse)
def update_zone(
    id: int,
    zone_in: RiskZoneBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Only administrators can manage risk zones")
        
    zone = db.query(RiskZone).filter(RiskZone.id == id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Risk zone not found")
        
    # Check duplicate name if name changed
    if zone.name != zone_in.name:
        dup = db.query(RiskZone).filter(RiskZone.name == zone_in.name).first()
        if dup:
            raise HTTPException(status_code=400, detail="Risk zone name already exists")
            
    zone.name = zone_in.name
    zone.polygon_coords_json = zone_in.polygon_coords_json
    zone.risk_score = zone_in.risk_score
    zone.risk_level = zone_in.risk_level
    zone.active_incidents_count = zone_in.active_incidents_count
    
    db.add(zone)
    
    log = ActivityLog(user_id=current_user.id, action=f"update_zone_{id}")
    db.add(log)
    db.commit()
    db.refresh(zone)
    return zone

@router.delete("/{id}")
def delete_zone(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Only administrators can manage risk zones")
        
    zone = db.query(RiskZone).filter(RiskZone.id == id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Risk zone not found")
        
    db.delete(zone)
    
    log = ActivityLog(user_id=current_user.id, action=f"delete_zone_{id}")
    db.add(log)
    db.commit()
    return {"message": "Risk zone deleted successfully."}

