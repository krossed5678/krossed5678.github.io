from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .routes import router
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
FRONTEND_BUILD = Path(__file__).resolve().parent.parent.parent / "frontend" / "build"
app.include_router(router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    """Fallback route: return index.html for SPA routes when build exists."""
    index_file = FRONTEND_BUILD / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"status": "ok"}


# Serve static SPA after registering API and health routes so the /api and /health prefixes are not shadowed
if FRONTEND_BUILD.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_BUILD), html=True), name="frontend")
