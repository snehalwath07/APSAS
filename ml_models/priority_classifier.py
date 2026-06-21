import os
import pickle
from typing import Dict, Any

# Simple rule-based classifier that acts as a fallback or booster
CRITICAL_KEYWORDS = {"weapon", "gun", "shoot", "kill", "dying", "heart attack", "unconscious", "explosion", "murder", "hostage", "terror", "riot"}
HIGH_KEYWORDS = {"fire", "smoke", "accident", "bleeding", "broken", "robbery", "theft", "assault", "flood", "leak", "kidnap", "women safety", "sos"}
MEDIUM_KEYWORDS = {"scam", "vandalism", "noise", "suspicious", "missing", "property", "lost"}

def classify_priority(incident_type: str, description: str) -> Dict[str, Any]:
    text = f"{incident_type} {description}".lower()
    
    # 1. Rule-based heuristic checking
    severity = "medium"  # default
    confidence = 0.60
    
    if any(kw in text for kw in CRITICAL_KEYWORDS):
        severity = "critical"
        confidence = 0.90
    elif any(kw in text for kw in HIGH_KEYWORDS) or incident_type.lower() in ["fire", "medical emergency", "women safety"]:
        severity = "high"
        confidence = 0.85
    elif any(kw in text for kw in MEDIUM_KEYWORDS):
        severity = "medium"
        confidence = 0.75
    else:
        # Fallback to low severity for minor reports
        severity = "low"
        confidence = 0.65
        
    return {
        "severity": severity,
        "confidence": confidence,
        "method": "rule_heuristic"
    }
