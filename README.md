# Oneul

This workspace contains the existing web timeline app served by `uvicorn backend.main:app`.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Google Calendar

Create `.env` from `.env.example` or set these environment variables before starting the server if you want Google Calendar sync and direct event creation:

```powershell
$env:GOOGLE_CLIENT_ID="your-client-id"
$env:GOOGLE_CLIENT_SECRET="your-client-secret"
$env:ONEUL_SESSION_SECRET="long-random-secret"
$env:GOOGLE_REDIRECT_URI="http://127.0.0.1:9999/auth/google/callback"
```

Optional:

```powershell
$env:GOOGLE_CALENDAR_ID="primary"
```

For upgraded Korea-focused weather and air quality, set these optional variables. If they are missing, the app falls back to Open-Meteo:

```powershell
$env:KMA_SERVICE_KEY="your-kma-service-key"
$env:AIRKOREA_SERVICE_KEY="your-airkorea-service-key"
```

For a local OAuth client, set the authorized redirect URI to the same value as `GOOGLE_REDIRECT_URI`:

```text
http://127.0.0.1:9999/auth/google/callback
```

If you open the app with `http://localhost:9999`, register that exact callback URI instead or change `GOOGLE_REDIRECT_URI` to match.

If you previously connected the app before Google write support was added, reconnect once so the new event-write scope is granted.

## Run Web Timeline

```powershell
.\run.cmd
```

Open `http://127.0.0.1:9999` in your browser.

For reload mode during development:

```powershell
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 9999
```
