from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .routes import router
from .asr_api import router as asr_router
from backend.db.database import init_db
from pathlib import Path

app = FastAPI(title="Booking API")


@app.on_event("startup")
def on_startup():
    # ensure DB and tables exist
    init_db()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# serve frontend build (if available)
# The project layout places `frontend` at the repository root. main.py lives in backend/app,
# so go up three levels to reach the repo root and then `frontend/build`.
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
FRONTEND_BUILD = REPO_ROOT / "frontend" / "build"
ROOT_INDEX = REPO_ROOT / "index.html"
app.include_router(router, prefix="/api")
app.include_router(asr_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    """Fallback route: return index.html for SPA routes when build exists."""
    # If a repo-root index.html exists (single-file frontend), serve it.
    if ROOT_INDEX.exists():
        return FileResponse(str(ROOT_INDEX))
    index_file = FRONTEND_BUILD / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"status": "ok"}


# Serve static SPA after registering API and health routes so the /api and /health prefixes are not shadowed
# If the repo-root index.html is present we'll serve that; otherwise mount the SPA build (if present).
if not ROOT_INDEX.exists() and FRONTEND_BUILD.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_BUILD), html=True), name="frontend")
