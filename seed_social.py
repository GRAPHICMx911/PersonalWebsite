#!/usr/bin/env python3
"""
Seed realistic social media and developer profile links for Module 8.
"""
from backend.app.database import engine, SessionLocal, Base
from backend.app.models.social import SocialLink

GITHUB_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>"""

LINKEDIN_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>"""

BEHANCE_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-4.357 0-6.625-2.909-6.625-6.785 0-4.171 2.598-6.965 6.467-6.965 4.148 0 6.096 2.871 5.86 6.814h-9.351c.063 2.115 1.422 3.656 3.633 3.656 1.701 0 2.836-.78 3.32-1.72h1.797zm-5.748-5.795c-.09-1.572-1.07-2.613-2.639-2.613-1.636 0-2.678 1.053-2.834 2.613h5.473zm-13.978 7.795H0V5h4.744c3.084 0 4.887 1.488 4.887 4.025 0 1.632-.824 2.859-2.094 3.444 1.666.529 2.583 1.947 2.583 3.824 0 2.812-1.996 4.707-6.12 4.707zm.898-8.232c1.439 0 2.379-.691 2.379-1.994 0-1.229-.877-1.87-2.285-1.87H2.016v3.864h1.898zm.277 6.326c1.678 0 2.766-.81 2.766-2.264 0-1.402-1.049-2.176-2.734-2.176H2.016v4.44h2.175z"/></svg>"""

SAMPLE_LINKS = [
    {
        "platform_name": "LinkedIn",
        "url": "https://www.linkedin.com/in/muneeb-ahmad-11973226a",
        "icon_svg": LINKEDIN_SVG,
        "icon_class": "linkedin",
        "display_order": 1,
        "is_active": True,
    },
    {
        "platform_name": "Behance",
        "url": "https://www.behance.net/graphicmx911",
        "icon_svg": BEHANCE_SVG,
        "icon_class": "behance",
        "display_order": 2,
        "is_active": True,
    },
    {
        "platform_name": "GitHub",
        "url": "https://github.com/GRAPHICMx911",
        "icon_svg": GITHUB_SVG,
        "icon_class": "github",
        "display_order": 3,
        "is_active": True,
    },
]

def seed_social():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Clear previous and set exactly the 3 specified links
        db.query(SocialLink).delete()
        print("Cleared existing social links.")
        for data in SAMPLE_LINKS:
            link = SocialLink(**data)
            db.add(link)
        db.commit()
        print(f"Successfully seeded {len(SAMPLE_LINKS)} social links!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_social()
