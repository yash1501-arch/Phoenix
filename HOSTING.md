# Phoenix Adventures — Cost-Saving & Secure Hosting Guide

This guide is the recommended production layout: **low monthly cost**, **no payment-gateway fees**, and **locked-down secrets**. Use it with [DEPLOY.md](./DEPLOY.md) for exact env vars and deploy commands.

---

## Recommended stack (cheap + safe)

| Piece | Host | Typical cost | Why |
|-------|------|--------------|-----|
| Customer site (`frontend/`) | **Cloudflare Pages** | Free | Global CDN, free HTTPS, custom domain |
| Admin panel (`admin/`) | **Cloudflare Pages** (separate project) | Free | Same CDN; protect with Access (below) |
| API (`backend/`) | **Render** Web Service (Starter) *or* **Koyeb** | ~$0–7/mo | Always-on if paid; free tier sleeps (bad for live bookings) |
| Database / functions | **Convex** | Free → pay as you grow | Already in use; keep all functions **internal** |
| Images | **Cloudinary** free tier | Free | Adventure photos / payment screenshots |
| Email (reset, booking alerts) | **Gmail App Password** | Free | No SendGrid until volume needs it |
| WhatsApp booking confirm | **Meta Cloud API** | Free tier | Same moment as email when admin verifies payment |
| DNS + SSL | **Cloudflare** | Free | Proxied A/CNAME, HTTPS, bot basics |
| Payments | **Manual UPI** (already built) | **0% gateway fee** | Avoid Razorpay/Paytm 1–2% |

**Target monthly burn for launch:** ≈ **₹0–₹600** (domain renewals + optional always-on API). Scale Convex/Cloudinary only when traffic grows.

```
  Phone / laptop
       │
       ▼
  Cloudflare DNS (HTTPS)
       │
       ├── www.yourdomain.in  ──► Cloudflare Pages  (customer SPA)
       ├── admin.yourdomain.in ──► Cloudflare Pages  (+ Access lock)
       └── api.yourdomain.in ──► Render / Koyeb     (Express)
                                      │
                                      ▼
                               Convex (internal only)
                                      │
                               Cloudinary / Gmail SMTP
```

---

## Cost-saving rules

1. **Do not add Razorpay / Paytm / Stripe** for advance collect — keep manual UPI verification (you already pay 0% per txn).
2. **One always-on service only** — the API. Frontends are static; they stay free.
3. **Skip free Render** for production bookings — cold starts (≈30–60s) make payment holds expire and look broken. Prefer Render Starter (~$7) or Koyeb free/paid with no sleep.
4. **One Cloudinary account** shared by backend uploads (adventures + payment screenshots).
5. **No Redis / separate DB server** — Convex is enough.
6. **No paid email** until volume requires it — Gmail App Password + `SMTP_*` env.
7. **Admin is not a second VPS** — static SPA + API is enough.
8. **Don’t run three paid Node hosts** — only `backend/` needs a Node process.

### Optional “₹0 API” path (dev / soft launch only)

Use Render **free** or Koyeb free with sleep. Accept:

- First request after idle is slow  
- UPI seat holds may expire if the user waits on a cold API  

Switch to always-on before marketing launches.

---

## Security rules (non-negotiable)

### Secrets — never in the browser

| Secret | Where it lives | Never put in |
|--------|----------------|--------------|
| `CONVEX_ADMIN_KEY` / deploy key | Backend only | `frontend/`, `admin/`, git |
| `JWT_SECRET` | Backend only | Vite env (`VITE_*`) |
| `SMTP_PASS`, Cloudinary secret, OpenAI key | Backend only | Client builds |
| `VITE_API_URL` | Frontend / admin (public URL only) | Must be HTTPS API origin, not a secret |

All Convex functions must stay `internalQuery` / `internalMutation`. The SPA must never call Convex directly.

### CORS & URLs (production)

Backend env:

```env
NODE_ENV=production
CORS_ORIGINS=https://www.yourdomain.in,https://admin.yourdomain.in
FRONTEND_URL=https://www.yourdomain.in
```

- Exact origins only (no `*`)  
- Include `www` and bare domain only if both serve the site  
- Admin origin must be listed or admin API calls fail  

### Admin lock (cheap, important)

Admin is a public static build unless you restrict it:

1. **Cloudflare Zero Trust Access** (free for small teams) on `admin.yourdomain.in` — Google/email OTP before the SPA loads.  
2. Or host admin under an obscure subdomain **and** keep strong admin password + rotate after seed.  
3. Do **not** link admin from the public footer or `sitemap.xml`.  
4. After first deploy, change seed password (`admin@phoenix.com` / `admin123` → strong unique password).

### HTTPS, cookies, headers

- Terminate TLS at Cloudflare / host (Pages + Render provide certs).  
- Backend already uses `helmet`, rate limits, and `trust proxy`.  
- Serve API only over `https://api.…`.  

### Auth & payments

