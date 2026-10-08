from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from backend.app.database import engine, SessionLocal, Base
from backend.app.models.message import ContactMessage

# Ensure database table exists
Base.metadata.create_all(bind=engine)
print("[OK] contact_messages table verified and created in PostgreSQL.")

db = SessionLocal()
now = datetime.now(timezone.utc)

sample_messages = [
    {
        "name": "Sarah Jenkins",
        "email": "s.jenkins@cyberfort-defense.io",
        "subject": "Enterprise Zero-Trust Infrastructure Assessment",
        "message": "Hello, we came across your technical article on AWS Zero-Trust Architecture and were deeply impressed by your microservices security approach. Our engineering organization is currently migrating 40+ microservices to Kubernetes and looking for a Senior Architect to lead our perimeter defense assessment. Are you available for a preliminary consultation call next Tuesday?",
        "ip_address": "198.51.100.42",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "is_read": False,
        "is_archived": False,
        "created_at": now - timedelta(hours=3, minutes=24),
    },
    {
        "name": "Marcus Vance",
        "email": "marcus.vance@vanguard-talent.com",
        "subject": "Principal Full-Stack & Cybersecurity Role | Hybrid / Remote",
        "message": "Hi there! I lead technical talent acquisition for Vanguard Cloud Partners. Your portfolio demonstrating end-to-end expertise across modern full-stack development, AWS cloud infrastructure, and penetration testing caught our leadership's attention. We have an executive opening with competitive equity and compensation. Would love to connect over email or LinkedIn to discuss details.",
        "ip_address": "203.0.113.88",
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
        "is_read": False,
        "is_archived": False,
        "created_at": now - timedelta(days=1, hours=5),
    },
    {
        "name": "Elena Rostova",
        "email": "elena@apexdesignstudio.co",
        "subject": "Design Systems Collaboration & Cognitive Ergonomics",
        "message": "Greetings, I reviewed your UX/UI Case Study for the SOC Threat Command Platform. The way you mapped analyst workflows and cut triage friction by 65% is remarkable. We are building an enterprise telemetry dashboard for industrial IoT and would like to engage you for design system consulting and interaction architecture review.",
        "ip_address": "192.0.2.14",
        "user_agent": "Mozilla/5.0 (X11; Linux x86_64) Firefox/115.0",
        "is_read": True,
        "is_archived": False,
        "created_at": now - timedelta(days=3, hours=8),
    }
]

for m in sample_messages:
    existing = db.scalars(select(ContactMessage).where(ContactMessage.email == m["email"])).first()
    if not existing:
        msg_obj = ContactMessage(**m)
        db.add(msg_obj)
        print(f"[OK] Added sample message from {m['name']}")
    else:
        print(f"[EXISTS] Message from {m['name']} already exists")

db.commit()
db.close()
print("[OK] Contact messages seeding complete!")
