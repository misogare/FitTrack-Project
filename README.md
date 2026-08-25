# FitTrack — Web-Based Fitness & Wellness Tracking System

FitTrack is a full-stack web application for tracking fitness and wellness: logging workouts, recording meals and nutrition, setting goals and monitoring progress, following workout plans, and viewing a live dashboard of all of it. It is developed as part of the **NIT6150 Advanced Project** (VU Melbourne).

The app is built as two separate Node.js projects that talk to each other over a REST API:

- **`Backend/`** — Express + MySQL REST API (JWT auth, workouts, meals, goals, plans, nutrition, body metrics, settings).
- **`Frontend/`** — React + Vite single-page application (Tailwind-styled, responsive).

---

## ✨ Features

- **Authentication** — Register, login/logout, JWT sessions in an HTTP-only cookie, bcrypt password hashing, change password.
- **Profile management** — Edit personal details (name, date of birth, gender, height, weight, fitness level), avatar colour, member stats.
- **Dashboard** — Weekly activity chart, nutrition ring, active goals with progress bars, stat cards.
- **Workout / activity tracking** — Log workouts with type, duration, intensity, calories and distance; view history; daily summary.
- **Workout plans** — Active/paused/completed plans with daily sessions, an exercise library, plan stats, and start-a-workout flow.
- **Nutrition tracking** — Log meals (breakfast/lunch/dinner/snack), search a food database (with barcode lookup), set macro/calorie goals, log water intake.
- **Goals** — Create goals (weight, steps, runs, etc.), record progress, track completion percentage over time.
- **Analytics** — Body metrics (weight / BMI / body fat / measurements) and distance tracking over time.
- **Settings & privacy** — Daily step/minutes/hydration goals, data sharing toggles, data export, delete-all-data, delete account.

---

## 🧰 Tech Stack

| Layer     | Technology                                             |
|-----------|--------------------------------------------------------|
| Backend   | Node.js, Express 4, MySQL 8 (mysql2), JWT, bcryptjs, express-validator |
| Frontend  | React 18, Vite 5, React Router 6, Tailwind CSS 4, lucide-react |
| Database  | MySQL (schema in `Backend/init-db.sql`)                 |

---

## 📁 Repository Structure

```
├── Backend/
│   ├── server.js              # Express app entry point
│   ├── init-db.sql            # Database + table creation script
│   ├── config/db.js           # MySQL connection pool
│   ├── controllers/           # Route handlers
│   ├── routes/                # API route definitions
│   ├── middleware/            # Auth (JWT) + error handling
│   ├── utils/validators.js    # express-validator schemas
│   ├── scripts/seed-demo-user.js   # Demo data seeder
│   └── .env.example           # Copy to .env and fill in
└── Frontend/
    ├── src/pages/             # Dashboard, Workouts, Nutrition, Goals, Plans, Analytics, Profile, Settings…
    ├── src/components/        # Navbar, Sidebar, shared UI
    ├── src/services/api.js    # Frontend API client
    ├── src/context/AuthContext.jsx
    └── vite.config.js
```

---

## ✅ Prerequisites

- **Node.js 18+** (Vite 5 requirement) and npm
- **MySQL 8.x** running locally (the app uses the `mysql2` driver)
- Git (to clone the repo)

---

## 🚀 Getting Started

### 1. Install dependencies

Open two terminals — one for the backend, one for the frontend.

```bash
# Backend
cd Backend
npm install

# Frontend (separate terminal)
cd Frontend
npm install
```

### 2. Configure the backend environment

```bash
cd Backend
cp .env.example .env
```

Then edit `Backend/.env` and set your MySQL credentials:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fittrack
JWT_SECRET=change_this_secret_key        # change to any long random string
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

> The frontend needs **no `.env` file** — it calls the backend at `http://localhost:5000/api` by default. If your backend runs elsewhere, create `Frontend/.env` with `VITE_API_URL=http://localhost:5000/api`.

### 3. Create the database

Run the schema script against MySQL (this creates the `fittrack` database and all tables):

```bash
cd Backend
mysql -u root -p < init-db.sql
```

Enter your MySQL password when prompted. You should see no errors — the script uses `CREATE DATABASE IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS`, so it is safe to run more than once.

### 4. Seed demo data (recommended for testing)

