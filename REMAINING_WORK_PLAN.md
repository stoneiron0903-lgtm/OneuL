# Oneul Remaining Work Plan

## Final State On 2026-04-12

- The planned recovery and verification scope is complete.
- Step 7, Step 8, Step 9, and Step 10 all passed in the final verified baseline.
- `scripts/run_verification_suite.py` is the standard rerun entry point.
- Final proof screenshots live under `artifacts/proof`.
- JSON verification reports live under `artifacts/reports`.
- `VERIFICATION_GUIDE.md` is the current execution guide.
- Historical sections below are kept as an execution log and safe-resume record.

## Current Baseline

- Recovery steps 1-6 are treated as completed as of `2026-04-10`.
- The current safe baseline is the live workspace state of:
  - `web/app.js`
  - `web/index.html`
  - `web/styles.css`
  - `backend/main.py`
  - `backend/local_alarm_store.py`
  - `backend/google_calendar.py`
  - `backend/weather_service.py`
- Do not replace `web/app.js` wholesale from old snapshots.
- Continue with small, local patches only.

## Observed State On 2026-04-11

- Step 7 is completed with Chrome-based proof capture.
- Step 8 backend and OAuth preflight checks are complete, but the live connected-session roundtrip is still blocked on manual Google login/consent in the browser.
- Step 9 fallback-mode weather verification is completed.
- Step 10 interaction sweep is completed.
- Google Calendar config variables are present in `.env`, so Step 8 can resume immediately once the browser session is authorized.
- `KMA_SERVICE_KEY` and `AIRKOREA_SERVICE_KEY` are not currently present in `.env`, so Step 9 should be verified in fallback mode first.
- The worktree contains many temporary logs, browser profiles, and probe artifacts; broad cleanup stays deferred until Step 11.

## Session Start Routine

1. Run `git status --short --branch` and confirm no unexpected new damage exists.
2. Start the app with `run.cmd` or:

```powershell
.\.venv_runtime\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 9999
```

3. Open `http://127.0.0.1:9999`.
4. Confirm the baseline before any new edit:
   - main screen renders
   - `Td` enters today focus
   - day stack opens
   - no immediate freeze on first load
5. Save new proof files with a stable naming rule:
   - `verify-step7-*.png`
   - `verify-step8-google-*.png`
   - `verify-step9-weather-*.png`
   - `verify-step10-interaction-*.png`

## Immediate Next Run

1. Resume the Chrome debug session on port `9224` and complete Google login/consent.
2. Verify the live connected Step 8 path:
   - connected button state
   - event fetch
   - event create
   - disconnect
3. Append the Step 8 result under `Step 8 Log`.
4. Finish Step 11 cleanup and freeze:
   - separate proof artifacts from disposable `.tmp*`
   - run `git diff --stat`
   - run `git diff --check --`
   - record the latest safe resume point

## Execution Rules

1. Finish exactly one step at a time.
2. Do not start the next step until the current step has proof files and a short written result.
3. If a step breaks the baseline, stop and repair the baseline before continuing.
4. If a step needs Google credentials or external service keys, record the blocked state explicitly instead of guessing.
5. Prefer verification-first work: reproduce, patch, verify, then freeze.

## Remaining Steps

## Step 7: Full Regression Sweep

### Goal

- Convert the current restored state into a verified baseline instead of an assumed baseline.

### Scope

- Main render
- Today focus enter and exit
- Day stack open and close
- Month rail click toggle
- Right-click step-down behavior
- Alarm create, edit, delete
- Refresh persistence
- Wake/sleep persistence
- Status bar rendering

### Suggested Output

- `verify-step7-home.png`
- `verify-step7-today-focus.png`
- `verify-step7-day-stack.png`
- `verify-step7-month-toggle.png`
- `verify-step7-context-back.png`
- `verify-step7-alarm-roundtrip.png`

### Done Criteria

- Every item in scope is manually verified once.
- Any failing item is turned into a named subtask before moving on.
- A short result note is appended under `Step 7 Log`.

## Step 8: Google Calendar Roundtrip Verification

### Goal

- Verify that the existing Google integration still works in the restored app.

### Preconditions

- `.env` or process env contains:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `ONEUL_SESSION_SECRET`
  - `GOOGLE_REDIRECT_URI`

### Scope

- `/api/google/status` response
- Google status button state
- Connect flow entry
- Event fetch
- Event create
- Disconnect flow
- Behavior when Google is not configured

### Suggested Output

- `verify-step8-google-status.png`
- `verify-step8-google-connected.png`
- `verify-step8-google-create.png`
- `verify-step8-google-disconnect.png`

### Done Criteria

- Configured state and unconfigured state are both understood.
- If OAuth cannot be completed in-session, the exact blocker is recorded.
- Any frontend or backend mismatch becomes its own fix task before Step 9.

