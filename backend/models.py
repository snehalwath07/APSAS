from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="citizen", nullable=False)  # admin, operator, citizen
    phone = Column(String, nullable=True)
    status = Column(String, default="active", nullable=False)  # active, suspended
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    incidents_reported = relationship("Incident", foreign_keys="Incident.citizen_id", back_populates="citizen")
    incidents_handled = relationship("Incident", foreign_keys="Incident.operator_id", back_populates="operator")
    sos_requests = relationship("SOSRequest", back_populates="citizen")
    notifications = relationship("Notification", back_populates="user")
    logs = relationship("ActivityLog", back_populates="user")


class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # Crime, Accident, Fire, Medical Emergency, Disaster, Women Safety, Missing Person
    description = Column(Text, nullable=True)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    zone_id = Column(Integer, ForeignKey("risk_zones.id"), nullable=True)
    status = Column(String, default="reported", nullable=False)  # reported, assigned, dispatched, in_progress, resolved
    severity = Column(String, default="medium", nullable=False)  # low, medium, high, critical
    media_url = Column(String, nullable=True)
    audio_url = Column(String, nullable=True)
    audio_transcript = Column(Text, nullable=True)
    ai_confidence = Column(Float, nullable=True)  # YOLOv8 or classification confidence
    eta_minutes = Column(Integer, nullable=True)  # ETA of response team
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_team_id = Column(Integer, ForeignKey("response_teams.id"), nullable=True)
    
    # Relationships
    citizen = relationship("User", foreign_keys=[citizen_id], back_populates="incidents_reported")
    operator = relationship("User", foreign_keys=[operator_id], back_populates="incidents_handled")
    team = relationship("ResponseTeam", back_populates="incidents")
    zone = relationship("RiskZone", back_populates="incidents")


class SOSRequest(Base):
    __tablename__ = "sos_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    status = Column(String, default="pending", nullable=False)  # pending, acknowledged, resolved
    assigned_team_id = Column(Integer, ForeignKey("response_teams.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    citizen = relationship("User", back_populates="sos_requests")
    team = relationship("ResponseTeam", back_populates="sos_requests")


class RiskZone(Base):
    __tablename__ = "risk_zones"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    polygon_coords_json = Column(Text, nullable=False)  # GeoJSON string or list of coordinates
    risk_score = Column(Float, default=0.0)  # 0 to 100
    risk_level = Column(String, default="low")  # low, medium, high, critical
    active_incidents_count = Column(Integer, default=0)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    incidents = relationship("Incident", back_populates="zone")


class ResponseTeam(Base):
    __tablename__ = "response_teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, nullable=False)  # fire, medical, security, rescue
    status = Column(String, default="ready")  # ready, dispatched, busy
    current_lat = Column(Float, nullable=False)
    current_lng = Column(Float, nullable=False)
    contact_phone = Column(String, nullable=True)
    
    # Relationships
    incidents = relationship("Incident", back_populates="team")
    sos_requests = relationship("SOSRequest", back_populates="team")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    type = Column(String, default="system")  # sos, incident, system
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notifications")


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="logs")



