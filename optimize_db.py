#!/usr/bin/env python3
"""
=============================================================
PRODUCTION DATABASE OPTIMIZATION & INDEX PROVISIONING
=============================================================
Ensures high-throughput indexing across query hotspots:
- blog_posts (is_published, published_at, category)
- contact_messages (is_read, created_at)
- projects (is_published, is_featured, display_order)
- design_items (is_active, is_featured, display_order, category)
- ux_ui_case_studies (is_active, is_featured, display_order, category)
=============================================================
"""

from sqlalchemy import text
from backend.app.database import engine

INDEXES = [
    "CREATE INDEX IF NOT EXISTS ix_blog_posts_is_published ON blog_posts (is_published);",
    "CREATE INDEX IF NOT EXISTS ix_blog_posts_published_at ON blog_posts (published_at DESC);",
    "CREATE INDEX IF NOT EXISTS ix_blog_posts_category ON blog_posts (category);",
    "CREATE INDEX IF NOT EXISTS ix_contact_messages_is_read ON contact_messages (is_read);",
    "CREATE INDEX IF NOT EXISTS ix_contact_messages_created_at ON contact_messages (created_at DESC);",
    "CREATE INDEX IF NOT EXISTS ix_projects_is_published ON projects (is_published);",
    "CREATE INDEX IF NOT EXISTS ix_projects_is_featured ON projects (is_featured);",
    "CREATE INDEX IF NOT EXISTS ix_projects_display_order ON projects (display_order);",
    "CREATE INDEX IF NOT EXISTS ix_design_items_is_active ON design_items (is_active);",
    "CREATE INDEX IF NOT EXISTS ix_design_items_is_featured ON design_items (is_featured);",
    "CREATE INDEX IF NOT EXISTS ix_design_items_display_order ON design_items (display_order);",
    "CREATE INDEX IF NOT EXISTS ix_design_items_category ON design_items (category);",
    "CREATE INDEX IF NOT EXISTS ix_ux_ui_case_studies_is_active ON ux_ui_case_studies (is_active);",
    "CREATE INDEX IF NOT EXISTS ix_ux_ui_case_studies_is_featured ON ux_ui_case_studies (is_featured);",
    "CREATE INDEX IF NOT EXISTS ix_ux_ui_case_studies_display_order ON ux_ui_case_studies (display_order);",
    "CREATE INDEX IF NOT EXISTS ix_ux_ui_case_studies_category ON ux_ui_case_studies (category);",
]

def apply_indexes():
    print("Checking and applying PostgreSQL performance indexes...")
    with engine.begin() as conn:
        for sql in INDEXES:
            conn.execute(text(sql))
            name = sql.split("IF NOT EXISTS ")[1].split(" ON")[0]
            print(f"  [OK] Index ensured: {name}")
    print("All production performance indexes successfully active.")

if __name__ == "__main__":
    apply_indexes()