## Step 9: Weather and Air Quality Resilience

### Goal

- Verify that the weather drawer and ticker behave correctly both with and without Korea-specific API keys.

### Scope

- Initial loading text
- Fallback weather response path
- Ticker text rendering
- Drawer open and close
- Error handling copy
- Refresh behavior

### Suggested Output

- `verify-step9-weather-ticker.png`
- `verify-step9-weather-drawer.png`
- `verify-step9-weather-fallback.png`

### Done Criteria

- The app is usable without KMA and AirKorea keys.
- Optional enhanced mode is either verified or clearly marked blocked.
- No broken text or empty drawer state remains.

## Step 10: Interaction Stabilization

### Goal

- Sweep the high-risk interaction paths that were not part of the first six recovery steps.

### Scope

- Refresh-view restore behavior
- Hover guide behavior
- Inline alarm editor multi-step flow
- Day stack focus retention
- Keyboard handling for month rail and menu
- Zoom and back-navigation transitions

### High-Risk Files

- `web/app.js`
- `web/styles.css`
- `web/index.html`

### Suggested Output

- `verify-step10-refresh-view.png`
- `verify-step10-inline-editor.png`
- `verify-step10-keyboard-month-rail.png`
- `verify-step10-zoom-backflow.png`

### Done Criteria

- No obvious interaction dead-end remains.
- Keyboard and pointer behavior do not conflict.
- Any remaining issues are small and isolated enough for normal bug-fix passes.

## Step 11: Cleanup and Freeze

### Goal

- End with a reproducible, reviewable state instead of another exploratory workspace.

### Scope

- `git diff --stat`
- `git diff --check --`
- update `RECOVERY_PLAN.md` completion notes if new fixes landed
- create one fresh backup snapshot before any broad cleanup
- separate proof artifacts from disposable temp files

### Done Criteria

- Current state can be resumed without re-discovery.
- The latest safe snapshot location is written down.
- Remaining bugs, if any, are listed as a short backlog.

## Step Contract

Use this template each time a step starts:

```text
Step:
Goal:
Files expected to change:
Verification evidence to capture:
Stop condition:
```

Use this template each time a step ends:

```text
Result:
Changed files:
Proof files:
Open issues:
Next step:
```

## Step 7 Log

- `2026-04-11`: In progress.
- Existing proof files:
  - `verify-step7-home.png`
  - `verify-step7-today-focus.png`
- Remaining proof files to capture:
  - `verify-step7-day-stack.png`
  - `verify-step7-month-toggle.png`
  - `verify-step7-context-back.png`
  - `verify-step7-alarm-roundtrip.png`
- Next action:
  - run `.\.venv_runtime\Scripts\python.exe scripts\step7_verify.py`
  - store the JSON pass/fail result
  - append any failing checks as separate fix tasks before Step 8
- Additional note:
  - API-level smoke checks passed for root HTML skeleton and local alarm persistence.
  - Current blocker is browser automation on Edge `146.0.3856.109`: browser-level CDP responds, but page/session commands do not return usable responses in this environment, so fresh Step 7 proof capture is still blocked.
  - Observed local symptom: `msedge.exe` application error with exception code `0x80000003`.
  - Practical fallback for Step 7 is manual browser verification and manual screenshot capture unless a different automation stack is installed.
- `2026-04-11` automated verification recovery:
  - switched Step 7 automation to an existing Chrome GUI debug session on port `9224`
  - fixed `statusNowBtn` first-open behavior in `web/app.js`
  - fixed `focusDateInDayStack()` references to day-stack-local functions in `web/app.js`
  - stabilized month rail timing in `scripts/step7_verify.py`
- `2026-04-11` final result:
  - `scripts/step7_verify.py` passed
  - proof files:
    - `verify-step7-home.png`
    - `verify-step7-today-focus.png`
    - `verify-step7-context-back.png`
    - `verify-step7-day-stack.png`
    - `verify-step7-month-toggle.png`
    - `verify-step7-alarm-roundtrip.png`

## Step 8 Log

- Ready after Step 7 freeze.
- Google OAuth-related variables are already present in `.env`.
- Expected blocker is manual OAuth interaction and browser/session state, not missing config.
- `2026-04-11` API smoke:
  - `/api/google/status` returned `configured=true`, `connected=false`, `writable=false`, `calendarId=primary`
- `2026-04-11` OAuth preflight:
  - `/auth/google/start` produced a Google OAuth redirect with expected query keys:
    - `client_id`
    - `redirect_uri`
    - `response_type`
    - `scope`
    - `access_type`
    - `include_granted_scopes`
    - `prompt`
    - `state`
  - `/auth/google/callback` without `code` or `state` redirected to `/?google=error`
  - `/api/google/events` returned `401` while disconnected
  - `POST /api/google/events` returned `401` while disconnected
  - `POST /api/google/disconnect` returned the expected disconnected payload
  - Separate temp server verification confirmed unconfigured mode:
    - `/api/google/status` returned `configured=false`
    - `/auth/google/start` returned `503` with `Google Calendar is not configured.`
