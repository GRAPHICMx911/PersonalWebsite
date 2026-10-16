import sys
from pathlib import Path

# Add project root directory to Python path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.main import app as backend_app

# Top-level ASGI handler assignments for Vercel AST scanner
app = backend_app
handler = backend_app
