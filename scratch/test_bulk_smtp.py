import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_EMAIL = os.getenv('SMTP_EMAIL', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')

recipient_emails = [
    'aidacamila@gmail.com',
    'editor@gmail.com',
    'felixalexandersilverio@gmail.com',
    'medrano@gmail.com',
    'medranoiham4@gmail.com'
]

subject = "Test Oportunidad"
html_content = "<html><body><h1>Test</h1></body></html>"

try:
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()
    server.login(SMTP_EMAIL, SMTP_PASSWORD)

    for email in recipient_emails:
        print(f"Sending to {email}...")
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"ParticipARD <{SMTP_EMAIL}>"
        msg["To"] = email
        
        part = MIMEText(html_content, "html")
        msg.attach(part)
        
        server.send_message(msg)
        print(f"Sent to {email} successfully.")
        
    server.quit()
    print(f"[EMAIL] Notificaciones enviadas exitosamente a {len(recipient_emails)} usuarios.")
except Exception as e:
    print(f"[EMAIL ERROR] Error enviando notificaciones: {e}")
