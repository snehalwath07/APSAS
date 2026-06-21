import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import pickle
from datetime import datetime
from typing import Dict, Any

MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")

def generate_synthetic_data(num_samples: int = 2000) -> pd.DataFrame:
    np.random.seed(42)
    # Generate coordinates representing different city sectors
    lats = np.random.uniform(24.50, 24.70, num_samples)
    lngs = np.random.uniform(78.80, 79.00, num_samples)
    
    # Hours (0-23) and Day of week (0-6)
    hours = np.random.randint(0, 24, num_samples)
    day_of_week = np.random.randint(0, 7, num_samples)
    
    # Weather (0: Clear, 1: Rain, 2: Storm, 3: Fog)
    weather = np.random.randint(0, 4, num_samples)
    
    # Density score calculation (a simulated function of coords and time)
    # Downtown areas (e.g. 24.58, 78.92) have higher incident density
    dist_to_center = np.sqrt((lats - 24.58)**2 + (lngs - 78.92)**2)
    base_score = 80 * np.exp(-dist_to_center / 0.05)
    
    # Night hours (22-04) increase risk, storm increases risk
    hour_effect = np.where((hours >= 22) | (hours <= 4), 15, 0)
    weather_effect = np.where(weather >= 2, 10, 0)
    
    risk_score = base_score + hour_effect + weather_effect + np.random.normal(0, 5, num_samples)
    risk_score = np.clip(risk_score, 0, 100)
    
    return pd.DataFrame({
        "lat": lats,
        "lng": lngs,
        "hour": hours,
        "day_of_week": day_of_week,
        "weather": weather,
        "risk_score": risk_score
    })

def train_risk_model():
    print("Generating synthetic safety training data...")
    df = generate_synthetic_data()
    X = df[["lat", "lng", "hour", "day_of_week", "weather"]]
    y = df["risk_score"]
    
    print("Training Random Forest Regressor risk model...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"Risk model saved successfully to {MODEL_PATH}")

def get_risk_level(score: float) -> str:
    if score < 25:
        return "low"
    elif score < 50:
        return "medium"
    elif score < 75:
        return "high"
    else:
        return "critical"

def predict_risk(lat: float, lng: float, hour: int = None, day_of_week: int = None, weather: int = 0) -> Dict[str, Any]:
    if hour is None:
        hour = datetime.now().hour
    if day_of_week is None:
        day_of_week = datetime.now().weekday()
        
    # Check if trained model exists
    if not os.path.exists(MODEL_PATH):
        # Fallback heuristic calculation if model not yet trained
        dist_to_center = np.sqrt((lat - 24.58)**2 + (lng - 78.92)**2)
        base_score = 75 * np.exp(-dist_to_center / 0.05)
        hour_effect = 15 if (hour >= 22 or hour <= 4) else 0
        weather_effect = 10 if weather >= 2 else 0
        score = float(np.clip(base_score + hour_effect + weather_effect, 0, 100))
        return {
            "risk_score": round(score, 1),
            "risk_level": get_risk_level(score),
            "method": "fallback_heuristic"
        }
        
    try:
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        features = np.array([[lat, lng, hour, day_of_week, weather]])
        score = float(model.predict(features)[0])
        return {
            "risk_score": round(score, 1),
            "risk_level": get_risk_level(score),
            "method": "ml_model"
        }
    except Exception as e:
        # Fallback on any pickle error
        return {
            "risk_score": 45.0,
            "risk_level": "medium",
            "method": f"error_fallback: {str(e)}"
        }

if __name__ == "__main__":
    train_risk_model()
