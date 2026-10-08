import sys
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.app.database import engine, SessionLocal, Base
from backend.app.models.user import User
from backend.app.models.project import Project, ProjectCategory
from backend.app.models.skill import Skill, SkillCategory
from backend.app.models.certification import Certification
from backend.app.core.security import get_password_hash

CATEGORIES = [
    {"name": "Software Engineering", "slug": "software-engineering", "description": "Full-stack development, distributed systems, algorithms, APIs."},
    {"name": "Graphic Design", "slug": "graphic-design", "description": "Brand identity, vector art, visual layout, typography."},
    {"name": "UX/UI Design", "slug": "ux-ui-design", "description": "User research, wireframing, interactive prototyping, design systems."},
    {"name": "Cybersecurity", "slug": "cybersecurity", "description": "Penetration testing, network defense, threat modeling, OWASP practices."},
    {"name": "AWS Cloud", "slug": "aws-cloud", "description": "Cloud architectures, serverless, AWS infrastructure and DevOps."},
    {"name": "Networking", "slug": "networking", "description": "TCP/IP, network topology, routing, firewall configurations."},
    {"name": "Project Management", "slug": "project-management", "description": "Agile/Scrum, product planning, roadmaps, technical execution."},
]

ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "adminpassword123"
ADMIN_FULL_NAME = "Administrator"

