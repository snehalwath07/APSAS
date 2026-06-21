import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "APSAS 2.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkeychangeinprod123456!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./apsas.db")
    
    # File Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    
    # Real-time WebSocket settings
    WS_BROADCAST_INTERVAL_SEC: float = 1.0
    
    # Notification Placeholders
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "ACmockedaccountid")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "mockedtoken")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "+15555555555")
    
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "ops@apsas.city")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "mockedpassword")

    class Config:
        case_sensitive = True

settings = Settings()
