import os
from pathlib import Path
from fastapi import FastAPI, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv

from backend.app.database import get_db
from backend.app.api.routes import auth, admin, projects, skills, certifications, experience, education, design, ux_ui, blog, messages, social, settings

load_dotenv()

app = FastAPI(
    title="Personal Global Portfolio & CMS API",
    description="REST API for Personal Global Website and Admin CMS",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup
raw_origins = os.getenv("ALLOWED_ORIGINS", "")
origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Enforce defense-in-depth HTTP security headers across all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
frontend_dir = BASE_DIR / "frontend"
uploads_dir = frontend_dir / "uploads"

# Mount Uploads directory
uploads_dir.mkdir(parents=True, exist_ok=True)
(uploads_dir / "projects").mkdir(parents=True, exist_ok=True)
(uploads_dir / "certifications").mkdir(parents=True, exist_ok=True)
(uploads_dir / "experience").mkdir(parents=True, exist_ok=True)
(uploads_dir / "education").mkdir(parents=True, exist_ok=True)
(uploads_dir / "design").mkdir(parents=True, exist_ok=True)
(uploads_dir / "ux-ui").mkdir(parents=True, exist_ok=True)
(uploads_dir / "blog").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include API Routers FIRST so API routes take precedence
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(projects.router)
app.include_router(skills.router)
app.include_router(certifications.router)
app.include_router(experience.router)
app.include_router(education.router)
app.include_router(design.router)
app.include_router(ux_ui.router)
app.include_router(blog.router)
app.include_router(messages.router)
app.include_router(social.router)
app.include_router(settings.router)


# System Health Check
@app.get("/api/health", status_code=status.HTTP_200_OK, tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """Verifies that the API server and PostgreSQL database are operational."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "message": "API and PostgreSQL are communicating successfully.",
        }
    except Exception as e:
        return {
            "status": "degraded",
            "database": "disconnected",
            "error": str(e),
        }


# Public Static Assets & Pages Mounts
(frontend_dir / "css").mkdir(parents=True, exist_ok=True)
app.mount("/css", StaticFiles(directory=str(frontend_dir / "css")), name="css")

(frontend_dir / "js").mkdir(parents=True, exist_ok=True)
app.mount("/js", StaticFiles(directory=str(frontend_dir / "js")), name="js")

if (frontend_dir / "admin").exists():
    app.mount("/admin", StaticFiles(directory=str(frontend_dir / "admin"), html=True), name="admin")


# Public HTML Pages Handlers
@app.get("/", tags=["Public"])
def read_index():
    index_file = frontend_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "message": "Personal Global Website API is running",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/index.html", tags=["Public"])
def read_index_html():
    index_file = frontend_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return FileResponse(str(frontend_dir / "index.html"))


if (frontend_dir / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dir / "assets")), name="assets")


@app.get("/logo.png", tags=["Public"])
def get_main_logo():
    logo_file = frontend_dir / "logo.png"
    if logo_file.exists():
        return FileResponse(str(logo_file), media_type="image/png")


@app.get("/favicon.ico", tags=["Public"])
def get_favicon():
    logo_file = frontend_dir / "logo.png"
    if logo_file.exists():
        return FileResponse(str(logo_file), media_type="image/png")


@app.get("/Logo_website.png", tags=["Public"])
def get_logo():
    logo_file = frontend_dir / "Logo_website.png"
    if logo_file.exists():
        return FileResponse(str(logo_file))


@app.get("/Logo_websites.png", tags=["Public"])
def get_logos():
    logo_file = frontend_dir / "Logo_websites.png"
    if logo_file.exists():
        return FileResponse(str(logo_file))


@app.get("/projects.html", tags=["Public"])
def read_projects_page():
    projects_file = frontend_dir / "projects.html"
    if projects_file.exists():
        return FileResponse(str(projects_file))
    return FileResponse(str(frontend_dir / "index.html"))


@app.get("/project-details.html", tags=["Public"])
def read_project_details_page():
    details_file = frontend_dir / "project-details.html"
    if details_file.exists():
        return FileResponse(str(details_file))
    return FileResponse(str(frontend_dir / "index.html"))


@app.get("/blog.html", tags=["Public"])
def read_blog_page():
    blog_file = frontend_dir / "blog.html"
    if blog_file.exists():
        return FileResponse(str(blog_file))
    return FileResponse(str(frontend_dir / "index.html"))


@app.get("/blog-details.html", tags=["Public"])
def read_blog_details_page():
    details_file = frontend_dir / "blog-details.html"
    if details_file.exists():
        return FileResponse(str(details_file))
    return FileResponse(str(frontend_dir / "index.html"))