INITIAL_SKILLS = [
    # Software Engineering
    {"cat_slug": "software-engineering", "name": "Python", "proficiency": 95, "level": "Expert", "icon": "🐍", "order": 1, "featured": True, "desc": "Advanced backend development, async workflows, clean architectural patterns."},
    {"cat_slug": "software-engineering", "name": "FastAPI & REST APIs", "proficiency": 92, "level": "Expert", "icon": "⚡", "order": 2, "featured": True, "desc": "High-performance asynchronous REST microservices with OpenAPI specifications."},
    {"cat_slug": "software-engineering", "name": "PostgreSQL & SQLAlchemy", "proficiency": 90, "level": "Advanced", "icon": "🐘", "order": 3, "featured": True, "desc": "Relational schema modeling, connection pooling, complex queries and indexing."},
    {"cat_slug": "software-engineering", "name": "Vanilla JavaScript (ES6+)", "proficiency": 88, "level": "Advanced", "icon": "📜", "order": 4, "featured": True, "desc": "Frameworkless modern DOM manipulation, async fetch API, responsive SPAs."},
    {"cat_slug": "software-engineering", "name": "Docker & Containerization", "proficiency": 85, "level": "Advanced", "icon": "🐳", "order": 5, "featured": False, "desc": "Multi-stage Docker builds, container orchestration and deployment readiness."},
    {"cat_slug": "software-engineering", "name": "Git & GitHub CI/CD", "proficiency": 92, "level": "Expert", "icon": "🐙", "order": 6, "featured": False, "desc": "Version control, branching strategies, automated testing workflows."},

    # Cybersecurity
    {"cat_slug": "cybersecurity", "name": "Vulnerability Assessment", "proficiency": 90, "level": "Advanced", "icon": "🛡️", "order": 1, "featured": True, "desc": "Security scanning, identifying CVE exposures, remediation prioritization."},
    {"cat_slug": "cybersecurity", "name": "OWASP Top 10 Hardening", "proficiency": 92, "level": "Expert", "icon": "🔒", "order": 2, "featured": True, "desc": "Protection against SQLi, XSS, CSRF, insecure direct object references."},
    {"cat_slug": "cybersecurity", "name": "Nmap & Reconnaissance", "proficiency": 88, "level": "Advanced", "icon": "📡", "order": 3, "featured": False, "desc": "Port scanning, service enumeration, OS fingerprinting for security audits."},
    {"cat_slug": "cybersecurity", "name": "Wireshark Packet Analysis", "proficiency": 86, "level": "Advanced", "icon": "🦈", "order": 4, "featured": False, "desc": "Deep packet inspection, troubleshooting anomalous network behavior."},
    {"cat_slug": "cybersecurity", "name": "Burp Suite Web Testing", "proficiency": 84, "level": "Proficient", "icon": "🔍", "order": 5, "featured": False, "desc": "HTTP request interception, parameter manipulation, auth testing."},

    # AWS Cloud
    {"cat_slug": "aws-cloud", "name": "AWS EC2 & VPC Architecture", "proficiency": 90, "level": "Advanced", "icon": "☁️", "order": 1, "featured": True, "desc": "Secure virtual private clouds, subnets, routing tables, security groups."},
    {"cat_slug": "aws-cloud", "name": "AWS S3 & CloudFront CDN", "proficiency": 92, "level": "Expert", "icon": "📦", "order": 2, "featured": True, "desc": "High-availability static asset distribution with origin access controls."},
    {"cat_slug": "aws-cloud", "name": "AWS Lambda Serverless", "proficiency": 85, "level": "Advanced", "icon": "λ", "order": 3, "featured": False, "desc": "Event-driven serverless computing with API Gateway integration."},
    {"cat_slug": "aws-cloud", "name": "IAM & Security Policies", "proficiency": 88, "level": "Advanced", "icon": "🔑", "order": 4, "featured": False, "desc": "Role-based access control (RBAC), least-privilege permission policies."},

    # Networking
    {"cat_slug": "networking", "name": "TCP/IP & OSI Protocols", "proficiency": 94, "level": "Expert", "icon": "🌐", "order": 1, "featured": True, "desc": "In-depth understanding of packet transmission, DNS, DHCP, HTTP/S, SSL/TLS."},
    {"cat_slug": "networking", "name": "IP Subnetting & CIDR", "proficiency": 92, "level": "Expert", "icon": "🔢", "order": 2, "featured": False, "desc": "IPv4/IPv6 address allocation, VLSM design, hierarchical topology."},
    {"cat_slug": "networking", "name": "VPNs & Secure Tunneling", "proficiency": 88, "level": "Advanced", "icon": "🚇", "order": 3, "featured": False, "desc": "Site-to-site IPsec and SSL VPN tunnel configurations and encryption."},
    {"cat_slug": "networking", "name": "Firewalls & Routing", "proficiency": 86, "level": "Advanced", "icon": "🧱", "order": 4, "featured": False, "desc": "Stateful packet inspection, NAT, static & dynamic route tables."},

    # UX/UI Design
    {"cat_slug": "ux-ui-design", "name": "Figma Interface Design", "proficiency": 92, "level": "Expert", "icon": "🎨", "order": 1, "featured": True, "desc": "Auto-layout, interactive components, responsive screen layouts."},
    {"cat_slug": "ux-ui-design", "name": "Design Systems & Tokens", "proficiency": 90, "level": "Advanced", "icon": "📐", "order": 2, "featured": False, "desc": "Reusable component libraries, typography scales, cohesive color palettes."},
    {"cat_slug": "ux-ui-design", "name": "Wireframing & User Flows", "proficiency": 88, "level": "Advanced", "icon": "🗺️", "order": 3, "featured": False, "desc": "Low-to-high fidelity wireframes, user journeys, interaction hierarchy."},

    # Graphic Design
    {"cat_slug": "graphic-design", "name": "Brand Identity & Logo Design", "proficiency": 95, "level": "Expert", "icon": "💎", "order": 1, "featured": True, "desc": "Emblematic vector identities, guidelines, visual brand equity."},
    {"cat_slug": "graphic-design", "name": "Vector Graphics & Illustration", "proficiency": 90, "level": "Advanced", "icon": "✒️", "order": 2, "featured": False, "desc": "Crisp SVG vector assets, iconography, scalable artwork."},
    {"cat_slug": "graphic-design", "name": "Typography & Editorial Layout", "proficiency": 88, "level": "Advanced", "icon": "🔤", "order": 3, "featured": False, "desc": "Visual balance, readability, hierarchical typesetting."},

    # Project Management
    {"cat_slug": "project-management", "name": "Agile & Scrum Methodologies", "proficiency": 92, "level": "Expert", "icon": "🏃", "order": 1, "featured": True, "desc": "Sprint planning, backlog refinement, stand-ups, retrospective delivery."},
    {"cat_slug": "project-management", "name": "Technical Documentation", "proficiency": 95, "level": "Expert", "icon": "📝", "order": 2, "featured": False, "desc": "Architecture blueprints, API specs, developer handoff guides."},
    {"cat_slug": "project-management", "name": "Jira & Task Tracking", "proficiency": 88, "level": "Advanced", "icon": "📋", "order": 3, "featured": False, "desc": "Milestone tracking, issue prioritization, velocity management."},
    {"cat_slug": "project-management", "name": "Risk Assessment & Mitigation", "proficiency": 86, "level": "Advanced", "icon": "⚖️", "order": 4, "featured": False, "desc": "Scope creep defense, security risk auditing, release contingency."},
]


