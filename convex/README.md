# Convex functions (Phoenix Adventures)

This directory contains the Convex schema, queries, and mutations used by the backend.

## Layout

```
convex/                          ← npm workspace, holds the Convex CLI
├── package.json
├── .env.local                   ← points at the dev deployment (gitignored)
├── tsconfig.json
└── convex/                      ← Convex functions directory (read by the CLI)
    ├── _generated/              ← auto-generated bindings (do not edit)
    ├── convex.config.ts         ← Convex app config
    ├── schema.ts                ← database schema (tables + indexes)
    ├── users.ts                 ← users: getAll, getById, getByEmail, create, update, remove
    ├── adventures.ts            ← adventures: getAll, getById, create, update, remove, getDashboardStats
    ├── bookings.ts
    ├── payments.ts
    ├── reviews.ts
    ├── wishlist.ts
    ├── newsletter.ts
    ├── auditLog.ts
    └── settings.ts
```

> **Why the nested `convex/` folder?** The Convex CLI looks for the functions directory at `<cwd>/convex/` (where `<cwd>` is where you run `npx convex …` from). Our `package.json` lives at `D:\Desktop\Phoenix\convex\`, so the functions need to be in `D:\Desktop\Phoenix\convex\convex\`. Putting the `.ts` files at the top level (alongside `package.json`) results in a deploy with zero functions — the CLI bundles an empty module set and silently reports success.

## Deploying

**Rotate first:** a production deploy key was previously in git. Revoke it in Convex → Settings → Deploy Keys, then use only the new key in Render (`CONVEX_ADMIN_KEY`) and/or GitHub Actions secret `CONVEX_DEPLOY_KEY`. Never commit it or paste it in chat.

The backend talks to Convex with `CONVEX_URL` + `CONVEX_ADMIN_KEY`. After editing functions or schema, push from this folder:

### PowerShell (Windows)

```powershell
cd D:\Desktop\Phoenix\convex
$env:CONVEX_DEPLOY_KEY = "<production deploy key from Convex dashboard>"
npx convex deploy
```

### bash (macOS/Linux)

```bash
cd /path/to/Phoenix/convex
export CONVEX_DEPLOY_KEY="<production deploy key from Convex dashboard>"
npx convex deploy
```

> The deploy key lives in `backend/.env` as `CONVEX_ADMIN_KEY`. Re-using the same key/value pair here lets `npx convex deploy` authenticate non-interactively.

Expected output ends with: `✔ Deployed Convex functions to https://elated-eel-875.convex.cloud`

### Verifying the deploy

```bash
# List deployed functions
npx convex function-spec

# Quick smoke test of one query
npx convex run users:getAll '{}'
```

The first command should now list all your functions; the second should return `{"data":[],"pagination":{...}}` (empty users list on a fresh deploy).

## Local development against a dev deployment

For day-to-day work you usually want a separate **dev** deployment (free, isolated from prod data):

```bash
cd D:\Desktop\Phoenix\convex
npx convex dev
```

This will:

1. Prompt you to log in to Convex (opens browser).
2. Create (or reuse) a dev deployment and write its URL into `convex/.env.local`.
3. Watch for changes and hot-reload functions.

> If you switch between dev and prod, remember to either (a) unset `CONVEX_DEPLOY_KEY` and let `.env.local` drive the target, or (b) set `CONVEX_DEPLOY_KEY` to the right key for the target you want. The CLI gives `--prod` / `--preview-name` flags too, but those are ignored when `CONVEX_DEPLOY_KEY` is set in the environment.

## Schema migrations

`schema.ts` is the source of truth. Add/remove tables or indexes there, then `npx convex deploy`. The CLI computes a diff and applies it; existing data is preserved for compatible changes. Incompatible changes (e.g. removing a required field) will fail with a clear error — handle those by writing a one-off migration function in a new `.ts` file, deploying it, running it, and only then changing `schema.ts`.

## Functions available

| File          | Functions                                                                                              |
|---------------|--------------------------------------------------------------------------------------------------------|
| users.ts      | `getAll`, `getById`, `getByEmail`, `create`, `update`, `remove`                                        |
| adventures.ts | `getAll`, `getById`, `create`, `update`, `remove`, `getDashboardStats`                                 |
| bookings.ts   | `getAll`, `getByUser`, `getById`, `create`, `update`, `updateStatus`                                   |
| payments.ts   | `create`, `getByBookingId`, `updateStatus`                                                             |
| reviews.ts    | `add`, `getByAdventure`, `getByUser`, `getRatingSummary`, `approve`, `remove`                          |
| wishlist.ts   | `add`, `remove`, `getByUser`, `isWishlisted`, `countByUser`                                             |
| newsletter.ts | `subscribe`, `unsubscribe`, `getAll`                                                                   |
| auditLog.ts   | `list`                                                                                                 |
| settings.ts   | `getAll`, `set`                                                                                        |

Backend code calls these via `ConvexClient` in `backend/utils/convexClient.js`.
