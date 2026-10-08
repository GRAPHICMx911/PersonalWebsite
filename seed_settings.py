#!/usr/bin/env python3
"""
Initialize site_settings table and singleton settings row.
"""
from backend.app.database import engine, SessionLocal, Base
from backend.app.models.setting import SiteSetting

def seed_settings():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        setting = db.query(SiteSetting).first()
        if not setting:
            print("Creating default site settings record...")
            setting = SiteSetting()
            db.add(setting)
            db.commit()
            print("Successfully initialized default site settings!")
        else:
            print(f"Site settings record already exists with ID: {setting.id}.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_settings()