def seed_database():
    print("[*] Creating all database tables if they do not exist...")
    Base.metadata.create_all(bind=engine)
    print("[+] Database tables ensured.")

    db: Session = SessionLocal()
    try:
        # 1. Seed Admin User
        admin_user = db.scalar(
            select(User).where((User.username == ADMIN_USERNAME) | (User.email == ADMIN_EMAIL))
        )
        if not admin_user:
            admin_user = User(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                full_name=ADMIN_FULL_NAME,
                password_hash=get_password_hash(ADMIN_PASSWORD),
                is_active=True,
                is_superuser=True,
            )
            db.add(admin_user)
            print(f"[+] Admin created: {ADMIN_USERNAME} / {ADMIN_EMAIL} (Password: {ADMIN_PASSWORD})")
        else:
            admin_user.is_superuser = True
            admin_user.is_active = True
            print(f"[*] Admin already exists: {admin_user.username} ({admin_user.email})")

        # 2. Seed Project Categories & Skill Categories
        cat_map = {}
        for idx, cat in enumerate(CATEGORIES, start=1):
            # Project category
            proj_cat = db.scalar(
                select(ProjectCategory).where(ProjectCategory.slug == cat["slug"])
            )
            if not proj_cat:
                proj_cat = ProjectCategory(
                    name=cat["name"],
                    slug=cat["slug"],
                    description=cat["description"],
                    is_active=True,
                )
                db.add(proj_cat)
                print(f"[+] Project Category added: {cat['name']}")

            # Skill category
            skill_cat = db.scalar(
                select(SkillCategory).where(SkillCategory.slug == cat["slug"])
            )
            if not skill_cat:
                skill_cat = SkillCategory(
                    name=cat["name"],
                    slug=cat["slug"],
                    description=cat["description"],
                    display_order=idx,
                    is_active=True,
                )
                db.add(skill_cat)
                print(f"[+] Skill Category added: {cat['name']}")

            cat_map[cat["slug"]] = skill_cat

        db.commit()

        # Re-fetch skill categories to ensure IDs are assigned
        for cat in CATEGORIES:
            db_cat = db.scalar(select(SkillCategory).where(SkillCategory.slug == cat["slug"]))
            if db_cat:
                cat_map[cat["slug"]] = db_cat

        # 3. Seed Initial Skills
        for s_data in INITIAL_SKILLS:
            category_obj = cat_map.get(s_data["cat_slug"])
            category_id = category_obj.id if category_obj else None

            existing_skill = db.scalar(
                select(Skill).where(Skill.name == s_data["name"])
            )
            if not existing_skill:
                new_skill = Skill(
                    category_id=category_id,
                    name=s_data["name"],
                    proficiency=s_data["proficiency"],
                    proficiency_level=s_data["level"],
                    icon=s_data["icon"],
                    description=s_data["desc"],
                    display_order=s_data["order"],
                    is_featured=s_data["featured"],
                    is_visible=True,
                )
                db.add(new_skill)
                print(f"[+] Skill added: {s_data['name']} ({s_data['proficiency']}%)")
            else:
                print(f"[*] Skill exists: {s_data['name']}")

        # 4. Seed Initial Certifications
        INITIAL_CERTIFICATIONS = [
            {
                "name": "AWS Certified Solutions Architect – Associate",
                "issuing_organization": "Amazon Web Services (AWS)",
                "issue_date": "May 2024",
                "expiry_date": "May 2027",
                "credential_id": "AWS-SAA-839201",
                "credential_url": "https://aws.amazon.com/verification",
                "description": "Validation of comprehensive cloud architecture design, security, scalability, and high-availability systems on AWS.",
                "display_order": 1,
                "is_featured": True,
            },
            {
                "name": "CompTIA Security+ (SY0-701)",
                "issuing_organization": "CompTIA",
                "issue_date": "January 2024",
                "expiry_date": "January 2027",
                "credential_id": "COMP001029384",
                "credential_url": "https://www.credly.com",
                "description": "Core cybersecurity skills across risk management, threat analysis, cryptography, network security, and compliance.",
                "display_order": 2,
                "is_featured": True,
            },
            {
                "name": "Cisco Certified Network Associate (CCNA 200-301)",
                "issuing_organization": "Cisco Systems",
                "issue_date": "November 2023",
                "expiry_date": "November 2026",
                "credential_id": "CSCO-13948201",
                "credential_url": "https://www.cisco.com",
                "description": "Network fundamentals, IP connectivity, IP services, security fundamentals, and network automation.",
                "display_order": 3,
                "is_featured": True,
            },
            {
                "name": "Certified ScrumMaster (CSM)",
                "issuing_organization": "Scrum Alliance",
                "issue_date": "March 2024",
                "expiry_date": "March 2026",
                "credential_id": "CSM-984021",
                "credential_url": "https://www.scrumalliance.org",
                "description": "Agile methodologies, sprint facilitation, team leadership, impediment removal, and product delivery.",
                "display_order": 4,
                "is_featured": False,
            },
        ]

        for cert_data in INITIAL_CERTIFICATIONS:
            existing_cert = db.scalar(
                select(Certification).where(Certification.name == cert_data["name"])
            )
            if not existing_cert:
                new_cert = Certification(
                    name=cert_data["name"],
                    issuing_organization=cert_data["issuing_organization"],
                    issue_date=cert_data["issue_date"],
                    expiry_date=cert_data["expiry_date"],
                    credential_id=cert_data["credential_id"],
                    credential_url=cert_data["credential_url"],
                    description=cert_data["description"],
                    display_order=cert_data["display_order"],
                    is_featured=cert_data["is_featured"],
                    is_active=True,
                )
                db.add(new_cert)
                print(f"[+] Certification added: {cert_data['name']}")
            else:
                print(f"[*] Certification exists: {cert_data['name']}")

        db.commit()
        print("[*] Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"[!] Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()