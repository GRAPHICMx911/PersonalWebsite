import json
import logging
from datetime import datetime, timezone
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

    seed_file = Path(__file__).resolve().parent / "initial_seed_data.json"
    if not seed_file.exists():
        logger.warning("No initial_seed_data.json found. Skipping auto-seed.")
        return

    with open(seed_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    db: Session = SessionLocal()
    try:
        # Admin user
        admin_data = data.get("admin_user")
        if admin_data and db.query(models.User).count() == 0:
            admin_user = models.User(
                username=admin_data["username"],
                email=admin_data["email"],
                hashed_password=admin_data["hashed_password"],
            )
            db.add(admin_user)
            db.flush()
            logger.info("Admin user seeded.")

        # Site Settings
        settings_data = data.get("site_settings")
        if settings_data and db.query(models.SiteSetting).count() == 0:
            setting = models.SiteSetting(**settings_data)
            db.add(setting)
            logger.info("Site settings seeded.")

        # Social Links
        if db.query(models.SocialLink).count() == 0:
            for soc in data.get("social_links", []):
                db.add(models.SocialLink(**soc))
            logger.info("Social links seeded.")

        # Project Categories
        if db.query(models.ProjectCategory).count() == 0:
            for pc in data.get("project_categories", []):
                db.add(models.ProjectCategory(**pc))
            db.flush()
            logger.info("Project categories seeded.")

        # Skill Categories
        cat_map = {}
        if db.query(models.SkillCategory).count() == 0:
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
            logger.info("Skill categories seeded.")
        else:
            for c in db.query(models.SkillCategory).all():
                cat_map[c.slug] = c.id

        # Skills
        if db.query(models.Skill).count() == 0:
            for sk in data.get("skills", []):
                cat_slug = sk.pop("category_slug", None)
                category_id = cat_map.get(cat_slug)
                db.add(models.Skill(category_id=category_id, **sk))
            logger.info("Skills seeded.")

        # CV Documents
        if db.query(models.CVDocument).count() == 0:
            for cv in data.get("cv_documents", []):
                db.add(models.CVDocument(**cv))
            logger.info("CV documents seeded.")

        # Certifications
        if db.query(models.Certification).count() == 0:
            for cert in data.get("certifications", []):
                db.add(models.Certification(**cert))
            logger.info("Certifications seeded.")

        # Education
        if db.query(models.Education).count() == 0:
            for edu in data.get("education", []):
                db.add(models.Education(**edu))
            logger.info("Education seeded.")

        # Projects
        if db.query(models.Project).count() == 0:
            for p in data.get("projects", []):
                db.add(
                    models.Project(
                        title=p["title"],
                        slug=p["slug"],
                        short_description=p.get("description") or p.get("short_description"),
                        description=p.get("content") or p.get("description"),
                        category_id=p.get("category_id", 1),
                        technologies=p.get("technologies"),
                        project_url=p.get("demo_url") or p.get("project_url"),
                        github_url=p.get("repo_url") or p.get("github_url"),
                        image_url=p.get("image_url"),
                        is_featured=p.get("featured", False) or p.get("is_featured", False),
                        is_published=p.get("is_published", True),
                        display_order=p.get("display_order", 0),
                    )
                )
            logger.info("Projects seeded.")

        # Career Experience
        if db.query(models.Experience).count() == 0:
            for exp in data.get("experience", []):
                db.add(
                    models.Experience(
                        company=exp["company"],
                        position=exp.get("role_title") or exp.get("position", "Engineer"),
                        employment_type=exp.get("employment_type", "Full-time"),
                        location=exp.get("location"),
                        start_date=exp.get("start_date", "2023"),
                        end_date=exp.get("end_date"),
                        is_current=exp.get("is_current", False),
                        description=exp.get("description"),
                        technologies=exp.get("skills_used") or exp.get("technologies"),
                        display_order=exp.get("display_order", 0),
                        is_active=True,
                    )
                )
            logger.info("Experience seeded.")

        # Graphic Design Portfolio
        if db.query(models.DesignItem).count() == 0:
            for d in data.get("design_items", []):
                db.add(
                    models.DesignItem(
                        title=d["title"],
                        category=d.get("category", "Graphic Design"),
                        client=d.get("client"),
                        year=d.get("year", "2024"),
                        image_url=d.get("image_url", "uploads/projects/sample-ui.png"),
                        thumbnail_url=d.get("thumbnail_url") or d.get("image_url"),
                        tools_used=d.get("tools_used"),
                        description=d.get("description"),
                        aspect_ratio=d.get("aspect_ratio", "16:9"),
                        display_order=d.get("display_order", 0),
                        is_featured=d.get("is_featured", True),
                        is_active=True,
                    )
                )
            logger.info("Design items seeded.")

        # UX/UI Case Studies
        if db.query(models.UXUICaseStudy).count() == 0:
            for u in data.get("ux_ui_case_studies", []):
                db.add(
                    models.UXUICaseStudy(
                        title=u["title"],
                        subtitle=u.get("subtitle"),
                        category=u.get("category", "Mobile & Fintech"),
                        client=u.get("client"),
                        role=u.get("role"),
                        duration=u.get("timeline") or u.get("duration"),
                        tools_used=u.get("tools_used"),
                        cover_image_url=u.get("cover_image_url", "uploads/projects/sample-ui.png"),
                        preview_image_url=u.get("preview_image_url") or u.get("cover_image_url"),
                        problem_statement=u.get("problem_statement"),
                        solution_overview=u.get("solution_summary") or u.get("solution_overview"),
                        design_process=u.get("overview") or u.get("design_process"),
                        key_results=u.get("key_results"),
                        figma_url=u.get("prototype_url") or u.get("figma_url"),
                        live_prototype_url=u.get("behance_url") or u.get("live_prototype_url"),
                        display_order=u.get("display_order", 0),
                        is_featured=u.get("is_featured", True),
                        is_active=True,
                    )
                )
            logger.info("UX/UI case studies seeded.")

        # Technical Blog Posts
        if db.query(models.BlogPost).count() == 0:
            for b in data.get("blog_posts", []):
                read_time = 5
                if "reading_time" in b:
                    try:
                        read_time = int(str(b["reading_time"]).split()[0])
                    except (ValueError, IndexError):
                        read_time = 5
                db.add(
                    models.BlogPost(
                        title=b["title"],
                        slug=b["slug"],
                        subtitle=b.get("subtitle"),
                        category=b.get("category", "Software Engineering"),
                        excerpt=b.get("summary") or b.get("excerpt"),
                        content=b.get("content") or b.get("summary") or "Technical engineering article.",
                        cover_image_url=b.get("cover_image_url"),
                        author=b.get("author", "Design Lyricist"),
                        reading_time_minutes=read_time,
                        tags=b.get("tags"),
                        is_published=b.get("is_published", True),
                        is_featured=b.get("is_featured", True),
                        published_at=datetime.now(timezone.utc),
                    )
                )
            logger.info("Blog posts seeded.")

        db.commit()
        logger.info("Initial data successfully seeded into database!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during auto-seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_database_and_seed()
