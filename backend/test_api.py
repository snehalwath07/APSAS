import unittest
import sys
import os
import json

# Add root folder to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import User, Incident, SOSRequest

client = TestClient(app)

class TestAPSASApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # We clean the DB and seed default test user
        cls.db = SessionLocal()
        cls.db.query(User).filter(User.email == "test_user@apsas.city").delete()
        cls.db.commit()
        
    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_signup(self):
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "test_user@apsas.city",
                "password": "testpassword123",
                "full_name": "Test Runner User",
                "role": "citizen",
                "phone": "+15551234"
            }
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["email"], "test_user@apsas.city")

    def test_02_login(self):
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test_user@apsas.city",
                "password": "testpassword123",
                "full_name": "test", # Schema fields
                "role": "citizen"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["role"], "citizen")
        
        # Save token for subsequent tests
        self.__class__.token = data["access_token"]

    def test_03_get_profile(self):
        headers = {"Authorization": f"Bearer {self.__class__.token}"}
        response = client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["full_name"], "Test Runner User")

    def test_04_create_incident(self):
        headers = {"Authorization": f"Bearer {self.__class__.token}"}
        # Multipart form data
        data = {
            "type": "Accident",
            "description": "Minor fender bender on Main St.",
            "location_lat": 24.580,
            "location_lng": 78.910
        }
        response = client.post(
            "/api/v1/incidents",
            data=data,
            headers=headers
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["type"], "Accident")
        self.assertEqual(response.json()["severity"], "high") # Automated AI classification default
        self.__class__.incident_id = response.json()["id"]

    def test_05_create_sos(self):
        headers = {"Authorization": f"Bearer {self.__class__.token}"}
        response = client.post(
            "/api/v1/sos",
            json={"location_lat": 24.582, "location_lng": 78.912},
            headers=headers
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], "pending")

    def test_06_analytics_dashboard(self):
        headers = {"Authorization": f"Bearer {self.__class__.token}"}
        response = client.get("/api/v1/analytics/dashboard", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("active_incidents", data)
        self.assertIn("trends", data)

if __name__ == "__main__":
    unittest.main()
