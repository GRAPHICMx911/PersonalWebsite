"""
Netlify Serverless Function Handler for FastAPI Application.
Adapts ASGI FastAPI application to Netlify Functions / AWS Lambda using Mangum.
"""
import sys
from pathlib import Path

# Add project root directory to Python path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from mangum import Mangum
from backend.app.main import app as fastapi_app

# Initialize Mangum adapter
asgi_handler = Mangum(fastapi_app, lifespan="off")

# Auto-seed and initialize tables lazily on startup
_db_initialized = False


def _ensure_db_init():
    global _db_initialized
    if not _db_initialized:
        try:
            from backend.app.init_db import init_database_and_seed
            init_database_and_seed()
            _db_initialized = True
        except Exception as e:
            print(f"Database initialization warning: {e}")


def handler(event, context):
    """
    Netlify Lambda handler entry point.
    Normalizes path prefixes from Netlify function rewrites.
    """
    _ensure_db_init()

    # Path normalization
    # Requests from /api/* rewritten to /.netlify/functions/api/:splat
    path = event.get("path", "/")
    prefix = "/.netlify/functions/api"

    if path.startswith(prefix):
        rem = path[len(prefix):]
        if not rem or rem == "/":
            path = "/api"
        elif rem.startswith("/docs") or rem.startswith("/openapi.json"):
            path = rem
        else:
            path = "/api" + (rem if rem.startswith("/") else "/" + rem)
        event["path"] = path

    # Ensure APIGateway handler detection criteria are satisfied
    event.setdefault("resource", event.get("path", "/"))
    event.setdefault("requestContext", {"identity": {"sourceIp": "127.0.0.1"}})

    return asgi_handler(event, context)
