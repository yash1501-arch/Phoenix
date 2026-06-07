# Phoenix Adventures — Deployment Guide

This guide walks through deploying the four pieces of the stack — **Convex**, **backend API**, **customer frontend**, and **admin panel** — to production, including environment variables, DNS, CI/CD, and the post-deploy verification checklist.

> See [RUN.md](./RUN.md) for local development setup and [README.md](./README.md) for the project overview.

---

## Architecture

```
                ┌─────────────────────┐
                │   Convex (cloud)    │   ← database, queries, mutations
                │   convex.cloud      │     shared by all 3 services
                └──────────▲──────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
   ┌────────┴────────┐          ┌─────────┴────────┐
   │  Backend API    │◀─────────│  Razorpay webhooks│
   │  Node/Express   │          └──────────────────┘
   │  Render/Railway │
   └────────▲────────┘
            │
            │  VITE_API_URL
            │
   ┌────────┴────────┐         ┌──────────────────┐
   │ Customer site   │         │  Admin panel     │
   │ www…in          │         │  admin…in        │
   │ Vite → CDN      │         │  Vite → CDN      │
   └─────────────────┘         └──────────────────┘
```

Four independent deployments:

| Component | Source        | Build               | Host (recommendation)         |
|-----------|---------------|---------------------|-------------------------------|
| Convex    | `convex/convex/*.ts` | `npx convex deploy` | [convex.cloud](https://convex.cloud) |
| Backend   | `backend/`    | none (Node process) | Render / Railway / Fly.io     |
| Frontend  | `frontend/`   | `npm run build` → `dist/` | Vercel / Netlify / Cloudflare Pages |
| Admin     | `admin/`      | `npm run build` → `dist/` | Vercel / Netlify / Cloudflare Pages |

---

## 1. Deploy Convex (production)

The backend talks to Convex for every database operation, so this must be live first.

### 1.1 Create / pick a production deployment

In the Convex dashboard, create a **Production** deployment (e.g. `elated-eel-875`). Note:

- **Deployment URL** — looks like `https://elated-eel-875.convex.cloud`
- **Deploy key** — dashboard → Settings → Deploy Keys → "Generate Production Deploy Key". It looks like `prod:elated-eel-875|eyJ…`.

### 1.2 Push schema and functions

```powershell
cd D:\Desktop\Phoenix\convex
$env:CONVEX_DEPLOY_KEY = "prod:elated-eel-875|eyJ2MiI6IjlmMDhlNjY3ODE5YzQ0MjY4OTU5ODE0ODcyNzg5ZTA3In0="
npx convex deploy
```

You should see: `✔ Deployed Convex functions to https://elated-eel-875.convex.cloud`.

> **Heads-up:** the deploy is non-destructive for compatible schema changes. Incompatible changes (e.g. removing a required field) will fail with a clear error — write a one-off migration function first, deploy + run it, *then* update `schema.ts`.

### 1.3 Seed the admin user

```bash
cd backend
node seedAdmin.js
```

Default credentials (rotate immediately after first login):

- **Email:** `admin@phoenix.com`
- **Password:** `admin123`

### 1.4 Verify

Open the Convex dashboard → Functions. You should see all queries/mutations listed (e.g. `users:getByEmail`, `adventures:getAll`).

---

## 2. Deploy the backend API

The backend is a stateless Node/Express service. Any platform that runs `node index.js` works. **Render** is used in the examples below — the same env-var flow applies to Railway/Fly/Heroku.

### 2.1 Create the service

- **Build command:** `npm install`
- **Start command:** `npm start` (or `node index.js`)
- **Root directory:** `backend`
- **Health check path:** `/health` (shallow) or `/api/health` (deep — also verifies Convex)
- **Region:** pick one close to your Convex deployment for lower latency

### 2.2 Environment variables

Set these in the host's secret/env-var UI. **Do not commit them to git.**

| Variable                | Required | Example / Notes                                                                 |
|-------------------------|----------|---------------------------------------------------------------------------------|
| `NODE_ENV`              | ✅       | `production` — enables stricter CORS, rate limits, error masking                |
| `PORT`                  | ✅       | `5000` (or whatever the host assigns; the app reads `process.env.PORT`)         |
| `CONVEX_URL`            | ✅       | `https://elated-eel-875.convex.cloud`                                            |
| `CONVEX_ADMIN_KEY`      | ✅       | The same value as `CONVEX_DEPLOY_KEY` (a Convex prod deploy key)                |
| `JWT_SECRET`            | ✅       | 64+ random chars. Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CORS_ORIGINS`          | ✅       | Comma-separated list of every frontend origin that may call the API, e.g. `https://www.phoenixadventures.in,https://admin.phoenixadventures.in` |
| `FRONTEND_URL`          | ✅       | Customer site origin, e.g. `https://www.phoenixadventures.in` (used for password-reset email links) |
| `RAZORPAY_KEY_ID`       | ✅ for payments | Live key (`rzp_live_…`) for production                                          |
| `RAZORPAY_KEY_SECRET`   | ✅ for payments | Live secret                                                                          |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ for payments | From Razorpay Dashboard → Settings → Webhooks → your endpoint → Secret         |
| `OPENAI_API_KEY`        | optional | Enables AI itinerary / PDF / description features in admin                      |
| `CLOUDINARY_CLOUD_NAME` | optional | Image uploads via Cloudinary                                                     |
| `CLOUDINARY_API_KEY`    | optional |                                                                                  |
| `CLOUDINARY_API_SECRET` | optional |                                                                                  |
| `SMTP_HOST`             | optional | For sending password-reset / booking emails                                     |
| `SMTP_PORT`             | optional | `587`                                                                            |
| `SMTP_SECURE`           | optional | `false` for 587, `true` for 465                                                 |
| `SMTP_USER`             | optional |                                                                                  |
| `SMTP_PASS`             | optional | App-specific password (Gmail)                                                    |
| `ADMIN_EMAIL`           | optional | Where admin notifications go                                                    |

### 2.3 Configure Razorpay webhooks

In the Razorpay Dashboard → Settings → Webhooks → **Create new webhook**:

- **URL:** `https://api.phoenixadventures.in/api/payments/webhook` (your backend URL + `/api/payments/webhook`)
- **Active events:** `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`
- **Secret:** copy the value Razorpay gives you → paste into `RAZORPAY_WEBHOOK_SECRET` in the backend env

Test the webhook from the Razorpay dashboard after saving — it should return `200 OK`.

### 2.4 First deploy verification

```bash
curl https://api.phoenixadventures.in/health
# → {"status":"OK","timestamp":"…"}

curl https://api.phoenixadventures.in/api/health
# → {"status":"OK", "checks": {"convex": {"ok": true}, "jwt": {"ok": true}}}
```

A non-`OK` response or `checks.convex.ok: false` means the env vars aren't reaching the service.

---

## 3. Deploy the customer frontend

### 3.1 Vercel (recommended)

- **Root directory:** `frontend`
- **Build command:** `npm run build` (Vite default)
- **Output directory:** `dist`
- **Install command:** `npm install`

### 3.2 Environment variables

| Variable                | Required | Example                                              |
|-------------------------|----------|------------------------------------------------------|
| `VITE_API_URL`          | ✅       | `https://api.phoenixadventures.in` (no trailing `/api` — the app appends it) |
| `VITE_RAZORPAY_KEY_ID`  | ✅ for payments | Live key (`rzp_live_…`)                       |

### 3.3 Custom domain

In Vercel → Project → Settings → Domains, add `www.phoenixadventures.in`. Point your DNS:

- **CNAME** `www` → `cname.vercel-dns.com`

(or use Vercel as the nameserver and skip the CNAME.)

### 3.4 SPA routing

The frontend uses `react-router-dom` with client-side routes. Vite produces a single `index.html`; the static host must serve `index.html` for any unknown path so deep links work.

- **Vercel:** automatic (it detects Vite).
- **Netlify:** add a `_redirects` file in `public/`:

  ```
  /*  /index.html  200
  ```

- **Cloudflare Pages:** automatic for Vite.

---

## 4. Deploy the admin panel

Same as the customer frontend, with different env vars and domain.

- **Root directory:** `admin`
- **Build command:** `npm run build`
- **Output directory:** `dist`

### 4.1 Environment variables

| Variable       | Required | Example                                            |
|----------------|----------|----------------------------------------------------|
| `VITE_API_URL` | ✅       | `https://api.phoenixadventures.in`                 |

> The admin uses the same `VITE_API_URL` as the customer frontend — it calls the same backend. Razorpay key is not needed here (admin doesn't take payments).

### 4.2 Custom domain

- **Domain:** `admin.phoenixadventures.in`
- **DNS:** CNAME `admin` → `cname.vercel-dns.com` (or your host's equivalent)

### 4.3 Lock down the admin panel (recommended)

The admin panel is wide-open to anyone with the URL. Add at least one of:

1. **HTTP Basic Auth** at the CDN (Vercel Password Protection, Cloudflare Access, Netlify Pro).
2. **IP allow-list** via your CDN (only allow your office/VPN IPs).
3. **Always-on admin session timeout** + strong unique admin password (rotate after each deploy).

---

## 5. Environment-variable matrix (quick reference)

| Variable                    | Convex | Backend | Frontend | Admin |
|-----------------------------|:------:|:-------:|:--------:|:-----:|
| `NODE_ENV`                  |        | ✅      |          |       |
| `PORT`                      |        | ✅      |          |       |
| `CONVEX_URL`                |        | ✅      |          |       |
| `CONVEX_ADMIN_KEY`          |        | ✅      |          |       |
| `CONVEX_DEPLOY_KEY`         | ✅ (CI)|         |          |       |
| `JWT_SECRET`                |        | ✅      |          |       |
| `CORS_ORIGINS`              |        | ✅      |          |       |
| `FRONTEND_URL`              |        | ✅      |          |       |
| `RAZORPAY_KEY_ID`           |        | ✅      | ✅       |       |
| `RAZORPAY_KEY_SECRET`       |        | ✅      |          |       |
| `RAZORPAY_WEBHOOK_SECRET`   |        | ✅      |          |       |
| `OPENAI_API_KEY`            |        | ✅      |          |       |
| `CLOUDINARY_*`              |        | ✅      |          |       |
| `SMTP_*`                    |        | ✅      |          |       |
| `ADMIN_EMAIL`               |        | ✅      |          |       |
| `VITE_API_URL`              |        |         | ✅       | ✅    |
| `VITE_RAZORPAY_KEY_ID`      |        |         | ✅       |       |

---

## 6. CI/CD (optional but recommended)

### GitHub Actions — auto-deploy Convex on merge to `main`

`.github/workflows/deploy-convex.yml`:

```yaml
name: Deploy Convex
on:
  push:
    branches: [main]
    paths: ['convex/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
        working-directory: convex
      - run: npx convex deploy
        working-directory: convex
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```

### Render / Vercel auto-deploy

Both have first-class GitHub integration:

- **Render:** Connect repo → New Web Service → branch `main` → auto-deploy on every push.
- **Vercel:** Import project → branch `main` → auto-deploy on every push (with preview URLs for PRs).

> Configure each service so a failed `npm run build` (or a failed Convex deploy) **blocks** the merge. Render and Vercel both do this by default for PR previews.

---

## 7. Pre-deploy checklist

- [ ] `npx convex deploy` succeeds against the prod deployment
- [ ] `node backend/seedAdmin.js` has been run on the prod Convex
- [ ] Admin password has been **rotated** (not still `admin123`)
- [ ] Backend env vars are all set, including a fresh `JWT_SECRET`
- [ ] `CORS_ORIGINS` includes the exact prod frontend + admin origins (no trailing slash, https)
- [ ] `NODE_ENV=production` is set on the backend
- [ ] Razorpay webhook is configured with the live `RAZORPAY_WEBHOOK_SECRET`
- [ ] Razorpay is in **Live mode** in the dashboard (not Test mode) on both backend + frontend
- [ ] Frontend and admin have correct `VITE_API_URL` pointing to the live backend
- [ ] Custom domains are connected, HTTPS is on
- [ ] SPA fallback (`/* → /index.html`) works — try opening `/adventures` directly in a private tab

## 8. Post-deploy verification

```bash
# Backend health
curl -s https://api.phoenixadventures.in/api/health | jq

# Frontend renders
curl -sI https://www.phoenixadventures.in/ | head -1    # → HTTP/2 200

# Admin renders + SPA fallback works
curl -sI https://admin.phoenixadventures.in/ | head -1
curl -sI https://admin.phoenixadventures.in/adventures | head -1   # → HTTP/2 200 (not 404)

# End-to-end login
curl -s -X POST https://api.phoenixadventures.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@phoenix.com","password":"<your-new-password>"}' | jq -r .token
# → eyJ… (a JWT)
```

Manual checks:

- [ ] Open customer site, browse an adventure, complete a test booking (use Razorpay test card `4111 1111 1111 1111` in live mode for the first verification, then switch to live).
- [ ] Open admin panel, log in, see the new booking in **Bookings**, see it reflected in **Dashboard** stats.
- [ ] Submit a contact/newsletter form and confirm the email/SMTP flow works (or check logs).
- [ ] Test password reset end-to-end.
- [ ] Check Razorpay dashboard → Webhooks → Recent deliveries for `payment.captured` 200 responses.

## 9. Updating after deploy

| Change                          | Steps                                                                                       |
|---------------------------------|---------------------------------------------------------------------------------------------|
| Edit a Convex function/schema   | `cd convex && npx convex deploy` (or push to `main` if you set up CI)                        |
| Edit backend code               | Push to `main` → Render auto-rebuilds. Or click **Manual Deploy** → **Deploy latest commit**. |
| Edit frontend/admin             | Push to `main` → Vercel auto-rebuilds.                                                      |
| Rotate `JWT_SECRET`             | Set new value in backend env vars, **restart** the service (don't just redeploy).            |
| Rotate Razorpay webhook secret  | Update in Razorpay dashboard, set new value in backend env, restart.                          |
| Promote a dev Convex deploy to prod | Not directly supported — point `CONVEX_URL`/`CONVEX_ADMIN_KEY` to the prod deploy and re-run `seedAdmin.js`. |

## 10. Rollback

- **Backend:** Render keeps a deploy history — pick a previous deploy and click **Rollback**. The database (Convex) is unaffected.
- **Frontend / admin:** Vercel keeps every deploy. Project → Deployments → click any past deploy → **Promote to Production**.
- **Convex:** Convex does not ship a one-click rollback. To roll back, check out the previous `convex/convex/*.ts` from git and re-run `npx convex deploy` — the new push becomes the current code. (Convex does not time-travel queries, but a function-level rollback is usually fine.)

> **Backups:** Convex has an export/import CLI (`npx convex export` / `npx convex import`). Run an export on a schedule (cron in CI) and store the resulting zip in object storage so you can restore data if needed.

---

## 11. Monitoring & logs

- **Backend logs:** Render → Service → Logs (or your host's equivalent). Look for the `[ERROR]`, `Unhandled error:`, and `[razorpay] FATAL` lines.
- **Convex logs:** `npx convex logs --prod` from the `convex/` directory. Also available in the dashboard under **Logs**.
- **Uptime:** point a free monitor (UptimeRobot, BetterStack, …) at `https://api.phoenixadventures.in/api/health` — alert on non-200.
- **Error tracking:** drop in Sentry (or similar) on both backend and frontend — set `SENTRY_DSN` in each env.

---

## 12. Domain & DNS summary (typical setup)

Assuming you want:

- `www.phoenixadventures.in` → customer frontend
- `admin.phoenixadventures.in` → admin panel
- `api.phoenixadventures.in` → backend

| Record | Type  | Name | Value                          |
|--------|-------|------|--------------------------------|
| `www`   | CNAME | —    | `cname.vercel-dns.com` (frontend host) |
| `admin` | CNAME | —    | `cname.vercel-dns.com` (admin host)    |
| `api`   | CNAME | —    | `<your-render-service>.onrender.com`   |

Set **CORS_ORIGINS** on the backend to `https://www.phoenixadventures.in,https://admin.phoenixadventures.in` (no trailing slash, exact match).

---

That's it. If something goes wrong, [RUN.md § Troubleshooting](./RUN.md#5-troubleshooting) covers the common dev-time issues; for prod-specific problems check the **Logs** tab of whichever service is unhappy and look for the first error line.
