# Phoenix Adventures — Production hosting

This is the layout you are using: **Hostinger holds the domain**, **frontend + admin already live on Vercel**, **API on Render (preferred) or Koyeb**, **data on Convex Cloud**. Payments stay **manual UPI** (no Razorpay).

Use [DEPLOY.md](./DEPLOY.md) for env tables and smoke tests. Copy names from [backend/.env.example](./backend/.env.example) — **never commit real values**.

---

## Topology

```
  Browser
     │
     ▼
  Hostinger DNS  (nameservers can stay at Hostinger for email)
     │
     ├── www.<your-domain>     CNAME → Vercel     (customer SPA: frontend/)
     ├── admin.<your-domain>   CNAME → Vercel     (admin SPA: admin/)
     └── api.<your-domain>     CNAME → Render     (or Koyeb)
                                      │
                                      ▼
                               Convex Cloud (internal functions only)
                                      │
                               Cloudinary / Gmail SMTP / WhatsApp Cloud API
```

| Piece | Where it runs | Source in repo |
|-------|----------------|----------------|
| Customer site | **Vercel** (already hosted) | `frontend/` + `frontend/vercel.json` |
| Admin panel | **Vercel** (already hosted) | `admin/` + `admin/vercel.json` |
| API | **Render** Web Service (preferred) or **Koyeb** (root `Dockerfile`) | `backend/` |
| Database | **Convex Cloud** | `convex/` |
| Domain / email DNS | **Hostinger** | DNS records only |
| UPI | Manual QR + admin verify | `frontend/public/upi-merchant-qr.png` |

Redis is **not required**. Leave `REDIS_URL` unset. Do not set `REQUIRE_REDIS`.

---

## Grant access without passwords (read this)

Cursor / this AI **cannot log into Hostinger** (or Vercel) with a username and password from chat. Do **not** paste Hostinger, Vercel, Cloudinary, JWT, or Convex keys into git or chat.

Safe ways to collaborate:

1. **GitHub** — push this repo. Vercel (already connected) auto-deploys `frontend/` and `admin/` on push. Render/Koyeb should also connect to the same GitHub repo.
2. **Vercel** — in the Vercel dashboard, invite a collaborator (email) on the team or project. That is not a Hostinger password.
3. **Hostinger** — only needed for **DNS**. Add the records listed below. Keep nameservers at Hostinger if you want Hostinger email.
4. **Render / Koyeb** — you create the account, paste env **names** from `.env.example`, set values in their UI, deploy from GitHub.
5. **Later chats** — paste **public URLs** only (`*.vercel.app`, intended custom domain, `*.onrender.com`). Set secrets on Render yourself.

If you want someone to help with DNS, send a **screenshot of the DNS page** (no login). Never send control-panel passwords.

---

## 1) Convex (you must click this)

A **Convex deploy key was previously in git**. Treat it as leaked:

1. Convex dashboard → Settings → Deploy Keys → **revoke / rotate** the production key.
2. Put the **new** key only in:
   - Render/Koyeb env as `CONVEX_ADMIN_KEY` (backend)
   - Optional GitHub Actions secret `CONVEX_DEPLOY_KEY` (CI)
3. Never commit it. Never paste it in chat.

Deploy functions from your machine (PowerShell), from `convex/`:

```powershell
cd D:\Desktop\Phoenix\convex
$env:CONVEX_DEPLOY_KEY = "<paste from Convex dashboard — not into git>"
npx convex deploy
```

macOS / Linux:

```bash
cd convex
export CONVEX_DEPLOY_KEY="<paste from Convex dashboard — not into git>"
npx convex deploy
```

This AI cannot deploy to your Convex cloud without that key on **your** machine or CI.

Optional CI: [`.github/workflows/deploy-convex.yml`](./.github/workflows/deploy-convex.yml). In GitHub → Settings → Secrets → Actions, add `CONVEX_DEPLOY_KEY` (the rotated key).

Seed admin **once** against production Convex (from `backend/` with prod `CONVEX_URL` + `CONVEX_ADMIN_KEY` in a local `.env` that is gitignored, or via an SSH/one-off on the API host):

```powershell
cd D:\Desktop\Phoenix\backend
node seedAdmin.js
```

Then log into admin and **change the password**. Rotate `SEED_ADMIN_PASSWORD` after use.

---

## 2) Backend — Render (preferred)

Repo already has [`render.yaml`](./render.yaml): Node Web Service, root `backend/`, `npm start`, health `/health`, `NODE_ENV=production`. No Redis.

### Steps

