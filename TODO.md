# Project TODO

## Immediate (this week)
- [x] Configure Twilio webhook to point to SERVER_URL/webhook/voice (auto via script below)
- [x] Add script to auto-start ngrok and update SERVER_URL in server/.env
- [x] Register Windows Scheduled Task to run the ngrok updater on startup (scripts/register-ngrok-autostart.ps1)
- [x] Validate environment at startup (Twilio/Mistral keys, ports 3001/8000, ngrok availability) — scripts/validate-environment.ps1
- [x] Smoke test phone flow end-to-end (multi-turn probing) via public URL and Twilio number — scripts/smoke-test.ps1
- [x] Consolidate to a single orchestrator: scripts/run-all.ps1 (start, update Twilio, smoke test, autostart, cleanup)

## Short term
- [ ] Persistent storage: add SQLite DB for bookings and call logs (fallback to localStorage)
- [ ] Admin dashboard polish for demo (bookings, calls, SMS, queue status)
- [ ] Reference-driven UI remodel: consume upcoming /reference assets to match landing site for customer-facing portal (waiting on assets)
- [x] Optional: auto-update Twilio SMS webhook (SERVER_URL/webhook/sms) — implemented in update-server-url-and-start-ngrok.ps1
- [ ] Implement data export/import (JSON/CSV) for demo reset and customer handoff

## Deployment/ops
- [ ] Production plan: move from ngrok to permanent domain + HTTPS (Caddy/NGINX + Let’s Encrypt)
- [x] Error monitoring: client + server logs with daily rotation (baseline in place via logging; expand in prod plan)
- [x] Backup plan: scheduled DB backups (local + optional cloud) — scripts/backup-db.ps1 (to wire after DB)

## Cleanup
- [x] Run cleanup-report to list unused/large files and approve deletions — scripts/cleanup-report.ps1
- [x] Remove deprecated/legacy scripts after verification — start-all.bat now auto-cleans on launch
- [x] Execute single-script cleanup: powershell -ExecutionPolicy Bypass -File scripts/run-all.ps1 -CleanupOldScripts

## Nice to have
- [ ] One-click “Demo Mode” toggle UI
- [ ] Guided voice scripts for live pitch
- [ ] Quick start doc for customers (2–3 minute setup)

---

Status notes
- Single entry point: start-all.bat (AIO). Internally uses scripts/run-all.ps1 for logic. On launch it cleans legacy helpers, updates SERVER_URL, sets Twilio hooks, starts servers, and runs smoke tests.
