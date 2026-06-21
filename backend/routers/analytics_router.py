from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Incident, SOSRequest, RiskZone, ResponseTeam, User, Notification, ActivityLog
from backend.schemas import (
    AnalyticsDashboardData, TrendPoint, RiskDistributionPoint, ResponseTimePoint, CategoryPoint,
    CitizenAnalyticsResponse, OperatorAnalyticsResponse, SystemMonitoringResponse, NotificationResponse, ActivityLogResponse
)
from datetime import datetime, timedelta
from backend.auth import get_current_user
from backend.websocket_manager import manager


router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=AnalyticsDashboardData)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    # 1. Active Incidents (status != resolved)
    active_incidents = db.query(Incident).filter(Incident.status != "resolved").count()
    
    # 2. Resolved Cases (status == resolved)
    resolved_cases = db.query(Incident).filter(Incident.status == "resolved").count()
    
    # 3. Active SOS Count (status != resolved)
    active_sos = db.query(SOSRequest).filter(SOSRequest.status != "resolved").count()
    
    # 4. Critical Zones (risk_level == critical)
    critical_zones = db.query(RiskZone).filter(RiskZone.risk_level == "critical").count()
    
    # 5. Average response time (simulated using database incidents or fallback if none resolved)
    # We query resolved incidents with valid assigned_team_id and calculate avg of eta_minutes
    avg_response_query = db.query(func.avg(Incident.eta_minutes)).filter(Incident.status == "resolved").scalar()
    avg_response_time = float(avg_response_query) if avg_response_query else 6.5
    
    # 6. Trends: last 6 days/weeks (mock dates based on database records)
    # Group incidents by date for the last 6 days
    trends = []
    for i in range(5, -1, -1):
        target_date = (datetime.utcnow() - timedelta(days=i)).date()
        label = target_date.strftime("%b %d")
        
        reported = db.query(Incident).filter(func.date(Incident.created_at) == target_date).count()
        resolved = db.query(Incident).filter(func.date(Incident.resolved_at) == target_date).count()
        
        trends.append(TrendPoint(label=label, reported=reported, resolved=resolved))
        
    # 7. Risk Distribution
    # Query zones and count by risk level
    levels = ["critical", "high", "medium", "low"]
    risk_dist = []
    for lvl in levels:
        count = db.query(RiskZone).filter(RiskZone.risk_level == lvl).count()
        risk_dist.append(RiskDistributionPoint(name=lvl.capitalize(), value=count))
        
    # 8. Response Time by Zone
    # Query average response times per zone
    zones = db.query(RiskZone).all()
    response_times = []
    for z in zones[:8]:  # Limit to 8 zones for graph cleanliness
        avg_z = db.query(func.avg(Incident.eta_minutes)).filter(Incident.zone_id == z.id, Incident.status == "resolved").scalar()
        val = float(avg_z) if avg_z else round(float(z.risk_score * 0.1) + 2.0, 1)
        response_times.append(ResponseTimePoint(label=z.name, value=val))
        
    # 9. Categories: incidents by type (Fire, Medical, Security, etc.)
    categories_list = ["Fire", "Medical Emergency", "Crime", "Disaster", "Accident", "Women Safety"]
    categories = []
    for cat in categories_list:
        count = db.query(Incident).filter(Incident.type == cat).count()
        categories.append(CategoryPoint(subject=cat, A=count, fullMark=max(10, count + 5)))
        
    return {
        "active_incidents": active_incidents,
        "resolved_cases": resolved_cases,
        "avg_response_time": avg_response_time,
        "critical_zones_count": critical_zones,
        "active_sos_count": active_sos,
        "trends": trends,
        "risk_distribution": risk_dist,
        "response_times": response_times,
        "categories": categories
    }

@router.get("/citizen", response_model=CitizenAnalyticsResponse)
def get_citizen_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch dashboard summary statistics tailored for a Citizen.
    """
    incidents_count = db.query(Incident).filter(Incident.citizen_id == current_user.id).count()
    sos_count = db.query(SOSRequest).filter(SOSRequest.citizen_id == current_user.id).count()
    
    recent_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(5).all()
    
    activity_logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.created_at.desc()).limit(5).all()
    
    return {
        "incidents_count": incidents_count,
        "sos_count": sos_count,
        "recent_notifications": recent_notifications,
        "activity_logs": activity_logs
    }

@router.get("/operator", response_model=OperatorAnalyticsResponse)
def get_operator_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch dashboard summary statistics tailored for an Operator.
    """
    if current_user.role not in ["operator", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied. Operator role required.")
        
    active_incidents = db.query(Incident).filter(Incident.status != "resolved").count()
    active_sos = db.query(SOSRequest).filter(SOSRequest.status != "resolved").count()
    available_teams = db.query(ResponseTeam).filter(ResponseTeam.status == "ready").count()
    
    # Calculate incidents resolved today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    resolved_today = db.query(Incident).filter(
        Incident.status == "resolved",
        Incident.resolved_at >= today_start
    ).count()
    
    return {
        "active_incidents": active_incidents,
        "active_sos": active_sos,
        "available_teams": available_teams,
        "resolved_today": resolved_today
    }

@router.get("/system", response_model=SystemMonitoringResponse)
def get_system_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch system monitoring statistics tailored for an Admin.
    """
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
        
    # Check DB Connection
    try:
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
        
    active_sessions = len(manager.active_connections)
    
    return {
        "api_status": "online",
        "db_status": db_status,
        "active_sessions": active_sessions
    }