1. Sign up at [render.com](https://render.com) with **GitHub** (not a password shared in chat).
2. **New → Blueprint** and select this repo, **or** **New → Web Service**:
   - Repository: this GitHub repo  
   - **Root directory:** `backend`  
   - **Runtime:** Node  
   - **Build:** `npm ci`  
   - **Start:** `npm start`  
   - **Health check:** `/health`  
   - **Plan:** Starter (always-on). Free tier sleeps; bad for live bookings.
3. Paste env vars in the Render dashboard (names below). Do not put secrets in `render.yaml`.
4. Deploy. Copy the service URL, e.g. `https://phoenix-api.onrender.com`.
5. Optional: add custom domain `api.<your-domain>` in Render, then the Hostinger CNAME below.

### Koyeb (alternative)

1. Connect GitHub. Use the **root [Dockerfile](./Dockerfile)** (copies `backend/`, `CMD npm start`, port `8080`).
2. Koyeb injects `PORT`; the app already reads `process.env.PORT`.
3. Health path: `/health`.
4. Same env var names as Render. Redis not required.

---

## 3) Vercel (frontend + admin) — already hosted

SPA fallback is in:

- `frontend/vercel.json` — rewrite unknown paths → `index.html` (except `/assets/`)
- `admin/vercel.json` — same

**You must set and rebuild** after the API URL is known:

| Vercel project | Root directory | Env |
|----------------|----------------|-----|
| Customer site | `frontend` | `VITE_API_URL=https://api.<your-domain>` (or the `onrender.com` URL until DNS is live) |
| Admin | `admin` | same `VITE_API_URL` |

`VITE_*` is baked in at **build time**. Changing it requires a **Redeploy**. No trailing slash; no `/api` suffix (the app appends `/api`).

Invite collaborators in Vercel → Project → Settings → Members. Cursor does not need the Hostinger password.

---

## 4) Hostinger DNS (you click this)

Keep nameservers at Hostinger if email stays there. In **DNS / Zone editor**, add (replace placeholders with values from Vercel and Render dashboards):

| Type | Name / host | Value | TTL |
|------|-------------|--------|-----|
| CNAME | `www` | **Copy from Vercel** → frontend project → Settings → Domains (often `cname.vercel-dns.com` or a project-specific target) | 3600 or Auto |
| CNAME | `admin` | **Copy from Vercel** → admin project → Domains | 3600 or Auto |
| CNAME | `api` | **Copy from Render** → your service hostname, e.g. `phoenix-api.onrender.com` (no `https://`) | 3600 or Auto |
| A or URL redirect | `@` (apex) | Redirect to `https://www.<your-domain>` (Hostinger “redirect” or Vercel apex instructions) | — |

In each **Vercel** project, add the custom domain (`www…` and `admin…`) so Vercel issues certificates. In **Render**, add `api…` if you use that hostname.

Do not point `www` at Hostinger’s website builder if the site is on Vercel.

---

## Env var names (no values here)

### Backend (Render / Koyeb) — required

`NODE_ENV` (= `production`), `CONVEX_URL`, `CONVEX_ADMIN_KEY`, `JWT_SECRET`, `CORS_ORIGINS`, `FRONTEND_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ADMIN_EMAIL`

Also set:

- `COOKIE_SAME_SITE=none` — API is a **different site** than Vercel (`*.vercel.app` or custom domain vs `*.onrender.com`). Browsers need `SameSite=None; Secure` for cookie login.
- Leave `COOKIE_DOMAIN` **unset** unless the API is really `api.<your-domain>` (sibling of `www` / `admin`). Do not set it to `.yourdomain` while the API host is still `*.onrender.com`.

`CORS_ORIGINS` example (comma-separated, https, **no trailing slash**):

```text
https://www.<your-domain>,https://admin.<your-domain>,https://<frontend-project>.vercel.app,https://<admin-project>.vercel.app
```

Optional: `CORS_ALLOW_VERCEL_PREVIEWS=true` on a **staging** API only (allows `https://*.vercel.app`).

`FRONTEND_URL=https://www.<your-domain>` (customer site; used in emails).

### Backend — strongly recommended

`ENCRYPTION_KEY` — generate **on your machine**, paste only in Render:

```powershell
openssl rand -hex 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`JWT_SECRET` — 64+ random chars, same idea (`randomBytes(64).toString('hex')`).

`ADMIN_2FA_RESET_KEY`, `SMTP_*`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `OPENAI_API_KEY` as needed.

### Frontend + admin (Vercel)

`VITE_API_URL` only.

### Convex CI (optional GitHub secret)

`CONVEX_DEPLOY_KEY` — rotated production deploy key.

---

## CORS & cookies (this topology)

| Frontend origin | API origin | Cookie |
|-----------------|------------|--------|
| `*.vercel.app` or `www.<domain>` | `*.onrender.com` / `*.koyeb.app` | Cross-site → `COOKIE_SAME_SITE=none`, no `COOKIE_DOMAIN` |
| `www` + `admin` + `api` all on `<domain>` | `api.<domain>` | Same-site; `none` still works. Optional later: `COOKIE_DOMAIN=.<domain>` |

Production CORS is an exact allowlist. After Vercel custom domains work, keep both the custom hosts **and** `*.vercel.app` production URLs in `CORS_ORIGINS` until you stop using the vercel.app links.

---

## UPI QR

Replace **`frontend/public/upi-merchant-qr.png`** with the real merchant QR before taking payments. Redeploy the frontend on Vercel. Confirm amounts in the bank app; do not auto-confirm from screenshots.

---

## What you still must do (clicks)

- [ ] Rotate Convex deploy key (was in git) and deploy: `cd convex && npx convex deploy`
- [ ] Create Render (or Koyeb) service; paste env vars; confirm `GET /health` → `OK`
- [ ] Set `VITE_API_URL` on **both** Vercel projects and **Redeploy**
- [ ] Add Hostinger DNS records; add domains in Vercel + Render
- [ ] `node seedAdmin.js` then change admin password
- [ ] Replace UPI QR image
- [ ] Invite people via GitHub + Vercel members — not Hostinger passwords

---

## Cost notes

- Vercel: frontend + admin (already).
- Render Starter: always-on API (free Render sleeps).
- Convex / Cloudinary free tiers until you grow.
- **No payment gateway fee** — keep manual UPI.

---

## Quick links

| Doc | Use |
|-----|-----|
| [DEPLOY.md](./DEPLOY.md) | Env matrix, smoke curls, rollback |
| [backend/.env.example](./backend/.env.example) | Full backend names |
| [render.yaml](./render.yaml) | Render Blueprint |
| [Dockerfile](./Dockerfile) | Koyeb / containers |
| [RUN.md](./RUN.md) | Local development |
