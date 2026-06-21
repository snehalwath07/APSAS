import unittest
import sys
import os
import json

# Add root folder to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.auth import get_password_hash, verify_password, create_access_token, get_current_user
from backend.models import User, Incident, SOSRequest, Notification, ActivityLog

client = TestClient(app)

class TestAPSASSystemFeatures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        # Clean up database test users
        cls.db.query(User).filter(User.email.in_(["test_citizen@apsas.city", "test_operator@apsas.city", "test_admin@apsas.city"])).delete()
        cls.db.commit()

        # Hash password dynamically
        hashed_password = get_password_hash("password123")

        # Create Citizens, Operator, Admin
        cls.citizen = User(
            email="test_citizen@apsas.city",
            password_hash=hashed_password,
            full_name="Test Citizen",
            role="citizen",
            phone="+12345678",
            status="active"
        )
        cls.operator = User(
            email="test_operator@apsas.city",
            password_hash=hashed_password,
            full_name="Test Operator",
            role="operator",
            phone="+23456789",
            status="active"
        )
        cls.admin = User(
            email="test_admin@apsas.city",
            password_hash=hashed_password,
            full_name="Test Admin",
            role="admin",
            phone="+34567890",
            status="active"
        )
        cls.db.add_all([cls.citizen, cls.operator, cls.admin])
        cls.db.commit()
        
        # Authenticate all
        citizen_login = client.post("/api/v1/auth/login/citizen", json={"email": "test_citizen@apsas.city", "password": "password123", "full_name": "test", "role": "citizen"})
        cls.citizen_token = citizen_login.json()["access_token"]
        cls.citizen_id = citizen_login.json()["user"]["id"]

        operator_login = client.post("/api/v1/auth/login/operator", json={"email": "test_operator@apsas.city", "password": "password123", "full_name": "test", "role": "operator"})
        cls.operator_token = operator_login.json()["access_token"]

        admin_login = client.post("/api/v1/auth/login/admin", json={"email": "test_admin@apsas.city", "password": "password123", "full_name": "test", "role": "admin"})
        cls.admin_token = admin_login.json()["access_token"]

    @classmethod
    def tearDownClass(cls):
        # Clean up database test records
        cls.db.query(Notification).filter(Notification.user_id.in_([cls.citizen_id])).delete()
        cls.db.query(User).filter(User.email.in_(["test_citizen@apsas.city", "test_operator@apsas.city", "test_admin@apsas.city"])).delete()
        cls.db.commit()
        cls.db.close()

    def test_01_create_notification(self):
        # Create an incident to trigger notifications
        headers = {"Authorization": f"Bearer {self.__class__.citizen_token}"}
        data = {
            "type": "Fire",
            "description": "Kitchen fire on 4th floor",
            "location_lat": 24.580,
            "location_lng": 78.910
        }
        response = client.post("/api/v1/incidents", data=data, headers=headers)
        self.assertEqual(response.status_code, 201)
        incident_id = response.json()["id"]

        # Check if notifications were created for citizen
        response_notif = client.get("/api/v1/notifications", headers=headers)
        self.assertEqual(response_notif.status_code, 200)
        notifs = response_notif.json()
        self.assertTrue(len(notifs) > 0)
        self.assertIn("Incident Submitted Successfully", [n["title"] for n in notifs])

    def test_02_notification_read_and_delete(self):
        headers = {"Authorization": f"Bearer {self.__class__.citizen_token}"}
        response_notif = client.get("/api/v1/notifications", headers=headers)
        notifs = response_notif.json()
        self.assertTrue(len(notifs) > 0)
        notif_id = notifs[0]["id"]

        # Mark read
        res_read = client.put(f"/api/v1/notifications/{notif_id}/read", headers=headers)
        self.assertEqual(res_read.status_code, 200)
        self.assertTrue(res_read.json()["is_read"])

        # Delete notification
        res_del = client.delete(f"/api/v1/notifications/{notif_id}", headers=headers)
        self.assertEqual(res_del.status_code, 200)

    def test_03_role_specific_analytics(self):
        # Citizen analytics
        headers_cit = {"Authorization": f"Bearer {self.__class__.citizen_token}"}
        res_cit = client.get("/api/v1/analytics/citizen", headers=headers_cit)
        self.assertEqual(res_cit.status_code, 200)
        self.assertIn("incidents_count", res_cit.json())

        # Operator analytics
        headers_op = {"Authorization": f"Bearer {self.__class__.operator_token}"}
        res_op = client.get("/api/v1/analytics/operator", headers=headers_op)
        self.assertEqual(res_op.status_code, 200)
        self.assertIn("active_incidents", res_op.json())

        # System/Admin analytics
        headers_adm = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        res_sys = client.get("/api/v1/analytics/system", headers=headers_adm)
        self.assertEqual(res_sys.status_code, 200)
        self.assertIn("db_status", res_sys.json())

    def test_04_email_logging(self):
        # Check if email notifications were logged to file
        log_path = "c:\\Users\\HP\\OneDrive\\Desktop\\APSAS\\email_notifications.log"
        self.assertTrue(os.path.exists(log_path))
        with open(log_path, "r", encoding="utf-8") as f:
            content = f.read()
            self.assertIn("test_citizen@apsas.city", content)

if __name__ == "__main__":
    unittest.main()