- Remaining manual work for Step 8:
  - none after the final rerun completed
- Current live browser state:
  - the app returns to `connected=false` at the end of the verifier because the final check intentionally calls disconnect
- Automation status:
  - `scripts/step8_verify.py` is ready
  - current disconnected run returns `google_not_connected` and captures `verify-step8-google-status.png`
  - once login/consent is finished, the same script will verify:
    - connected UI state
    - live event fetch
    - event create
    - disconnect
- `2026-04-11` live roundtrip verification:
  - Google OAuth consent produced a live connected session
  - connected UI state passed
  - event fetch passed
  - event create passed
  - disconnect passed
  - initial remaining failure was verifier-side:
    - created event existed in app state
    - the verifier only checked `.alarm-line.google-event`
    - today-focus rendering uses `.dayStackAlarmLine.google-event` and may also bundle entries
  - `scripts/step8_verify.py` was updated to treat both direct Google event lines and bundled day-stack layout inclusion as visible UI
- Current rerun state:
  - the app is back to `connected=false` after the verification disconnect step
  - the patched verifier rerun passed end-to-end
- `2026-04-11` final rerun:
  - `scripts/step8_verify.py` passed
  - proof files:
    - `verify-step8-google-status.png`
    - `verify-step8-google-connected.png`
    - `verify-step8-google-create.png`
    - `verify-step8-google-disconnect.png`
  - final verification notes:
    - initial connected state was confirmed
    - fetch returned `276` items for the requested range
    - create returned a live event and the event was visible in UI
    - disconnect returned the expected disconnected payload and UI state

## Step 9 Log

- Fallback verification is ready.
- Enhanced Korea-provider verification is blocked until `KMA_SERVICE_KEY` and `AIRKOREA_SERVICE_KEY` are supplied.
- `2026-04-11` API smoke:
  - `/api/weather/status?latitude=37.5665&longitude=126.9780` returned `200`
  - provider was `open-meteo` for both weather and air
  - fallback line was non-empty
- `2026-04-11` UI verification:
  - `scripts/step9_verify.py` passed using Chrome debug session
  - ticker text rendered with non-empty weather line
  - drawer open/close state worked
  - fallback provider remained `open-meteo` for both weather and air
  - proof files:
    - `verify-step9-weather-ticker.png`
    - `verify-step9-weather-drawer.png`
    - `verify-step9-weather-fallback.png`

## Step 10 Log

- `2026-04-11` verification:
  - `scripts/step10_verify.py` passed using the Chrome debug session
  - refresh-view restore behavior passed
  - inline editor step flow and cancel behavior passed
  - keyboard month rail Enter/Space toggle passed
  - zoom/backflow transitions passed
  - proof files:
    - `verify-step10-refresh-view.png`
    - `verify-step10-inline-editor.png`
    - `verify-step10-keyboard-month-rail.png`
    - `verify-step10-zoom-backflow.png`
- Verification note:
  - one temporary failure was traced to the verifier targeting a different month rail after rerender, not an app-side keyboard bug

## Step 11 Log

- `2026-04-11` preflight:
  - `git diff --stat` shows the expected large restored-app delta centered on `web/app.js`, `web/styles.css`, and `web/index.html`
  - `git diff --check --` returned no whitespace or patch-format errors; only CRLF warnings were emitted
  - current proof inventory includes `28` `verify-*.png` files
  - current disposable-artifact inventory includes `105` `.tmp*` entries, of which `26` are directories
- Remaining work:
  - separate proof artifacts from disposable `.tmp*` files and browser profile folders
  - record the latest safe resume point after cleanup policy is chosen
- `2026-04-11` cleanup result:
  - final proof screenshots were moved to `artifacts/proof`
  - retained proof count: `17`
  - probe-only `verify-*` artifacts were removed
  - root `.tmp*` count is now `0`
  - `web/.tmp*` count is now `0`
  - the Chrome debug session on port `9224` was stopped as part of profile cleanup
- Latest safe resume point:
  - verification-complete baseline with Step 7, Step 8, Step 9, and Step 10 all passed
  - proof screenshots live under `artifacts/proof`
  - JSON verification reports live under `artifacts/reports`
  - `scripts/run_verification_suite.py` is the standard rerun entry point
  - `VERIFICATION_GUIDE.md` documents the smoke/browser/OAuth flow
  - next resume command for the app is `run.cmd`
  - if Google verification must be rerun later, a fresh Chrome debug session and OAuth consent will be needed because the Step 8 verifier ends with disconnect
