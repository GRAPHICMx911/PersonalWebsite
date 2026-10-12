# Personal Global Website & Engineering Platform CMS

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB.svg?style=flat&logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00.svg?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20HTML5%2FCSS3%2FES6+-F7DF1E.svg?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![License](https://img.shields.io/badge/License-Proprietary-063F60.svg?style=flat)]()

A high-performance, production-ready personal engineering website and comprehensive content management system (CMS). Built with **Python 3.13**, **FastAPI**, **PostgreSQL**, and **SQLAlchemy 2.0**, paired with a strictly zero-framework frontend utilizing **Vanilla HTML5, CSS3, and ES6+ JavaScript**.

---

## 🎨 Official 5-Color Design System

The platform strictly adheres to a cohesive, accessible 5-color palette:

| Color Role | Hex Code | Visual Swatch | Primary Usage |
|---|---|:---:|---|
| **Primary Dark** | `#063F60` | `■` | Deep Navy: Headings, primary text, navigation bar, sidebar, footer |
| **Primary Action** | `#087DD8` | `■` | Bright Blue: Primary action buttons, active tab indicators, links, badges |
| **Primary Light** | `#6FB7E1` | `■` | Light Blue: Secondary buttons, tag badges, accent borders, highlights |
| **Secondary Light** | `#C4E0E1` | `■` | Soft Aqua: Card borders, input outlines, subtle hover states |
| **Light Background** | `#E8EEEE` | `■` | Off-White / Soft Gray: Body background, cards, tables, panels |

*Status Indicators:* Success (`#15803d` / `#dcfce7`), Warning (`#b45309` / `#fef3c7`), Danger (`#b91c1c` / `#fef2f2`).

---

## 📦 System Architecture & Module Catalog

The system is organized into 10 cohesive modules:

### 1. Core Architecture & Authentication Control Center
- Full REST API with FastAPI dependency injection and OpenAPI / Swagger documentation (`/docs`).
- Argon2id password hashing (`pwdlib`) and cryptographic JSON Web Token (JWT) bearer authorization.
- Admin dashboard displaying live metrics for published projects, skills, certificates, case studies, blog articles, and unread messages.
- Centralized system health checks (`GET /api/health`) verifying live database connectivity.

### 2. Software & Systems Engineering Projects CMS
- Portfolio showcase with multi-category classification (Software Engineering, Cybersecurity, AWS Cloud, Networks, UX/UI, Graphic Design, Project Management).
- Full CRUD workflows, draft/published status toggling, featured flag, and custom display ordering.
- Dynamic project slug routing (`project-details.html?slug=...`) with cover image uploads.

### 3. Technical Skills & Verified Industry Credentials CMS
- Categorized skill competency manager (Frontend, Backend, Cloud & DevOps, Security, Databases, Design).
- Skill proficiency indicators, featured filters, and responsive pill layout.
- Accredited certification registry with verification IDs, issuing authorities, credential verification URLs, badge image uploads, and public credential modals with direct copy buttons.

### 4. Career Milestones & Academic Heritage CMS
- Work experience timeline supporting company name, role title, employment type, location, date ranges, current job flags, and key accomplishments.
- Academic education history tracking degrees, institutions, fields of study, graduation years, honors, and activities.

### 5. Design Portfolio & UX/UI Case Studies CMS
- Graphic design showcase with category filtering (Branding, Design Systems, Vector Illustration, Print) and image lightbox modals.
- Comprehensive UX/UI case studies detailing problem statements, research methodologies, design systems, key metrics, and embedded Figma prototype links.

### 6. Technical Blog & Knowledge Publishing CMS
- Full-featured technical blogging engine with auto-generated URL slugs, tags, reading time calculations, and view count tracking.
- Client-side search, category filter chips, published/draft status toggling, and article reading modals.

### 7. Client & Visitor Inquiries (Contact Form) CMS
- Public interactive contact form with instant validation, feedback toasts, and automated timestamping.
- Admin message inbox with unread counter badges, search, detail modals with one-click `mailto:` reply triggers, read/unread status toggling, and archiving.

### 8. Social Links & Developer Profiles CMS
- Centralized management for external platform profiles (GitHub, LinkedIn, X/Twitter, Discord, YouTube, Substack, LeetCode, Medium, Email, Telegram).
- Official SVG icons, drag-and-drop or numeric reordering, active visibility toggles, and dynamic rendering across public headers and footers.

### 9. Global Website Settings & SEO Metadata CMS
- Singleton configuration record managing legal name, professional title, executive bio summary, and avatar.
- Reactive live hero banner editor with real-time text updates for tagline pills, headline prefixes, blue gradient highlights, and descriptions.
- Dynamic curriculum vitae (CV) / resume management with drag-and-drop upload (`.pdf`, `.docx`) and public download buttons.
- Search Engine Optimization (SEO) controls for `<title>`, meta descriptions, meta keywords, and OpenGraph social share previews.
- Real-time availability indicator badge with animated pulsing indicator.

### 10. Production Hardening & System Optimization
- Defense-in-depth HTTP security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`).
- Safe server-generated UUID file naming preventing directory traversal vulnerabilities.
- File upload MIME and extension whitelisting.
- High-throughput composite and partial PostgreSQL indexes on query hotspots.
- Alembic database migration management.
- 100% automated end-to-end test suites covering all modules.

---

## 🛠️ Technology Stack

| Layer | Component | Description |
|---|---|---|
| **Language** | Python 3.13 | High-performance asynchronous execution |
| **API Framework** | FastAPI 0.110+ | Type-safe REST APIs with automatic OpenAPI schema generation |
| **ASGI Server** | Uvicorn (standard) | Lightning-fast async server with multi-worker support |
| **Database** | PostgreSQL 14+ | ACID-compliant relational storage |
| **ORM** | SQLAlchemy 2.0 | Modern declarative mapped classes with connection pooling |
| **Driver** | psycopg 3.1+ | Next-generation Python DBAPI driver for PostgreSQL |
| **Migrations** | Alembic 1.13+ | Database revision and migration pipeline |
| **Security** | Argon2id & JWT | Secure password hashing via `pwdlib` and HMAC-SHA256 JWTs |
| **Validation** | Pydantic v2 | Robust request/response schema validation |
| **Frontend** | Vanilla HTML5, CSS3, JS | Pure standards-compliant code with zero external dependencies |

---

## 📂 Project Directory Layout

```text
PersonalWebsite/
├── backend/
│   ├── alembic/                      # Database schema migrations
│   │   ├── versions/                 # Revision scripts
│   │   └── env.py                    # Alembic execution environment
│   ├── app/
│   │   ├── api/routes/               # Modular FastAPI endpoints
│   │   │   ├── admin.py              # Admin metrics & profile
│   │   │   ├── auth.py               # Authentication & token generation
│   │   │   ├── blog.py               # Technical blog & articles
│   │   │   ├── certifications.py     # Industry certifications
│   │   │   ├── design.py             # Graphic design portfolio
│   │   │   ├── education.py          # Academic history
│   │   │   ├── experience.py         # Career experience
│   │   │   ├── messages.py           # Contact inquiries & inbox
│   │   │   ├── projects.py           # Software engineering projects
│   │   │   ├── settings.py           # Site settings, hero, resume & SEO
│   │   │   ├── skills.py             # Technical skills
│   │   │   ├── social.py             # Social links & profiles
│   │   │   └── ux_ui.py              # UX/UI case studies
│   │   ├── core/                     # Security, hashing & dependencies
│   │   ├── models/                   # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/                  # Pydantic v2 schemas
│   │   ├── database.py               # Engine & session management
│   │   └── main.py                   # FastAPI application & middleware
│   ├── .env                          # Local environment secrets (ignored by git)
│   ├── .env.example                  # Environment configuration template
│   ├── create_admin.py               # Interactive CLI admin user creation tool
│   ├── requirements.txt              # Backend dependency requirements
│   └── seed.py                       # Initial database seeder
├── frontend/
│   ├── admin/                        # Admin CMS Workspace
│   │   ├── css/                      # Admin stylesheets
│   │   ├── js/                       # Admin JavaScript controllers
│   │   ├── blog.html                 # Technical blog management
│   │   ├── certifications.html       # Certifications management
│   │   ├── dashboard.html            # Metrics overview
│   │   ├── design.html               # Design portfolio management
│   │   ├── education.html            # Education history management
│   │   ├── experience.html           # Experience management
│   │   ├── login.html                # CMS login page
│   │   ├── messages.html             # Contact messages inbox
│   │   ├── projects.html             # Projects showcase management
│   │   ├── settings.html             # Global settings & profile CMS
│   │   ├── skills.html               # Skills inventory management
│   │   ├── social.html               # Social links management
│   │   └── ux-ui.html                # UX/UI case study management
│   ├── css/                          # Public styles & mirrored admin CSS
│   ├── js/                           # Public scripts & mirrored admin JS
│   ├── uploads/                      # Uploaded files (documents, images)
│   ├── index.html                    # Public homepage & portfolio landing
│   ├── projects.html                 # Public dedicated projects catalog
│   ├── project-details.html          # Public single-project case study view
│   └── blog.html                     # Public technical blog catalog
├── .gitignore                        # Git exclusion rules
├── .env.example                      # Root environment template
├── alembic.ini                       # Alembic migration configuration
├── optimize_db.py                    # Database performance indexing script
├── requirements.txt                  # Root Python requirements
├── test_modules1_to_4_e2e.py         # E2E test suite for Modules 1–4
├── test_module5_e2e.py               # E2E test suite for Module 5
├── test_module6_e2e.py               # E2E test suite for Module 6
├── test_module7_e2e.py               # E2E test suite for Module 7
├── test_module8_e2e.py               # E2E test suite for Module 8
├── test_module9_e2e.py               # E2E test suite for Module 9
├── test_production_suite.py          # Master E2E production test runner
└── README.md                         # Platform documentation
```

---

## 🚀 Installation & Local Setup

### 1. Clone & Set Up Python Environment

Ensure **Python 3.11+** or **3.13** is installed:

```powershell
# Clone or navigate to the project directory
cd D:\MyWebsite\PersonalWebsite

# Create a virtual environment
python -m venv venv

# Activate the virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Upgrade pip and install all required dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

*(On Linux / macOS: `source venv/bin/activate`)*

### 2. Configure Environment Variables

Copy `.env.example` to `backend/.env`:

```powershell
Copy-Item .env.example backend/.env
```

Edit `backend/.env` with your PostgreSQL database credentials:

```env
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/personal_website_db
JWT_SECRET_KEY=9f82d1c6e4a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS=http://127.0.0.1:8000,http://localhost:8000
```

### 3. Initialize Database & Seed Content

Create the PostgreSQL database (e.g. `personal_website_db`), then execute the initialization and seed scripts:

```powershell
# Create tables and seed initial administrator account
python backend/seed.py

# Apply database performance indexes
python optimize_db.py

# Seed initial blog articles, messages, social links, and settings
python seed_blog.py
python seed_messages.py
python seed_social.py
python seed_settings.py
```

**Default Administrator Credentials:**
- **Username:** `admin` (or `admin@example.com`)
- **Password:** `adminpassword123`

To create a new custom administrator account via CLI:
```powershell
python backend/create_admin.py
```

### 4. Start the Application Server

Launch the FastAPI application using Uvicorn:

```powershell
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### 5. Access the Platform

- **Public Portfolio:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Projects Catalog:** [http://127.0.0.1:8000/projects.html](http://127.0.0.1:8000/projects.html)
- **Technical Blog:** [http://127.0.0.1:8000/blog.html](http://127.0.0.1:8000/blog.html)
- **Admin CMS Login:** [http://127.0.0.1:8000/admin/login.html](http://127.0.0.1:8000/admin/login.html)
- **Admin Control Center:** [http://127.0.0.1:8000/admin/dashboard.html](http://127.0.0.1:8000/admin/dashboard.html)
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check Endpoint:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 🧪 Automated Testing & Verification

The platform includes comprehensive end-to-end automated test suites. Execute them at any time to verify system integrity:

```powershell
# Run individual module test suites:
python test_modules1_to_4_e2e.py    # Architecture, Auth, Projects, Skills, Career
python test_module5_e2e.py          # Design Portfolio & UX/UI Case Studies
python test_module6_e2e.py          # Technical Blog & Articles
python test_module7_e2e.py          # Contact Inquiries & Admin Inbox
python test_module8_e2e.py          # Social Links & Platform Profiles
python test_module9_e2e.py          # Global Settings, Hero Banner & SEO

# Run the master production suite:
python test_production_suite.py
```

---

## 🔒 Security & Hardening Highlights

1. **Argon2id Password Hashing:** Recommended memory-hard hashing function providing high resistance against GPU-accelerated brute-force attacks.
2. **Cryptographic JWT Tokens:** Signed tokens with configurable expirations and token revocation safeguards.
3. **Defense-in-Depth HTTP Headers:** Every response automatically includes `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
4. **Path Traversal Protection:** All file uploads generate randomized server-side UUID filenames (`{module}_{uuid}.{ext}`), preventing path traversal and file overwrites.
5. **MIME & Extension Whitelisting:** Strict validation ensures only allowed image and document types (`.png`, `.jpg`, `.webp`, `.svg`, `.pdf`) are accepted; executables (`.exe`, `.sh`) are rejected with `HTTP 400`.
6. **SQL Injection Immune:** All database interactions utilize SQLAlchemy 2.0 parameterized queries and typed ORM models.

---

## 📄 License & Attribution

Designed and engineered for **Design Lyricist** — Personal Global Website & CMS Platform. All rights reserved.

