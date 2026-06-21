import os
from datetime import datetime

EMAIL_LOG_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "email_notifications.log"))

def send_simulated_email(to_email: str, subject: str, body: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # 1. Print to console for quick developer feedback
    print("\n" + "="*80)
    print(f"[{timestamp}] APSAS MAIL ENGINE SENDING:")
    print(f"TO:      {to_email}")
    print(f"SUBJECT: {subject}")
    print("-"*80)
    print(body)
    print("="*80 + "\n")
    
    # 2. Append to persistent log file
    try:
        with open(EMAIL_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] TO: {to_email} | SUBJECT: {subject}\n")
            f.write(f"{body}\n")
            f.write("="*80 + "\n\n")
    except Exception as e:
        print(f"Failed to write to email log file: {e}")
