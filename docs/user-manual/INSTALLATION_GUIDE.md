# FitTrack — Installation Guide

Two install paths: **local development** (for working on the code) and **production deployment** (Vercel + Railway, matching how the live app is actually hosted).

---

## Part A — Local development install

### A.1 Prerequisites

- **Node.js 18+** and npm (Vite 5 requires Node 18+)
- **MySQL 8.x** running locally
- **Git**

Check versions:
```bash
node -v
npm -v
mysql --version
git --version
```

### A.2 Get the code

```bash
git clone https://github.com/misogare/FitTrack-Project.git
cd FitTrack-Project
```

### A.3 Install dependencies

```bash
cd Backend && npm install
cd ../Frontend && npm install
```

### A.4 Configure the backend

There is no `.env.example` committed to the repo (env files are gitignored), so create `Backend/.env` yourself with:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fittrack
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

The frontend needs no `.env` file for local dev — it talks to `http://localhost:5000/api` by default. Only add `Frontend/.env` with `VITE_API_URL=...` if your backend runs somewhere else.

### A.5 Create the database

```bash
cd Backend
mysql -u root -p < init-db.sql
```

This creates the `fittrack` database and all 13 tables. It's safe to re-run (`CREATE ... IF NOT EXISTS`).

### A.6 Seed demo data (recommended)

```bash
npm run seed:demo
```

Creates/resets a demo account with realistic sample data across every feature:

| Field | Value |
|---|---|
| Email | `demo@fittrack.local` |
| Password | `Demo123!` |

Safe to re-run any time to reset back to a clean demo state.

### A.7 Run both servers

```bash
# Terminal 1
cd Backend && npm run dev      # http://localhost:5000

# Terminal 2
cd Frontend && npm run dev     # http://localhost:5173
```

Open `http://localhost:5173`, log in with the demo credentials (or register a new account), and confirm `GET http://localhost:5000/api/health` returns `{"status":"ok",...}`.

### A.8 Verify the install

- [ ] Backend health check responds OK
- [ ] Frontend loads the landing page
- [ ] Can log in with the demo account
- [ ] Dashboard shows seeded workouts/meals/goals

If any of these fail, see the [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md).

---

## Part B — Production deployment (Vercel + Railway)

This is how the live app is currently hosted; use this if standing up a new environment (e.g. a fresh staging deployment) rather than for day-to-day development.

### B.1 Backend on Railway

1. Create a new Railway project, add a **MySQL** plugin/database to it.
2. Deploy `Backend/` as a service (Railway auto-detects the Node app via the root `package.json`'s `postinstall`/`start` scripts, which `cd Backend` and run `npm install` / `node server.js`).
3. Set environment variables in Railway's **Variables** tab: `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `NODE_ENV=production`, `FRONTEND_URL` (your Vercel URL). Database connection comes from Railway's own `MYSQL_URL`/`DATABASE_URL`, which `Backend/config/db.js` reads automatically — you don't need to set `DB_HOST`/`DB_USER`/etc. by hand on Railway.
4. Initialise the schema on the new database by running `Backend/scripts/setup-db.js` as a one-off command in the Railway service shell (it applies `init-db.sql` against Railway's MySQL).
5. Confirm `https://<your-railway-app>/api/health` returns OK.

### B.2 Frontend on Vercel

1. Import the GitHub repo into Vercel as a new project, with **root directory** set to `Frontend/`.
2. Build command `npm run build`, output directory `dist` (Vite defaults) — Vercel detects this automatically for a Vite project.
3. Set `VITE_API_URL` to your Railway backend's `/api` URL (e.g. `https://<your-railway-app>/api`) as a Vercel environment variable, then redeploy.
4. `Frontend/vercel.json` already contains the SPA rewrite rule (`/(.*) → /index.html`) needed so refreshing a route like `/dashboard` doesn't 404 — don't remove it.

### B.3 Connect the two

- On Railway, set `FRONTEND_URL` to your exact Vercel URL (e.g. `https://fittrack-project.vercel.app`) so CORS + cross-site cookies work. `Backend/server.js` also allows any `*.vercel.app` origin and `localhost`, which covers Vercel preview deployments automatically.
- If you later attach a custom domain (see the domain setup notes shared separately), add that exact domain to `FRONTEND_URL` too — a mismatch here is the #1 cause of "login works locally but not in production," see [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md).

### B.4 Post-deploy checks

- [ ] `GET /api/health` on the Railway URL returns OK
- [ ] The Vercel site loads and can register/log in against the Railway backend
- [ ] Refreshing a deep link (e.g. `/goals`) on the Vercel URL doesn't 404
- [ ] No CORS errors in the browser console when using the deployed frontend
