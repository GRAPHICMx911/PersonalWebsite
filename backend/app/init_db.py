import json
import logging
from pathlib import Path
from sqlalchemy.orm import Session
from backend.app.database import engine, SessionLocal, Base
from backend.app import models

logger = logging.getLogger("init_db")

def init_database_and_seed():
    """Ensure all database tables exist and seed initial data if empty."""
    # 1. Create tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created successfully.")

    # 2. Check if seeding is needed
    db: Session = SessionLocal()
    try:
        user_count = db.query(models.User).count()
        if user_count > 0:
            logger.info("Database already initialized and contains users. Skipping seed.")
            return

        seed_file = Path(__file__).resolve().parent / "initial_seed_data.json"
        if not seed_file.exists():
            logger.warning("No initial_seed_data.json found. Skipping auto-seed.")
            return

        logger.info("Fresh database detected. Seeding initial data...")
        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Admin user
        admin_data = data.get("admin_user")
        if admin_data:
            admin_user = models.User(
                username=admin_data["username"],
                email=admin_data["email"],
                hashed_password=admin_data["hashed_password"],
            )
            db.add(admin_user)
            db.flush()

        # Site Settings
        settings_data = data.get("site_settings")
        if settings_data:
            setting = models.SiteSetting(**settings_data)
            db.add(setting)

        # Social Links
        for soc in data.get("social_links", []):
            db.add(models.SocialLink(**soc))

        # Project Categories
        for pc in data.get("project_categories", []):
            db.add(models.ProjectCategory(**pc))

        # Skill Categories
        cat_map = {}
        for sc in data.get("skill_categories", []):
            cat_obj = models.SkillCategory(
                name=sc["name"],
                slug=sc["slug"],
                description=sc.get("description"),
                display_order=sc.get("display_order", 0),
            )
            db.add(cat_obj)
            db.flush()
            cat_map[sc["slug"]] = cat_obj.id

        # Skills
        for sk in data.get("skills", []):
            cat_slug = sk.pop("category_slug", None)
            category_id = cat_map.get(cat_slug)
            db.add(models.Skill(category_id=category_id, **sk))

        # CV Documents
        for cv in data.get("cv_documents", []):
            db.add(models.CVDocument(**cv))

        # Certifications
        for cert in data.get("certifications", []):
            db.add(models.Certification(**cert))

        # Education
        for edu in data.get("education", []):
            db.add(models.Education(**edu))

        db.commit()
        logger.info("Initial data successfully seeded into database!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during auto-seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_database_and_seed()
