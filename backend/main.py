import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import settings
from backend.database import engine, Base
from backend.websocket_manager import manager
from backend.routers import auth_router, incident_router, sos_router, team_router, zone_router, analytics_router, pdf_router, user_router, notification_router
from ml_models.chatbot import generate_chat_response
from pydantic import BaseModel
from typing import Optional

from backend.migrations import run_migrations

# Run database migrations/upgrades
run_migrations()

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="APSAS 2.0 - AI Powered Smart Public Alert & Safety System Backend",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists and mount static uploads route
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Dynamic rule engine chatbot endpoint
class ChatMessage(BaseModel):
    message: str
    role: Optional[str] = "citizen"

@app.post(f"{settings.API_V1_STR}/chat")
def chatbot_chat(chat_in: ChatMessage):
    response = generate_chat_response(chat_in.message, chat_in.role)
    return response

# Register routers
app.include_router(auth_router.router, prefix=settings.API_V1_STR)
app.include_router(incident_router.router, prefix=settings.API_V1_STR)
app.include_router(sos_router.router, prefix=settings.API_V1_STR)
app.include_router(team_router.router, prefix=settings.API_V1_STR)
app.include_router(zone_router.router, prefix=settings.API_V1_STR)
app.include_router(analytics_router.router, prefix=settings.API_V1_STR)
app.include_router(pdf_router.router, prefix=settings.API_V1_STR)
app.include_router(user_router.router, prefix=settings.API_V1_STR)
app.include_router(notification_router.router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

# Real-Time WebSocket endpoint
@app.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket, user_id: int = None):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # We can receive coordinates or keepalive heartbeats
            data = await websocket.receive_json()
            # If citizen sends a live tracking ping, broadcast it
            if data.get("type") == "citizen_ping":
                await manager.broadcast({
                    "event": "citizen_location_updated",
                    "citizen": {
                        "user_id": data.get("user_id"),
                        "full_name": data.get("full_name"),
                        "lat": data.get("lat"),
                        "lng": data.get("lng")
                    }
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception:
        manager.disconnect(websocket, user_id)
