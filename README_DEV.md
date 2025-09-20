Development README

Backend (FastAPI)

1. Create a Python virtual environment and install deps:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt
```

2. Run the backend (from repo root):

```powershell
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at http://127.0.0.1:8000. Open http://127.0.0.1:8000/docs for the automatic Swagger UI.

Frontend (React)

1. Install frontend deps and run (from `frontend` folder):

```powershell
cd frontend; npm install; npm start
```

The frontend dev server will start (usually at http://localhost:3000) and the React app will proxy API requests to the backend if configured; for the MVP we assume the frontend can directly reach the backend at `/api` when hosted together or use a proxy during development.

Notes & Next Steps

- NLU: There's a simple rule-based NLU endpoint at `/api/nlu` (very basic). Replace with a more capable parser or integrate an LLM (self-hosted or paid) later.
- ASR/TTS: Consider Vosk or Coqui TTS for offline speech recognition and synthesis.
- Features to add: ShiftManager, Inventory ops, Approvals, Notifications, user auth/roles, more robust entity extraction, testing.

Simulation

- A lightweight simulator is available at `/api/simulate/start`. Call this endpoint (POST) after starting the backend to spawn a background thread that will create simulated bookings and shifts on a repeated interval (default every 10s). The simulator will attempt to create one booking 1 hour in the future and ensure at least one staff shift exists for that window.
- The simulator uses background threads and the SQLite DB; the engine is created with check_same_thread=False to allow thread access. For production, consider using a real worker process (e.g., Celery, RQ) and a robust DB such as Postgres.

Standalone simulator

- For a production-like setup, run the simulator as a separate process instead of using the `/api/simulate/start` route. From the repo root:

```powershell
python backend/simulator_runner.py
```

Notifications (SMTP)

- To enable email confirmations set the following environment variables before starting the backend:

```powershell
$env:SMTP_HOST = 'smtp.example.com'; $env:SMTP_PORT = '587'; $env:SMTP_USER = 'username'; $env:SMTP_PASS = 'password'; $env:FROM_EMAIL = 'no-reply@example.com'
```

If SMTP is not configured, notification attempts are no-ops.
