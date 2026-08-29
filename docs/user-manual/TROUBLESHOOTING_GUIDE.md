# FitTrack — Troubleshooting Guide

For each issue: **Symptom**, **Possible causes**, **Recommended steps**, **Solution**, and **Root-cause analysis & prevention**. Issues are grouped for members first, then administrators/developers.

---

## For members

### 1. "I can't reset my forgotten password — nothing arrives"

- **Possible causes:** the "Forgot password" screen in FitTrack is UI-only right now; the backend has no password-reset endpoint yet (`Backend/routes/auth.js` has no reset route), so no email is ever sent regardless of what you enter.
- **Recommended steps:** confirm you're not simply mistyping the email; then stop waiting for an email — it will not arrive.
- **Solution:** if you still know your current password, log in and use **Change Password** on the Profile page instead. If you're fully locked out, contact your team's administrator to have your password reset directly in the database (see Administrator Guide §5), then change it yourself via Profile immediately after.
- **Root cause & prevention:** the reset-email flow was built on the frontend ahead of the backend feature. Prevention: track this as a known limitation (it already is, in `CLAUDE.md` and the Administrator Guide) and prioritise a real `POST /api/auth/forgot-password` + emailed token flow before relying on self-service reset for real users.

### 2. Login says "Session expired. Please log in again."

- **Possible causes:** your JWT cookie expired (sessions last `JWT_EXPIRES_IN`, default 24h) — this is expected after a day of inactivity; less commonly, the server's `JWT_SECRET` was changed/rotated, which invalidates every existing session at once.
- **Recommended steps:** just try logging in again first.
- **Solution:** log in again with your email and password.
- **Root cause & prevention:** normal token expiry needs no fix. If this happens to *everyone* at once, the cause is a `JWT_SECRET` change on the backend — administrators should treat that as a deliberate, rare action (e.g. suspected key compromise), not a routine one, since it force-logs-out all members.

### 3. Registering says my email is already used, but I've never signed up

- **Possible causes:** you (or a teammate seeding demo/test data) already registered that email previously; `USER.email` is a unique column, so duplicates are rejected by design.
- **Recommended steps:** try logging in with that email instead of registering; use "forgot password" limitations from Issue 1 if you don't know the password.
- **Solution:** use a different email, or recover the existing account.
- **Root cause & prevention:** working as designed (prevents duplicate accounts) — no fix needed, just clearer messaging if this is confusing in practice.

### 4. The barcode scanner won't open my camera / does nothing when I try to scan a food

- **Possible causes:** the browser blocked camera permission; the site isn't served over HTTPS (browsers refuse camera access on plain HTTP for non-localhost origins); or the device has no camera.
- **Recommended steps:** check the browser's address-bar permission icon and allow camera access; confirm you're on `https://` (production) or `localhost` (local dev) — not `http://` on a real domain; try a different device/browser if it still fails.
- **Solution:** grant camera permission, or fall back to the manual food search instead of scanning.
- **Root cause & prevention:** this is a browser security requirement (camera access needs a "secure context"), not a FitTrack bug. Always deploy behind HTTPS in production (Vercel does this by default) so scanning works for everyone.

### 5. A workout/meal/goal I logged isn't showing on the Dashboard

- **Possible causes:** the entry was logged with the wrong date (e.g. yesterday instead of today, so it's outside the Dashboard's "today/this week" window); or the save actually failed silently (check for a validation error message you may have missed).
- **Recommended steps:** open Workouts/Nutrition/Goals directly and confirm the entry exists and has the date you expect; re-check the date field when logging.
- **Solution:** edit the entry's date if it's wrong; re-submit if it never actually saved.
- **Root cause & prevention:** the Dashboard deliberately windows by date so it stays relevant — always double-check the date field when logging, especially when logging something after midnight or for a previous day.

---

## For administrators / developers

### 6. CORS error in the browser console ("blocked by CORS policy")

- **Possible causes:** the frontend origin you're using doesn't match `FRONTEND_URL` on the backend, isn't `localhost`, and isn't a `*.vercel.app` domain — the only three cases `Backend/server.js` allows.
- **Recommended steps:** check the exact origin shown in the browser error against the backend's `FRONTEND_URL` env var; check for trailing-slash or `http` vs `https` mismatches, which count as different origins.
- **Solution:** set `FRONTEND_URL` on the backend to the exact frontend origin in use (protocol + host, no trailing slash), or, for a new custom domain, add it to the allow-list logic in `Backend/server.js` and redeploy the backend.
- **Root cause & prevention:** CORS is intentionally strict here to stop arbitrary sites from calling the API with a member's cookie. Prevention: whenever a new frontend URL/domain goes live, update `FRONTEND_URL` on the backend in the same change.

