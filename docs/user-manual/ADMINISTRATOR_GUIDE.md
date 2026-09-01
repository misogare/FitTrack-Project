# FitTrack — Administrator Guide

**Audience:** whoever on the team operates and maintains the FitTrack deployment (database, hosting, environment config, user support).

## Scope note — please read first

FitTrack's design has a single actor: **Member**. There is no in-app "Administrator" role, no admin login, and no admin dashboard anywhere in the frontend or backend (`Backend/middleware/auth.js` checks only that a JWT is valid — it never checks a role). "Administrator" here means **the person(s) operating the system**, not a role members can have inside the app.

Everything below is done via direct database access and the Vercel/Railway dashboards, not through the app's UI. If the team decides FitTrack needs a real in-app admin role (e.g. to moderate the food database, or handle password resets without touching the database by hand), that's a design change to raise with the supervisor — see §7.

## 1. System overview

| Component | Technology | Where it runs |
|---|---|---|
| Frontend | React 18 + Vite (static build) | Vercel |
| Backend API | Node.js + Express 4 | Railway |
| Database | MySQL 8 | Railway (or wherever `DATABASE_URL`/`MYSQL_URL` points) |

The two halves communicate over HTTPS; the backend sets an HTTP-only JWT cookie (`fittrack_token`) that the frontend can't read directly, only send back automatically.

## 2. Environment configuration

Backend behaviour is controlled entirely by environment variables (`Backend/.env` locally, or the Railway project's Variables tab in production — **never commit `.env` to git**, it's already gitignored):

| Variable | Purpose |
|---|---|
| `PORT` | Port the API listens on |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection (or `DATABASE_URL`/`MYSQL_URL` on Railway — see `Backend/scripts/setup-db.js` / `config/db.js`) |
| `JWT_SECRET` | Signs/verifies login sessions. Treat as a secret; rotating it logs every user out. |
| `JWT_EXPIRES_IN` | Session lifetime (default `24h`) |
| `BCRYPT_SALT_ROUNDS` | Password hashing cost |
| `NODE_ENV` | `development` / `production` |
| `FRONTEND_URL` | Exact origin allowed by CORS in addition to `*.vercel.app` and `localhost` (see `Backend/server.js`) |

Frontend needs no env vars unless the API isn't at the default URL, in which case set `VITE_API_URL` in `Frontend/.env` (Vercel project settings for production).

## 3. Deploying / redeploying

- **Frontend (Vercel):** pushes to `main` auto-deploy if the Vercel project is linked to the GitHub repo. `Frontend/vercel.json` rewrites all paths to `index.html` so client-side routing survives a page refresh — don't remove that if you touch Vercel config.
- **Backend (Railway):** pushes to `main` auto-deploy similarly. `Backend/scripts/setup-db.js` exists specifically to initialise/repair tables on Railway's MySQL from `init-db.sql` when a fresh database is provisioned — run it (via Railway's shell/one-off command) after standing up a new database.
- **CORS:** if you add another frontend origin (e.g. a new custom domain), update `FRONTEND_URL` in the backend's environment or extend the allow-list in `Backend/server.js` — otherwise the browser will block API calls with a CORS error.

## 4. Database maintenance

- **Schema source of truth:** `Backend/init-db.sql`. It's idempotent (`CREATE TABLE IF NOT EXISTS`), safe to re-run.
- **Demo/reset data:** `cd Backend && npm run seed:demo` creates/resets a demo account (`demo@fittrack.local` / `Demo123!`) with realistic sample data across every feature — useful for testing or a live demo without touching real member data. It's also where small schema migrations for older databases get auto-applied (see `Backend/scripts/seed-demo-user.js`) — check that file before assuming a schema change needs a manual `ALTER TABLE`.
- **Backups:** take a `mysqldump` of the production database on a regular cadence (there is no automated backup job in this codebase yet — this is manual until someone adds one).
- **The built-in exercise library** (`EXERCISE` table) and **built-in foods** (`FOOD` rows with `user_id IS NULL`) are seed content with no create/update/delete API — the only way to add or correct an exercise or a built-in food is a direct `INSERT`/`UPDATE` against the database. Members can add their own custom foods through the app (`FOOD.user_id` set to their id), which don't require admin action.
- **If the database is on Aiven's free plan:** it auto-powers-off after a period with no connections (not deleted — backups are retained and it restarts cleanly). `.github/workflows/keep-alive.yml` pings the backend every 20 minutes specifically to prevent this; if it still happens, see [Troubleshooting Guide §12](TROUBLESHOOTING_GUIDE.md) to power it back on via the Aiven API/console.

## 5. User support tasks (done by direct DB access, since there's no admin UI)

- **User can't log in / forgot password:** there is no self-service password reset (the "Forgot password" screen in the UI does not send an email — see the Troubleshooting Guide). To help someone regain access, either:
  - Ask them to use **Change Password** from their Profile page if they can still log in, or
  - As an administrator, generate a bcrypt hash of a temporary password (matching `BCRYPT_SALT_ROUNDS`) and update that user's `password_hash` directly in the `USER` table, then tell them the temporary password out-of-band and ask them to change it immediately via Profile.
- **User wants their data deleted / account removed:** they can do this themselves from Settings (`Delete all my data` keeps the login; `Delete my account` removes everything, cascading via foreign keys with `ON DELETE CASCADE`). Only intervene directly in the database if they've lost access and can't do it themselves.
- **Investigating a bug report:** cross-reference the user's `user_id` (from the `USER` table by email) against `WORKOUT`, `MEAL`, `GOAL`, etc. to see what they actually logged, rather than guessing.

## 6. Monitoring

- **Health check:** `GET /api/health` returns `{ "status": "ok", "timestamp": ... }` — point uptime monitoring at this.
- **Logs:** Railway's dashboard shows backend stdout/stderr (uncaught errors flow through `Backend/middleware/errorHandler.js`); Vercel's dashboard shows frontend build/runtime logs.
- **Common failure signatures** are catalogued in the [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md).

## 7. Security & privacy responsibilities

- Never commit `.env`, database credentials, or `JWT_SECRET` to the repository or share them in chat/email in plain text. If a credential is ever exposed that way, rotate it immediately rather than assuming it's fine.
- Only administrators (not members) can reach the database directly — keep the number of people with production DB/Railway/Vercel access small and know who they are.
- Members control their own data via Settings (export/delete); as administrator, don't access or export another member's personal data except to resolve a specific support request they raised.
- **Known gap to flag to the team/supervisor:** because there's no in-app admin role, every support action above is a manual, unaudited database edit. If FitTrack needs to scale past "a few teammates administering it by hand," the next design iteration should add a real `role` column on `USER` and admin-gated endpoints (e.g. an admin-triggered password reset, and CRUD for the exercise/food library) instead of direct DB access.
