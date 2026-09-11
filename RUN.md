# Phoenix Adventures — Run Guide

Step-by-step instructions to run the project locally from a clean clone.

## Prerequisites

- **Node.js 20+** and npm
- A **Convex** account ([convex.dev](https://convex.dev)) — for the database/queries
- **WhatsApp Business** account for customer inquiries
- **OpenAI** API key (optional, for AI features in the admin panel)
- **Cloudinary** account (optional, for image uploads)

> The `backend/.env` in this repo already has working Convex + OpenAI + Cloudinary credentials. You can run end-to-end without setting up your own accounts on first run — just add the ones you don't have later.

---

## 1. One-time setup

### 1.1 Install dependencies in every workspace

```bash
# from the repo root (D:\Desktop\Phoenix)
npm install                       # installs the root convex client (used by scripts)
cd backend  && npm install && cd ..
cd admin    && npm install && cd ..
cd frontend && npm install && cd ..
cd convex   && npm install && cd ..
```

### 1.2 Verify env files exist

These should already be in the repo (`.env` files are gitignored but checked in for dev):

- `backend/.env` — Convex URL/key, JWT secret, OpenAI, Cloudinary
- `admin/.env` — `VITE_API_URL=http://localhost:5000`
- `frontend/.env` — `VITE_API_URL=http://localhost:5000`
- `convex/.env.local` — points to the dev Convex deployment

If any are missing, copy from the matching `.env.example` and fill in real values.

### 1.3 Deploy Convex functions

The Convex functions live in `convex/convex/` (a sub-directory of the `convex/` workspace — this is the structure the Convex CLI expects). Schema and functions are not auto-deployed; you must push them.

```powershell
cd convex
$env:CONVEX_DEPLOY_KEY = "<production deploy key from Convex dashboard>"   # Convex dashboard → Settings → Deploy Keys
npx convex deploy
```

> **PowerShell note:** set the env var in the same shell session you run the deploy from. To make it permanent for the session, use `$env:CONVEX_DEPLOY_KEY = "..."` (no `export`).

Expected output ends with: `✔ Deployed Convex functions to https://elated-eel-875.convex.cloud`

### 1.4 Seed the admin user

```bash
cd backend
node seedAdmin.js
```

This creates (or resets) the admin account:

- **Email:** `admin@phoenix.com`
- **Password:** `admin123`
- **Role:** `admin`

You should see: `✅ Admin role + password reset successfully!`

### 1.5 (Optional) Seed sample adventures/bookings

There's no built-in seeder for adventures — add them through the admin UI after logging in, or call the API directly.

---

## 2. Running locally (dev)

You need **three** processes running in separate terminals.

### Terminal 1 — Backend API (port 5000)

```bash
cd backend
npm run dev          # uses nodemon; or `npm start` for a plain node process
```

Health check: open <http://localhost:5000/api/health> — should return `{"status":"OK", ...}` with `checks.convex.ok: true`.

### Terminal 2 — Admin panel (Vite, port 5173 or next free)

```bash
cd admin
npm run dev
```

Vite will print the URL — open it and sign in with the seeded admin credentials.

### Terminal 3 — Customer frontend (Vite, port 5173 or next free)

```bash
cd frontend
npm run dev
```

> Both Vite apps default to port 5173. The second one to start auto-bumps to 5174. The backend CORS allow-list (`backend/index.js`) permits 5173–5176 in dev, so either ordering is fine as long as both land within that range.

---

## 3. Default admin login

| Field    | Value                |
|----------|----------------------|
| Email    | `admin@phoenix.com`  |
| Password | `admin123`           |

> **Production:** rotate this password immediately and set `NODE_ENV=production` in `backend/.env` so the stricter CORS list, rate limits, and error masking kick in.

---

## 4. Common commands

| Task                                | Command                                                      |
|-------------------------------------|--------------------------------------------------------------|
| Deploy Convex functions (prod)      | `cd convex && $env:CONVEX_DEPLOY_KEY="..." && npx convex deploy` |
| Reset the admin password            | `cd backend && node seedAdmin.js`                            |
| Lint admin                          | `cd admin && npm run lint`                                   |
| Build admin for deploy              | `cd admin && npm run build`                                  |
| Build frontend for deploy           | `cd frontend && npm run build`                               |
| Watch backend logs                  | `cd backend && npm run dev`                                  |

---

## 5. Troubleshooting

### "Invalid Credentials" on admin login

- Backend can't reach Convex, or the admin user was never seeded.
- Check `http://localhost:5000/api/health` — `checks.convex.ok` must be `true`.
- Re-run `node backend/seedAdmin.js`.

### "Could not find public function for 'users:getAll'"

The Convex functions aren't deployed to the deployment your backend points to. See step **1.3** above. Also confirm `backend/.env`'s `CONVEX_URL` matches the deployment you deployed to.

### "Not allowed by CORS" in the browser

- If the frontend or admin Vite server landed on port 5177+ (because other apps took 5173–5176), the backend's dev CORS allow-list will reject it.
- Fix: stop the other Vite apps, or extend the `allowedOrigins` array in `backend/index.js` (line ~40), or set `CORS_ORIGINS` in `backend/.env` and run in production mode.

### `JWT_SECRET is not configured`

Set `JWT_SECRET` in `backend/.env` (must be at least 64 random characters in production; the dev value is already filled in).

### 500 from `/api/auth/login` with `Server misconfiguration`

Either `JWT_SECRET` is missing or Convex env vars are missing. Check `backend/.env` and restart the backend.

---

## 6. Deploying to production

This repo currently runs against a single shared Convex deployment (`elated-eel-875`, prod). For a true prod launch you'd want to:

1. Create a **separate** Convex deployment for production data.
2. Set its URL + deploy key in the hosting provider's env vars (Render/Railway/Heroku for backend, Vercel/Netlify for frontend/admin).
3. Run `npx convex deploy` once with the prod deploy key to push functions and schema.
4. Rotate the admin password, set `NODE_ENV=production`, and configure `CORS_ORIGINS` to your real domains.

See the original `README.md` for the variable list.
