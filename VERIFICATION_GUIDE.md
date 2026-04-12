# Verification Guide

## Output policy

- Final proof screenshots are written to `artifacts/proof`
- JSON verification reports are written to `artifacts/reports`
- Temporary `.tmp*` probe files should stay disposable and can be cleaned after verification

## Baseline

1. Start the app with `run.cmd`
2. For browser-based checks, start a Chrome debug session on port `9224`

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --remote-debugging-port=9224 --user-data-dir="$PWD\.tmp_chrome_debug_profile" 'http://127.0.0.1:9999/'
```

## Individual commands

```powershell
.\.venv_runtime\Scripts\python.exe scripts\api_smoke_verify.py
.\.venv_runtime\Scripts\python.exe scripts\google_smoke_verify.py
.\.venv_runtime\Scripts\python.exe scripts\step7_verify.py
.\.venv_runtime\Scripts\python.exe scripts\step9_verify.py
.\.venv_runtime\Scripts\python.exe scripts\step10_verify.py
```

## Step 8

`step8_verify.py` needs a live connected Google OAuth session in the current Chrome debug profile.

```powershell
.\.venv_runtime\Scripts\python.exe scripts\step8_verify.py
```

Notes:

- The script validates `connected`, `fetch`, `create`, and `disconnect`
- It intentionally ends by disconnecting the app session

## Suite runner

```powershell
.\.venv_runtime\Scripts\python.exe scripts\run_verification_suite.py
```

Behavior:

- Always runs `api_smoke_verify.py` and `google_smoke_verify.py`
- Runs `step7_verify.py`, `step9_verify.py`, and `step10_verify.py` when a CDP browser is available on port `9224`
- Retries a browser verifier once when a transient CDP `Runtime.evaluate timed out` failure occurs
- Skips `step8_verify.py` unless `ONEUL_RUN_STEP8=1` is set

Example:

```powershell
$env:ONEUL_RUN_STEP8='1'
.\.venv_runtime\Scripts\python.exe scripts\run_verification_suite.py
```
