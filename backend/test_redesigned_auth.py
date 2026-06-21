import unittest
import sys
import os
from datetime import datetime

# Add root folder to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import User

client = TestClient(app)

class TestRedesignedAuth(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        # Clean up test accounts
        cls.db.query(User).filter(User.email.in_([
            "test_citizen@apsas.city", 
            "test_operator@apsas.city", 
            "test_admin@apsas.city",
            "suspended_citizen@apsas.city"
        ])).delete()
        cls.db.commit()

        # Seed users for testing
        from backend.auth import get_password_hash
        pw_hash = get_password_hash("password123")

        # 1. Citizen
        cls.citizen = User(
            email="test_citizen@apsas.city",
            password_hash=pw_hash,
            full_name="Test Citizen",
            role="citizen",
            phone="+15551111",
            status="active"
        )
        # 2. Operator
        cls.operator = User(
            email="test_operator@apsas.city",
            password_hash=pw_hash,
            full_name="Test Operator",
            role="operator",
            phone="+15552222",
            status="active"
        )
        # 3. Admin
        cls.admin = User(
            email="test_admin@apsas.city",
            password_hash=pw_hash,
            full_name="Test Admin",
            role="admin",
            phone="+15553333",
            status="active"
        )
        # 4. Suspended Citizen
        cls.suspended = User(
            email="suspended_citizen@apsas.city",
            password_hash=pw_hash,
            full_name="Suspended Citizen",
            role="citizen",
            phone="+15554444",
            status="suspended"
        )

        cls.db.add_all([cls.citizen, cls.operator, cls.admin, cls.suspended])
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_signup_forces_citizen_role(self):
        # A signup payload attempting to escalate privilege to admin
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "signup_escalated@apsas.city",
                "password": "password123",
                "full_name": "Privilege Escalation Attempt",
                "role": "admin", # Backend MUST ignore this
                "phone": "+15556666"
            }
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["role"], "citizen") # Forced to citizen

        # Cleanup created user
        self.db.query(User).filter(User.email == "signup_escalated@apsas.city").delete()
        self.db.commit()

    def test_02_role_specific_logins(self):
        # Check citizen login portal
        # Success
        response = client.post(
            "/api/v1/auth/login/citizen",
            json={"email": "test_citizen@apsas.city", "password": "password123", "full_name": "test"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["role"], "citizen")

        # Failure (Admin trying to log in via Citizen login)
        response = client.post(
            "/api/v1/auth/login/citizen",
            json={"email": "test_admin@apsas.city", "password": "password123", "full_name": "test"}
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("citizen privileges required", response.json()["detail"].lower())

        # Check operator login portal
        # Success
        response = client.post(
            "/api/v1/auth/login/operator",
            json={"email": "test_operator@apsas.city", "password": "password123", "full_name": "test"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["role"], "operator")

        # Failure (Citizen trying to log in via Operator login)
        response = client.post(
            "/api/v1/auth/login/operator",
            json={"email": "test_citizen@apsas.city", "password": "password123", "full_name": "test"}
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("operator privileges required", response.json()["detail"].lower())

        # Check admin login portal
        # Success
        response = client.post(
            "/api/v1/auth/login/admin",
            json={"email": "test_admin@apsas.city", "password": "password123", "full_name": "test"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["role"], "admin")
        admin_token = response.json()["access_token"]
        self.__class__.admin_token = admin_token

        # Failure (Operator trying to log in via Admin login)
        response = client.post(
            "/api/v1/auth/login/admin",
            json={"email": "test_operator@apsas.city", "password": "password123", "full_name": "test"}
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("administrator privileges required", response.json()["detail"].lower())

    def test_03_suspended_account_blocks_login(self):
        # Attempt login on suspended citizen account
        response = client.post(
            "/api/v1/auth/login/citizen",
            json={"email": "suspended_citizen@apsas.city", "password": "password123", "full_name": "test"}
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("suspended", response.json()["detail"].lower())

    def test_04_admin_user_management(self):
        headers_admin = {"Authorization": f"Bearer {self.__class__.admin_token}"}

        # 1. Fetch user to get its ID
        citizen_user = self.db.query(User).filter(User.email == "test_citizen@apsas.city").first()
        self.assertIsNotNone(citizen_user)
        citizen_id = citizen_user.id

        # 2. Promote Citizen -> Operator
        response = client.put(f"/api/v1/users/{citizen_id}/role?role=operator", headers=headers_admin)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["role"], "operator")

        # 3. Demote Operator -> Citizen
        response = client.put(f"/api/v1/users/{citizen_id}/role?role=citizen", headers=headers_admin)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["role"], "citizen")

        # 4. Suspend User
        response = client.put(f"/api/v1/users/{citizen_id}/status?status=suspended", headers=headers_admin)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "suspended")

        # 5. Activate User
        response = client.put(f"/api/v1/users/{citizen_id}/status?status=active", headers=headers_admin)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "active")

        # 6. Delete User
        response = client.delete(f"/api/v1/users/{citizen_id}", headers=headers_admin)
        self.assertEqual(response.status_code, 200)

        # Verify deletion in DB
        db_user = self.db.query(User).filter(User.id == citizen_id).first()
        self.assertIsNone(db_user)

if __name__ == "__main__":
    unittest.main()