### 7. `ER_ACCESS_DENIED_ERROR` when running `npm run seed:demo` or starting the backend

- **Possible causes:** wrong `DB_USER`/`DB_PASSWORD` in `Backend/.env`; MySQL user lacks privileges on the `fittrack` database.
- **Recommended steps:** confirm you can `mysql -u <DB_USER> -p` manually with the same credentials; check for typos/extra whitespace in `.env`.
- **Solution:** fix the credentials in `.env`, or grant the user privileges on `fittrack` (`GRANT ALL ON fittrack.* TO 'user'@'localhost';`).
- **Root cause & prevention:** almost always a copy-paste/env mismatch. Prevention: keep a per-environment `.env` checklist and never share one `.env` across local/staging/production.

### 8. `ER_BAD_DB_ERROR: Unknown database 'fittrack'`

- **Possible causes:** `Backend/init-db.sql` was never run against this MySQL instance (common right after a fresh local install, or a freshly provisioned Railway database).
- **Recommended steps:** confirm the database exists: `SHOW DATABASES;` in a MySQL client.
- **Solution:** run `mysql -u root -p < Backend/init-db.sql` locally, or run `Backend/scripts/setup-db.js` against a fresh Railway database (see Installation Guide §B.1.4).
- **Root cause & prevention:** schema setup is a manual step, not automatic on deploy. Prevention: always run the schema/setup script as part of standing up a *new* database, before the app's first boot against it.

### 9. Login works locally but fails (or cookie never sticks) in production

- **Possible causes:** the frontend (Vercel) and backend (Railway) are on different domains, so the auth cookie needs correct cross-site cookie attributes; `FRONTEND_URL` not matching the real Vercel URL; mixed HTTP/HTTPS between the two.
- **Recommended steps:** check the `Set-Cookie` header on the login response in browser dev tools for `Secure`/`SameSite` attributes; confirm both frontend and backend are served over HTTPS; re-check `FRONTEND_URL`.
- **Solution:** this class of bug was already hit and fixed once in this project (see git history: "Fix cross-site auth cookies for Railway + Vercel deployment") — if it recurs after a config change, revisit that commit's approach before re-deriving a fix from scratch.
- **Root cause & prevention:** cross-site cookies are inherently fragile (browser cookie policies tightened significantly across recent years) — prevention is to test the full login flow against the real production URLs (not just localhost) after any change to `FRONTEND_URL`, cookie settings, or hosting provider.

### 10. Refreshing a page like `/dashboard` or `/goals` on the deployed site shows a 404

- **Possible causes:** the hosting platform is trying to find a literal file/route matching the URL, but this is a client-side-routed single-page app — only `index.html` actually exists as a static file.
- **Recommended steps:** confirm `Frontend/vercel.json` is present and deployed with the SPA rewrite rule (`/(.*) → /index.html`).
- **Solution:** restore/deploy that rewrite rule if missing; this exact bug was already fixed once (see git history: "Add Vercel SPA rewrite rule to fix 404 on page refresh").
- **Root cause & prevention:** standard SPA-hosting gotcha. Prevention: don't remove `vercel.json` when touching Vercel config, and if migrating off Vercel, replicate the same "rewrite everything to `index.html`" rule on the new host.

### 11. Port `5000` or `5173` already in use when starting a dev server

- **Possible causes:** a previous `npm run dev` process is still running; another app is using the same port.
- **Recommended steps:** check for a lingering process (`lsof -i :5000` / `lsof -i :5173` on macOS/Linux) before assuming it's a code problem.
- **Solution:** stop the conflicting process, or change `PORT` in `Backend/.env` (and update `FRONTEND_URL`/`VITE_API_URL` to match) / pass Vite a different port.
- **Root cause & prevention:** environment collision, not a bug. Prevention: always stop dev servers cleanly (Ctrl+C) rather than closing the terminal window.

### 12. `npm run seed:demo` "undid" data I was manually testing with

- **Possible causes:** the seeder is intentionally idempotent — re-running it **deletes and re-creates** the demo user's sample data, by design, so the demo account resets to a known-good state.
- **Recommended steps:** check whether the data you lost belonged to the `demo@fittrack.local` account specifically, versus your own separately-registered test account (which the seeder never touches).
- **Solution:** for manual testing you want to keep, always use your own registered account, not the shared demo account.
- **Root cause & prevention:** working as designed. Prevention: document this clearly for the team (now done, here and in the Administrator Guide) so no one is surprised by it again.
