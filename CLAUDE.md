# FitTrack — Project Context

**Course:** NIT6150 Advanced Project, Victoria University (VU Melbourne)
**Client / Supervisor:** Dr. Kevin Wang · **Coordinator:** Dr. Alex Wenjie
**Team:** Sedem Kumatse (s8139635, lead), Aria Shobeiri (s4633682), Nyoman Krisna Mahardika (s8182421), Gurdas Singh (s8198845)
**Repo:** https://github.com/misogare/FitTrack-Project (default branch `main`)

> ⚠️ Superseded doc: an earlier Claude.ai planning session produced a handoff describing FitTrack at the *design-only* stage (5-entity ERD, FR-1–FR-10, "no code written yet"). **That is out of date.** The repo already contains a complete, deployed full-stack implementation with a larger schema and feature set than that plan. This file reflects the actual current state; treat the old handoff only as historical background for the written report (see "Academic deliverables" below), not as a description of the codebase.

## 1. What FitTrack actually is right now

A full-stack fitness/wellness tracker, two separate Node.js projects talking over REST:

- **`Backend/`** — Express 4 + MySQL (`mysql2`) REST API. JWT auth in an HTTP-only cookie (`fittrack_token`), bcrypt password hashing, `express-validator` input validation.
- **`Frontend/`** — React 18 + Vite 5 SPA, React Router 6, Tailwind CSS 4, `lucide-react` icons, `@zxing/library` for barcode scanning.

**Deployed:** Frontend on Vercel (SPA rewrite in `Frontend/vercel.json`), backend on Railway (`Backend/scripts/setup-db.js` initializes tables there; CORS in `Backend/server.js` allows `*.vercel.app` + `FRONTEND_URL` + localhost). Cross-site cookie auth between the two hosts has already been fixed (see git log).

Single actor throughout: **Member** only. There is no admin/role concept anywhere in the schema or middleware (`Backend/middleware/auth.js` just verifies the JWT, no role check) — still an open question if an Administrator Guide is required (see Section 4).

## 2. Local dev

```bash
# Backend
cd Backend && npm install
cp .env.example .env   # NOTE: no .env.example is committed (gitignored) — recreate from README vars below
npm run dev             # http://localhost:5000, node --watch

# Frontend
cd Frontend && npm install
npm run dev              # http://localhost:5173
```

Backend `.env` vars (from README, none committed): `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `NODE_ENV`, `FRONTEND_URL`.

- Create schema: `mysql -u root -p < Backend/init-db.sql` (idempotent, `CREATE ... IF NOT EXISTS`).
- Seed demo data: `cd Backend && npm run seed:demo` → demo login `demo@fittrack.local` / `Demo123!` (idempotent, safe to re-run).
- Health check: `GET /api/health`.
- Frontend needs no `.env` unless the backend isn't at `http://localhost:5000/api` (then set `VITE_API_URL`).

Full details/troubleshooting: `README.md` at repo root.

## 3. Data model (actual — 13 tables, `Backend/init-db.sql`)

Beyond the original 5-entity plan, the live schema also has: `SETTINGS`, `WORKOUT_PLAN`, `WORKOUT_PLAN_ITEM`, `EXERCISE`, `PLAN_EXERCISE`, `BODY_METRIC`, `FOOD`, `WATER_LOG` — supporting workout plans/exercise library, food database with barcode lookup, water intake, and body metrics/BMI, in addition to `USER`, `WORKOUT`, `MEAL`, `GOAL`, `GOAL_PROGRESS`. Treat `Backend/init-db.sql` as the source of truth for schema, not the old ERD.

## 4. API surface (`Backend/routes/*.js`, all under `/api`, cookie-auth except `/auth`)

| Area | Base path |
|---|---|
| Auth/profile | `/api/auth` |
| Dashboard | `/api/dashboard` |
| Workouts | `/api/workouts` |
| Plans + exercise library | `/api/plans` (`/plans/exercises/*`) |
| Meals | `/api/meals` |
| Nutrition (goals, water) | `/api/nutrition` |
| Foods (search, barcode) | `/api/foods` |
| Goals + progress | `/api/goals` |
| Body metrics | `/api/body-metrics` |
| Settings (privacy, export, delete) | `/api/settings` |

## 5. Academic deliverables status

Two report deliverables were completed in an earlier planning phase and are represented in `project_structure.md` (Part 2 — System Analysis and Design Report: development-approach justification, FR-1–FR-10, ERD, use cases). Treat `project_structure.md` as the report text; treat the live code/schema as the implementation, which has since outgrown that report's scope — worth flagging to the team when the report is next revised.

Rubric weighting (group-wide): System Development Approach 10%, System Design and Analysis 25%, Project Management 25%, Project Documentation 10%, References 10%, Individual Assessment 5%.

## 6. Outstanding tasks

1. ~~User Manual~~ — done, see `docs/user-manual/` (User Guide, Administrator Guide — scoped to devops/maintenance since no in-app admin role exists, Installation Guide, Troubleshooting Guide).
2. **Custom domain** — not configured yet. Recommended: GitHub Student Developer Pack → Namecheap free `.me` domain (1 year free, ~US$4.88+ICANN/yr after), pointed at the existing Vercel deployment. Needs a team member to actually register it (requires their own identity/payment) — Claude can't do this step, only advise + help wire up DNS once registered.
3. ~~Actual implementation~~ — done; see Section 1. Remove this from any report language that still says otherwise.

## 7. Explicit exclusions (still valid)

Wearable/device integration (Fitbit, Garmin, Apple Health), native mobile app, AI-generated meal recognition or training plans, payment/e-commerce features.

## 8. Security note

Never commit credentials/tokens/`.env` to this repo (already gitignored). If a plaintext GitHub password was ever pasted into a chat session, treat it as compromised and rotate it — don't rely on it still being secret. Only complete GitHub OAuth device-flow sign-ins by clicking through your own local VS Code, never via a pasted link.