- Customers log in with JWT from your API — store token carefully; prefer memory + refresh later if you harden further.  
- Manual UPI: confirm only after **you** match UTR + amount in the bank app (admin **Payments**).  
- Never auto-confirm from client-uploaded screenshots alone.  
- Payment screenshot URLs should be Cloudinary (or signed); don’t accept freeform remote URLs from strangers.

### Repo & machine hygiene

- `.env` is gitignored — never commit it.  
- Rotate `JWT_SECRET` and Convex deploy key if they ever leaked in chat/screenshots.  
- Use Gmail **App Password**, not the main Gmail password, for SMTP.

---

## Domain layout (example)

| Hostname | Points to | Notes |
|----------|-----------|--------|
| `www.yourdomain.in` | Cloudflare Pages (frontend) | Primary customer site |
| `yourdomain.in` | Redirect → `www` | One canonical host |
| `admin.yourdomain.in` | Cloudflare Pages (admin) + Access | Noindex |
| `api.yourdomain.in` | CNAME → Render/Koyeb service | Used as `VITE_API_URL` |

Cloudflare proxy (orange cloud) on: yes for Pages; for API, orange cloud is fine if WebSockets aren’t required (you don’t need them for this app).

---

## Deploy order (checklist)

### 1) Convex (first)

```powershell
cd convex
$env:CONVEX_DEPLOY_KEY = "prod:…|…"   # from Convex dashboard
npx convex deploy
```

Confirm functions are **internal** in the dashboard.

### 2) Backend API

- Root: `backend`  
- Start: `npm start`  
- Health: `/health` or `/api/health`  
- Set all vars from [backend/.env.example](./backend/.env.example) + `CORS_ORIGINS` / `FRONTEND_URL` for prod  

**Koyeb tip:** this repo has a root [Dockerfile](./Dockerfile) exposing `8080` — use it if you prefer containers.

Seed admin once (from a trusted machine with prod env):

```powershell
cd backend
node seedAdmin.js
```

Then log into admin and **change the password**.

### 3) Customer frontend

Cloudflare Pages (or Vercel):

- Build: `cd frontend && npm ci && npm run build`  
- Output: `frontend/dist`  
- Env: `VITE_API_URL=https://api.yourdomain.in`  

### 4) Admin

Same as frontend, separate project:

- Build: `cd admin && npm ci && npm run build`  
- Output: `admin/dist`  
- Env: `VITE_API_URL=https://api.yourdomain.in`  
- Enable Cloudflare Access on this hostname  

### 5) Smoke test

- [ ] `GET https://api…/health` → `OK`  
- [ ] Customer site loads over HTTPS  
- [ ] Login / register works (CORS OK)  
- [ ] Book → UPI page → submit screenshot works  
- [ ] Admin Payments: verify / reject works  
- [ ] Forgot-password email (SMTP App Password)  
- [ ] Admin blocked without Access / strong password  

---

## Env map (who gets what)

### Backend only

`NODE_ENV`, `PORT`, `CONVEX_URL`, `CONVEX_ADMIN_KEY`, `JWT_SECRET`, `CORS_ORIGINS`, `FRONTEND_URL`, `CLOUDINARY_*`, `SMTP_*`, `ADMIN_EMAIL`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, optional `WHATSAPP_TEMPLATE_NAME` / `WHATSAPP_USE_TEXT`, optional `OPENAI_API_KEY`

### Frontend / Admin (Vite)

`VITE_API_URL` only (public HTTPS API origin)

---

## Monthly cost sketch (India, soft launch)

| Item | Approx |
|------|--------|
| Domain `.in` | ~₹500–900 / year |
| Cloudflare Pages + DNS | ₹0 |
| Convex free tier | ₹0 (until limits) |
| Cloudinary free | ₹0 |
| Gmail SMTP | ₹0 |
| API always-on (Render Starter / similar) | ~₹500–700 / mo |
| **UPI gateway fees** | **₹0** |

Cut API to free/sleeping only if you accept cold starts.

---

## What not to buy (yet)

- Separate Mongo/Postgres VPS (Convex covers it)  
- Paid CDN in front of Cloudflare Pages  
- Payment gateway “just for convenience” (burns 1–2% forever)  
- Multiple always-on Node apps for SPA hosting  

---

## Incident / hardening backlog

Do these when you have time (still low cost):

1. Cloudflare Access on admin (if not done day one)  
2. Re-check JWT role from DB on sensitive admin routes (don’t trust role claim alone forever)  
3. Turn off unused OpenAI key if AI features aren’t needed  
4. Backup: export Convex data periodically  
5. Monitor `/api/health` with a free uptime ping (Better Stack / UptimeRobot free)

---

## Quick links

| Doc | Use |
|-----|-----|
| [DEPLOY.md](./DEPLOY.md) | Detailed deploy steps & env tables |
| [RUN.md](./RUN.md) | Local development |
| [backend/.env.example](./backend/.env.example) | Full backend env template |
| [CONTEXT.md](./CONTEXT.md) | Real business contact / brand facts |

**Bottom line:** static sites free on Cloudflare, one small always-on API, Convex + Cloudinary free tiers, manual UPI (0% fees), secrets only on the server, admin behind Access.
