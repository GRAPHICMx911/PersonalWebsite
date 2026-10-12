#!/usr/bin/env python3
"""
Seed realistic social media and developer profile links for Module 8.
"""
from backend.app.database import engine, SessionLocal, Base
from backend.app.models.social import SocialLink

GITHUB_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>"""

LINKEDIN_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>"""

X_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>"""

DISCORD_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>"""

SUBSTACK_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/></svg>"""

LEETCODE_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 4.815 3.626 5.86 5.86 0 0 0 1.042.012 5.918 5.918 0 0 0 3.33-1.229l3.415-2.906a1.385 1.385 0 1 0-1.782-2.122l-3.416 2.906a3.14 3.14 0 0 1-1.77.653 3.107 3.107 0 0 1-.555-.006 3.167 3.167 0 0 1-2.571-1.936 3.11 3.11 0 0 1-.186-.543 3.01 3.01 0 0 1-.033-1.258 2.87 2.87 0 0 1 .645-1.123l3.853-4.126 5.406-5.788A1.38 1.38 0 0 0 13.483 0zm2.748 7.027a1.38 1.38 0 0 0-1.378 1.38v7.054a1.38 1.38 0 1 0 2.76 0V8.407a1.38 1.38 0 0 0-1.382-1.38z"/></svg>"""

SAMPLE_LINKS = [
    {
        "platform_name": "GitHub",
        "url": "https://github.com/designlyricist",
        "icon_svg": GITHUB_SVG,
        "icon_class": "github",
        "display_order": 1,
        "is_active": True,
    },
    {
        "platform_name": "LinkedIn",
        "url": "https://linkedin.com/in/designlyricist",
        "icon_svg": LINKEDIN_SVG,
        "icon_class": "linkedin",
        "display_order": 2,
        "is_active": True,
    },
    {
        "platform_name": "X / Twitter",
        "url": "https://x.com/designlyricist",
        "icon_svg": X_SVG,
        "icon_class": "x-twitter",
        "display_order": 3,
        "is_active": True,
    },
    {
        "platform_name": "Discord Community",
        "url": "https://discord.gg/dev-architecture",
        "icon_svg": DISCORD_SVG,
        "icon_class": "discord",
        "display_order": 4,
        "is_active": True,
    },
    {
        "platform_name": "Technical Substack",
        "url": "https://technotes.designlyricist.dev",
        "icon_svg": SUBSTACK_SVG,
        "icon_class": "substack",
        "display_order": 5,
        "is_active": True,
    },
    {
        "platform_name": "LeetCode",
        "url": "https://leetcode.com/u/designlyricist",
        "icon_svg": LEETCODE_SVG,
        "icon_class": "leetcode",
        "display_order": 6,
        "is_active": True,
    },
]

def seed_social():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = db.query(SocialLink).count()
        if count == 0:
            print("Seeding initial social links...")
            for data in SAMPLE_LINKS:
                link = SocialLink(**data)
                db.add(link)
            db.commit()
            print(f"Successfully seeded {len(SAMPLE_LINKS)} social links!")
        else:
            print(f"Table social_links already contains {count} records. Skipping seed.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_social()
