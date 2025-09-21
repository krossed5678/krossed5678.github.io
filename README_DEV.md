Development README

Backend (FastAPI)

1. Create a Python virtual environment and install deps:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt
```

2. Run the backend + frontend together (PowerShell)

We added a convenience PowerShell script that builds the React frontend and starts the backend so both serve from the same origin and won't be mixed up.

From the repo root (PowerShell):

```powershell
# create and activate your Python venv first, install requirements
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt

# then run the helper script which builds the frontend and starts the backend
./start-dev.ps1
```

This will build the static React app into `frontend/build` and start uvicorn serving the backend API at http://127.0.0.1:8000 and the frontend at the same host (SPA served at `/`).

If you prefer to run frontend dev server and backend separately, see the section below.

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

## One-click start from `index.html` (optional)

You can register a simple custom URL protocol so the "Start Backend" button in the repo-root `index.html` will launch `launch-site.bat` and start the backend automatically.

1. Open PowerShell in the repo folder and run:

	.\register-protocol.ps1

2. Open `index.html` in your browser (double-click) and click the green "Start Backend" button. It will invoke the registered protocol and start the backend, then open http://127.0.0.1:8000/

3. To remove the protocol later, run:

	.\unregister-protocol.ps1

If you prefer not to register a protocol, just run `launch-site.bat` manually from a terminal and then open http://127.0.0.1:8000/ in your browser.

Note: When you open `index.html` as a file (file://), the page will use http://127.0.0.1:8000 as the API base. This makes it possible to open the file and have it contact the local backend started by the launcher.
