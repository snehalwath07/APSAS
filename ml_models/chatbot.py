import re
from typing import Dict, Any

# FAQ responses grouped by Role
CITIZEN_FAQS = [
    (r"how to report|create a report|file an incident", 
     "To report an incident, go to the 'Report Incident' page in your sidebar. Select the category (Fire, Crime, Medical, etc.), type in the description, locate your position via coordinates, upload photo/video evidence if any, and submit. An operator will receive it instantly and dispatch a response team."),
    
    (r"sos|emergency|distress", 
     "If you are in immediate danger, go to the 'SOS Center' tab and click the red '🆘 SOS' button. This automatically transmits your GPS coordinates to our 24/7 dispatcher, acknowledging your alert and routing the closest response team to your location."),
    
    (r"fire|smoke", 
     "In case of Fire: 1. Evacuate immediately. 2. Do NOT use elevators. 3. Cover your face with a wet cloth to avoid smoke. 4. Stay low. Once safe, submit a Fire report here to notify response teams."),
    
    (r"first aid|medical emergency|bleeding", 
     "For Medical Emergencies: 1. Call for medical services. 2. Apply pressure to wounds if bleeding. 3. Do not move injured persons unless they are in immediate danger. 4. Initiate CPR if certified and breathing has stopped."),
    
    (r"safety score|zones|alerts", 
     "Review your 'Safety Alerts' page for local advisories. You can also monitor safety alerts in nearby areas to check for weather warnings, road closures, or active disaster alerts.")
]

OPERATOR_FAQS = [
    (r"how to dispatch|assign team|response team", 
     "To dispatch a response team: 1. Go to the 'Dispatch Center' or the 'SOS Monitoring Center'. 2. Locate the reported emergency in the queue. 3. Select an available team (Alpha, Bravo, Charlie) from the team dropdown. 4. Update the status to 'Assigned' and specify the estimated time of arrival (ETA)."),
    
    (r"incident status|workflow", 
     "Incidents follow a strict life-cycle workflow: Submitted ➔ Assigned ➔ In Progress ➔ Resolved. Once the team is dispatched, update the status to 'In Progress'. When the emergency is secured, click 'Resolve' to clear the incident and free up the assigned response team."),
    
    (r"active teams|locations", 
     "Check the 'Response Teams' tab to view ready vs busy teams and their contact numbers. Their live tracking positions can also be monitored on the 'Zone Map'."),
    
    (r"map legend|markers", 
     "The Zone Map plots: 1. Red Markers for reported incidents. 2. Pulsing Emergency Warning indicators for active SOS distress signals. 3. Team indicators for dispatch vehicle GPS coordinates. 4. Polygons showing colored risk sectors.")
]

ADMIN_FAQS = [
    (r"user management|promote|suspend|demote", 
     "Under 'User Management', you can search for registered users. Use the options to Promote users (Citizen ➔ Operator/Admin), Demote them, Suspend accounts to block dashboard access immediately, or Delete them completely. Active admins cannot be suspended or deleted by themselves."),
    
    (r"zone configuration|create zone|edit zone", 
     "In 'Zone Management', you can view existing city sectors. You can create a new zone by providing a GeoJSON array of polygon coordinates, naming the sector, and assigning an initial safety score and risk level (Critical, High, Medium, Low)."),
    
    (r"monitoring|api|database|websocket", 
     "Check 'System Monitoring' for real-time diagnostics: 1. API status. 2. Database connectivity. 3. Active WebSocket sessions showing how many users are currently online and connected to live feeds."),
    
    (r"audit log|user activity|login history", 
     "Go to the 'Audit Logs' tab to review administrative actions, login timestamps, and changes to user roles or status. Every action is registered with a database-bound ActivityLog model.")
]

def generate_chat_response(message: str, role: str = "citizen") -> Dict[str, Any]:
    text = message.lower().strip()
    
    # Select FAQ database based on role
    role_faqs = CITIZEN_FAQS
    role_name = "Citizen"
    if role == "operator":
        role_faqs = OPERATOR_FAQS
        role_name = "Emergency Operator"
    elif role == "admin":
        role_faqs = ADMIN_FAQS
        role_name = "System Administrator"
        
    for pattern, response in role_faqs:
        if re.search(pattern, text):
            return {
                "reply": f"[{role_name} Assistance] {response}",
                "api_ready": False,
                "source": "local_faq_engine"
            }
            
    # Default fallback guides based on role
    if role == "admin":
        default_reply = (
            "Welcome, System Administrator. I can assist you with administrative questions:\n"
            "- Promoting, demoting, or suspending user accounts\n"
            "- Creating, updating, or deleting risk zones\n"
            "- Checking API, database connectivity, and WebSocket session statistics\n"
            "- Reviewing administrative audit logs\n\n"
            "What administrative action can I guide you with?"
        )
    elif role == "operator":
        default_reply = (
            "Welcome, Emergency Dispatcher. I can assist you with operational instructions:\n"
            "- Dispatching ready response teams to reported incidents or SOS coordinates\n"
            "- Moving incidents through the lifecycle (Submitted ➔ Assigned ➔ In Progress ➔ Resolved)\n"
            "- Monitoring active rescue locations on the Zone Map\n\n"
            "How can I help you coordinate rescue teams today?"
        )
    else:
        default_reply = (
            "Welcome to APSAS. I am your Safety Assistant. I can guide you on:\n"
            "- Submitting incident reports or sending SOS distress broadcasts\n"
            "- Guidelines for fire evacuations and first-aid emergencies\n"
            "- Viewing active safety alerts and local safety scores\n\n"
            "How can I assist you with your safety today?"
        )
        
    return {
        "reply": default_reply,
        "api_ready": False,
        "source": "local_faq_engine"
    }
