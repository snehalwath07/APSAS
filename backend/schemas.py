from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user: Any

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Optional[str] = "citizen"
    phone: Optional[str] = None
    status: Optional[str] = "active"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None

# Password Recovery Schemas
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str



# Response Team Schema
class ResponseTeamBase(BaseModel):
    name: str
    type: str
    status: str
    current_lat: float
    current_lng: float
    contact_phone: Optional[str] = None

class ResponseTeamResponse(ResponseTeamBase):
    id: int

    class Config:
        from_attributes = True

# Risk Zone Schema
class RiskZoneBase(BaseModel):
    name: str
    polygon_coords_json: str
    risk_score: float
    risk_level: str
    active_incidents_count: int

class RiskZoneResponse(RiskZoneBase):
    id: int
    update_time: datetime

    class Config:
        from_attributes = True

# Incident Schemas
class IncidentBase(BaseModel):
    type: str
    description: Optional[str] = None
    location_lat: float
    location_lng: float
    severity: str

class IncidentCreate(IncidentBase):
    pass

class IncidentResponse(IncidentBase):
    id: int
    zone_id: Optional[int] = None
    status: str
    media_url: Optional[str] = None
    audio_url: Optional[str] = None
    audio_transcript: Optional[str] = None
    ai_confidence: Optional[float] = None
    eta_minutes: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    citizen_id: Optional[int] = None
    operator_id: Optional[int] = None
    assigned_team_id: Optional[int] = None
    team: Optional[ResponseTeamResponse] = None
    zone: Optional[RiskZoneResponse] = None

    class Config:
        from_attributes = True

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    operator_id: Optional[int] = None
    assigned_team_id: Optional[int] = None
    eta_minutes: Optional[int] = None

# SOS Request Schemas
class SOSRequestCreate(BaseModel):
    location_lat: float
    location_lng: float

class SOSRequestResponse(BaseModel):
    id: int
    citizen_id: Optional[int] = None
    location_lat: float
    location_lng: float
    status: str
    assigned_team_id: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    team: Optional[ResponseTeamResponse] = None

    class Config:
        from_attributes = True

class SOSRequestUpdate(BaseModel):
    status: str
    assigned_team_id: Optional[int] = None

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    type: str
    created_at: datetime

    class Config:
        from_attributes = True

# Activity Log Schema
class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Analytics Chart Schemas
class TrendPoint(BaseModel):
    label: str
    reported: int
    resolved: int

class RiskDistributionPoint(BaseModel):
    name: str
    value: int

class ResponseTimePoint(BaseModel):
    label: str
    value: float

class CategoryPoint(BaseModel):
    subject: str
    A: int
    fullMark: int

class AnalyticsDashboardData(BaseModel):
    active_incidents: int
    resolved_cases: int
    avg_response_time: float
    critical_zones_count: int
    active_sos_count: int
    trends: List[TrendPoint]
    risk_distribution: List[RiskDistributionPoint]
    response_times: List[ResponseTimePoint]
    categories: List[CategoryPoint]

# Segregated Dashboard Analytics Schemas
class CitizenAnalyticsResponse(BaseModel):
    incidents_count: int
    sos_count: int
    recent_notifications: List[NotificationResponse]
    activity_logs: List[ActivityLogResponse]

class OperatorAnalyticsResponse(BaseModel):
    active_incidents: int
    active_sos: int
    available_teams: int
    resolved_today: int

class SystemMonitoringResponse(BaseModel):
    api_status: str
    db_status: str
    active_sessions: int

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    ip_address: Optional[str] = None
    created_at: datetime
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


