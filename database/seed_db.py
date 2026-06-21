import sys
import os
from datetime import datetime, timedelta

# Add root folder to sys.path to allow running seed_db.py from shell directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import SessionLocal, engine, Base
from backend.models import User, RiskZone, ResponseTeam, Incident, SOSRequest, Notification
from backend.auth import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    
    # 1. Clear existing database
    db.query(Notification).delete()
    db.query(Incident).delete()
    db.query(SOSRequest).delete()
    db.query(ResponseTeam).delete()
    db.query(RiskZone).delete()
    db.query(User).delete()
    db.commit()
    
    print("Database cleared. Seeding initial public safety records...")

    # 2. Seed Users
    users_data = [
        {"email": "admin@apsas.city", "pwd": "password123", "name": "Rhea Kapoor", "role": "admin", "phone": "+919876543210"},
        {"email": "operator@apsas.city", "pwd": "password123", "name": "Marcus Vale", "role": "operator", "phone": "+918765432109"},
        {"email": "citizen@apsas.city", "pwd": "password123", "name": "Aanya Singh", "role": "citizen", "phone": "+917654321098"}
    ]
    
    seeded_users = {}
    for u in users_data:
        user = User(
            email=u["email"],
            password_hash=get_password_hash(u["pwd"]),
            full_name=u["name"],
            role=u["role"],
            phone=u["phone"]
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        seeded_users[u["role"]] = user
        
    print(f"Users registered: Admin, Operator, Citizen.")

    # 3. Seed Risk Zones (GeoJSON strings with lat/lng polygons around Sector coordinates)
    # Coordinate center: 24.580, 78.910 (Sector 7 / Central Area)
    zones_data = [
        {
            "name": "Sector 4 - Downtown Market",
            "polygon": "[[24.582, 78.905], [24.592, 78.905], [24.592, 78.918], [24.582, 78.918]]",
            "score": 82.5,
            "level": "critical"
        },
        {
            "name": "Sector 9 - Riverside Tech Park",
            "polygon": "[[24.585, 78.918], [24.595, 78.918], [24.595, 78.932], [24.585, 78.932]]",
            "score": 68.0,
            "level": "high"
        },
        {
            "name": "Sector 7 - Central Plaza",
            "polygon": "[[24.572, 78.905], [24.582, 78.905], [24.582, 78.918], [24.572, 78.918]]",
            "score": 45.0,
            "level": "medium"
        },
        {
            "name": "Sector 1 - Old Canal District",
            "polygon": "[[24.562, 78.895], [24.572, 78.895], [24.572, 78.908], [24.562, 78.908]]",
            "score": 20.0,
            "level": "low"
        }
    ]
    
    seeded_zones = []
    for z in zones_data:
        zone = RiskZone(
            name=z["name"],
            polygon_coords_json=z["polygon"],
            risk_score=z["score"],
            risk_level=z["level"],
            active_incidents_count=0
        )
        db.add(zone)
        db.commit()
        db.refresh(zone)
        seeded_zones.append(zone)
        
    print(f"Risk Zones seeded: {len(seeded_zones)} sectors.")

    # 4. Seed Response Teams
    teams_data = [
        {"name": "Team Alpha-2", "type": "medical", "status": "ready", "lat": 24.582, "lng": 78.921, "phone": "+915550011"},
        {"name": "Team Bravo-1", "type": "fire", "status": "busy", "lat": 24.591, "lng": 78.932, "phone": "+915550022"},
        {"name": "Team Echo-3", "type": "rescue", "status": "ready", "lat": 24.575, "lng": 78.910, "phone": "+915550033"},
        {"name": "Team Delta-5", "type": "security", "status": "ready", "lat": 24.568, "lng": 78.895, "phone": "+915550044"}
    ]
    
    seeded_teams = {}
    for t in teams_data:
        team = ResponseTeam(
            name=t["name"],
            type=t["type"],
            status=t["status"],
            current_lat=t["lat"],
            current_lng=t["lng"],
            contact_phone=t["phone"]
        )
        db.add(team)
        db.commit()
        db.refresh(team)
        seeded_teams[t["name"]] = team
        
    print(f"Response Teams registered: {len(seeded_teams)} teams.")

    # 5. Seed Incidents
    # Adjust zones and counts
    incidents_data = [
        {
            "type": "Fire",
            "desc": "Warehouse structure fire on Market St. Smoke rising rapidly.",
            "lat": 24.585,
            "lng": 78.912,
            "status": "in_progress",
            "severity": "high",
            "zone": seeded_zones[0],
            "team": seeded_teams["Team Bravo-1"],
            "operator": seeded_users["operator"],
            "citizen": seeded_users["citizen"],
            "delta_hours": -2
        },
        {
            "type": "Medical Emergency",
            "desc": "An elderly citizen has collapsed near the tech park entrance, experiencing severe respiratory issues.",
            "lat": 24.590,
            "lng": 78.925,
            "status": "dispatched",
            "severity": "critical",
            "zone": seeded_zones[1],
            "team": seeded_teams["Team Alpha-2"],
            "operator": seeded_users["operator"],
            "citizen": seeded_users["citizen"],
            "delta_hours": -1
        },
        {
            "type": "Disaster",
            "desc": "Water levels in Sector 1 canal rising above safety limits. Minor flooding reported on Service Road A.",
            "lat": 24.565,
            "lng": 78.902,
            "status": "assigned",
            "severity": "medium",
            "zone": seeded_zones[3],
            "team": None,
            "operator": seeded_users["operator"],
            "citizen": seeded_users["citizen"],
            "delta_hours": -4
        },
        {
            "type": "Accident",
            "desc": "Road hazard due to oil spill and minor car collision in Sector 6.",
            "lat": 24.560,
            "lng": 78.885,
            "status": "resolved",
            "severity": "low",
            "zone": seeded_zones[3],
            "team": None,
            "operator": None,
            "citizen": None,
            "delta_hours": -24
        },
        {
            "type": "Crime",
            "desc": "Suspicious activity / attempted shop burglary reported in Central Plaza shopping avenue.",
            "lat": 24.575,
            "lng": 78.912,
            "status": "resolved",
            "severity": "medium",
            "zone": seeded_zones[2],
            "team": seeded_teams["Team Delta-5"],
            "operator": seeded_users["operator"],
            "citizen": None,
            "delta_hours": -12
        }
    ]
    
    for inc in incidents_data:
        created_time = datetime.utcnow() + timedelta(hours=inc["delta_hours"])
        resolved_time = created_time + timedelta(minutes=45) if inc["status"] == "resolved" else None
        
        incident = Incident(
            type=inc["type"],
            description=inc["desc"],
            location_lat=inc["lat"],
            location_lng=inc["lng"],
            status=inc["status"],
            severity=inc["severity"],
            zone_id=inc["zone"].id if inc["zone"] else None,
            assigned_team_id=inc["team"].id if inc["team"] else None,
            operator_id=inc["operator"].id if inc["operator"] else None,
            citizen_id=inc["citizen"].id if inc["citizen"] else None,
            created_at=created_time,
            resolved_at=resolved_time,
            eta_minutes=6 if inc["status"] in ["assigned", "dispatched", "in_progress"] else None
        )
        db.add(incident)
        db.commit()
        
        # Increment active incident counter on RiskZone
        if inc["status"] != "resolved" and inc["zone"]:
            zone = inc["zone"]
            zone.active_incidents_count += 1
            db.add(zone)
            db.commit()
            
    print("Sample Incidents seeded and linked to Risk Zones.")

    # 6. Seed SOS Requests
    sos_data = [
        {
            "citizen": seeded_users["citizen"],
            "lat": 24.590,
            "lng": 78.925,
            "status": "pending",
            "team": seeded_teams["Team Echo-3"]
        },
        {
            "citizen": None,
            "lat": 24.584,
            "lng": 78.911,
            "status": "pending",
            "team": None
        },
        {
            "citizen": seeded_users["citizen"],
            "lat": 24.575,
            "lng": 78.912,
            "status": "resolved",
            "team": seeded_teams["Team Delta-5"]
        }
    ]
    
    for s in sos_data:
        sos = SOSRequest(
            citizen_id=s["citizen"].id if s["citizen"] else None,
            location_lat=s["lat"],
            location_lng=s["lng"],
            status=s["status"],
            assigned_team_id=s["team"].id if s["team"] else None,
            created_at=datetime.utcnow() - timedelta(minutes=15),
            resolved_at=datetime.utcnow() if s["status"] == "resolved" else None
        )
        db.add(sos)
        
    db.commit()
    print("SOS Distress alerts seeded.")

    # 7. Seed Notifications
    notifs = [
        {"user": seeded_users["admin"], "title": "System Alert", "msg": "APSAS online. 4 response teams connected."},
        {"user": seeded_users["operator"], "title": "New Incident", "msg": "Fire reported in Sector 4 Downtown Market."}
    ]
    for n in notifs:
        notif = Notification(
            user_id=n["user"].id,
            title=n["title"],
            message=n["msg"],
            is_read=False,
            type="system"
        )
        db.add(notif)
    db.commit()
    
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
