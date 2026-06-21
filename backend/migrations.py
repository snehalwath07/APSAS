import sqlite3
import os
from backend.config import settings

def run_migrations():
    # Get DB path from Settings
    # settings.DATABASE_URL is like sqlite:///./apsas.db or sqlite:///apsas.db
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    
    print(f"Running database migrations on {db_path}...")
    
    if not os.path.exists(db_path):
        print("Database file does not exist yet. It will be created by SQLAlchemy.")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check existing columns in users table
        cursor.execute("PRAGMA table_info(users);")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Add status column if not exists
        if "status" not in columns:
            print("Adding 'status' column to 'users' table...")
            cursor.execute("ALTER TABLE users ADD COLUMN status VARCHAR DEFAULT 'active' NOT NULL;")
            
        # Add reset_token column if not exists
        if "reset_token" not in columns:
            print("Adding 'reset_token' column to 'users' table...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token VARCHAR;")
            
        # Add reset_token_expires column if not exists
        if "reset_token_expires" not in columns:
            print("Adding 'reset_token_expires' column to 'users' table...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME;")
            
        # Verify if an admin user exists. If not, let's create a default admin so we can test admin functionality!
        cursor.execute("SELECT id FROM users WHERE role = 'admin';")
        admin = cursor.fetchone()
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        if not admin:
            print("No admin user found. Creating a default administrator account (admin@apsas.city / admin123)...")
            admin_pw_hash = pwd_context.hash("admin123")
            cursor.execute("""
            INSERT INTO users (email, password_hash, full_name, role, phone, status, created_at)
            VALUES ('admin@apsas.city', ?, 'System Administrator', 'admin', '+15550199', 'active', CURRENT_TIMESTAMP);
            """, (admin_pw_hash,))
            
        # Verify if an operator user exists. If not, let's create a default operator so we can test operator functionality!
        cursor.execute("SELECT id FROM users WHERE role = 'operator';")
        operator = cursor.fetchone()
        if not operator:
            print("No operator user found. Creating a default operator account (operator@apsas.city / operator123)...")
            operator_pw_hash = pwd_context.hash("operator123")
            cursor.execute("""
            INSERT INTO users (email, password_hash, full_name, role, phone, status, created_at)
            VALUES ('operator@apsas.city', ?, 'Emergency Operator', 'operator', '+15550188', 'active', CURRENT_TIMESTAMP);
            """, (operator_pw_hash,))
            
        conn.commit()
        print("Database migrations completed successfully.")
    except Exception as e:
        conn.rollback()
        print(f"Error running database migrations: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_migrations()