The backend ships with a seeder that creates a **demo user** plus a full set of realistic data (workouts, meals, goals, plans, food database, water logs, body metrics) so every page has something to show.

```bash
cd Backend
npm run seed:demo
```

You should see output like:

```
✓ FitTrack demo account is ready.
  Email:    demo@fittrack.local
  Password: Demo123!
```

**Demo credentials to log in with:**

| Field    | Value               |
|----------|---------------------|
| Email    | `demo@fittrack.local` |
| Password | `Demo123!`            |

The seeder is **idempotent** — running it again updates the demo user and resets their demo data (deleting and re-creating the sample workouts, meals, goals, etc.), so you can re-run it any time to get back to a clean, populated state. It also auto-applies small schema migrations for databases created before newer tables/columns existed.

### 5. Start the servers

```bash
# Terminal 1 — backend API on http://localhost:5000
cd Backend
npm run dev

# Terminal 2 — frontend on http://localhost:5173
cd Frontend
npm run dev
```

Open **http://localhost:5173** in your browser, log in with the demo credentials above, and explore.

- Backend health check: `GET http://localhost:5000/api/health` → `{ "status": "ok" }`
- The backend already allows the frontend origin (`http://localhost:5173`) via CORS by default.

---

## 🔌 API Overview

All endpoints are under `/api` and, except for auth, require the session cookie set at login.

| Area          | Base path            | Examples |
|---------------|----------------------|----------|
| Auth / profile| `/api/auth`           | `POST /register`, `POST /login`, `GET|PUT /profile`, `POST /change-password`, `DELETE /account` |
| Dashboard     | `/api/dashboard`      | `GET /` |
| Workouts      | `/api/workouts`       | `GET /`, `POST /`, `PUT|DELETE /:id`, `GET /daily-summary` |
| Plans         | `/api/plans`          | `GET /`, `GET /active`, `POST /`, `GET /:id/stats`, `POST /:itemId/start`, exercise library under `/plans/exercises/*` |
| Meals         | `/api/meals`          | `GET /`, `POST /`, `DELETE /:id` |
| Nutrition     | `/api/nutrition`      | `GET|PUT /goals`, `GET|POST /water`, `DELETE /water/:id` |
| Foods         | `/api/foods`          | `GET /?q=…`, `GET /barcode/:code`, `POST /`, `DELETE /:id` |
| Goals         | `/api/goals`          | `GET /`, `POST /`, `PUT|DELETE /:id`, `POST /progress`, `GET /:id/progress` |
| Body metrics  | `/api/body-metrics`   | `GET /`, `POST /`, `DELETE /:id` |
| Settings      | `/api/settings`       | `GET /`, `PUT /` |

---

## 🧪 Testing / Developing

- **Reset demo data at any time:** `cd Backend && npm run seed:demo` (safe to re-run).
- **Backend dev server with auto-restart:** `npm run dev` (uses `node --watch`).
- **Frontend production build:** `cd Frontend && npm run build`.
- Create a **second, normal account** via the Register page if you want to test with a clean (unseeded) user — registration is fully functional.

---

## 🛠 Troubleshooting

| Problem | Fix |
|---------|-----|
| `ER_ACCESS_DENIED_ERROR` when seeding | Your MySQL user/password in `Backend/.env` is wrong. Also make sure the `fittrack` database exists (`mysql -u root -p < Backend/init-db.sql`). |
| `ER_BAD_DB_ERROR: Unknown database 'fittrack'` | Run the schema script first (step 3). |
| Port 5000 or 5173 already in use | Change `PORT` in `Backend/.env` or pass `--port` to Vite, and update `FRONTEND_URL` / `VITE_API_URL` to match. |
| CORS error in the browser console | The backend's `FRONTEND_URL` must match the origin you open the frontend from (default `http://localhost:5173`). |
| Frontend can't reach the API | Confirm the backend is running and `VITE_API_URL` (if set) points at `http://localhost:5000/api`. |
| Login says "Session expired" | JWT cookie lasts 24h — just log in again. |

---

## 📄 License & Context

Student academic project for **NIT6150 Advanced Project**, Victoria University Melbourne. Not intended for production deployment. System design details (use cases, ERD, requirements) live in `project_structure.md`.
