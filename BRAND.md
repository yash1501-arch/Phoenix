# Brand logo usage

Official mark: circular hiker + sun (`frontend/public/logo.png`, `admin/public/logo.png`).

## Where it is used now

| Place | How |
|-------|-----|
| Browser tab (favicon) | `/favicon.png` |
| PWA / “Add to Home Screen” | `manifest.json` icons |
| Link previews (WhatsApp / FB) | Open Graph → `/logo.png` |
| Customer navbar | `BrandLogo` (mark + wordmark) |
| Footer | Larger mark + wordmark |
| Loading screen | Centered mark |
| UPI payment page | Mark beside booking ID (trust) |
| Admin sidebar | Circular mark |
| Admin login | Mark above sign-in |

## How to reuse in new UI

```jsx
import BrandLogo from '../components/BrandLogo';

<BrandLogo size={40} />                    // nav default
<BrandLogo size={56} inverted />           // on dark/stone backgrounds
<BrandLogo size={32} showWordmark={false} /> // icon-only (mobile chrome)
```

Files live in `public/` so paths are always `/logo.png` (no import needed).

## Best practices for this mark

- Prefer the **cropped emblem** (hiker + sun only) in nav/admin — `BrandLogo` zooms the PNG so baked-in “PHOENIX / Adventure” text is clipped out; UI wordmark sits beside it.
- Pass `fullArtwork` only when you want the complete circular logo including text (rare — splash/share).
- Keep a **white / cream** plate behind the circle on dark bars.
- Do **not** stretch or recolor the sun/hiker; don’t put it on busy photo backgrounds without a soft shadow or white ring.
- For email signatures / WhatsApp status, export a square crop of the same PNG.
