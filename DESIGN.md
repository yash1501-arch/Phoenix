# Design System — Phoenix Adventures

## Visual Theme

**Light trail.** Warm cream surfaces, deep forest primary, terracotta accent. Photography-led, mobile-first. Source: `CONTEXT.md`.

## Color

| Token | Value | Role |
|-------|-------|------|
| `--mist` | `#FAF7F1` | Page background (warm off-white) |
| `--mist-muted` | `#EBE4D8` | Subtle light fills |
| `--stone` | `#2F4A3D` | Forest panels / dark surfaces |
| `--stone-soft` | `#3A5A4B` | Elevated forest panels |
| `--ember` | `#C1622D` | Primary accent / CTAs (terracotta) |
| `--ember-bright` | `#D4783F` | Hover |
| `--ember-deep` | `#A04E22` | Pressed |
| `--moss` | `#2F4A3D` | Nature complement (= forest) |
| `--text-on-dark` | `#FAF7F1` | Text on forest |
| `--text-muted-dark` | `#C8C2B6` | Secondary on forest |
| `--text-on-light` | `#2B2B26` | Charcoal on cream |
| `--text-muted-light` | `#5C5A52` | Secondary on cream |

Compat aliases (`ink`/`paper`/`gold`) map to the light system so older pages keep working.

Strategy: **Light-first** — cream carries most marketing surfaces; forest for contrast bands (footer, stats, hero overlays); terracotta ≤15% for action.

## Typography

- **Display:** `Unbounded` — characterful, legible headings
- **Body:** `Karla` — clean modern sans for UI and long copy

Fluid display scale via `clamp()`. Letter-spacing on display ≥ -0.03em.

## Layout

- Max content: 1280px; wide media: 1440px
- Section rhythm: `clamp(4rem, 10vw, 9rem)`
- Hero: full-bleed `100svh`, brand name dominant, one headline, one CTA group
- Discovery: photo-forward destination/trek tiles, not icon-card soup
- Mobile: sticky bottom book bar where conversion matters

## Components

- **Buttons:** Terracotta fill (primary), mist outline on forest, forest fill on light. Radius 4–8px max.
- **Cards:** Use only for interactive trip tiles; image-dominant, sharp corners (8px).
- **Icons:** Lucide; animate on hover (subtle rotate/scale) and for loading/success states.
- **Nav:** Transparent over hero (light text) → solid cream on scroll (forest text); large mobile drawer.

## Motion

- Library: Framer Motion
- Hero: staggered title + Ken Burns crossfade (respect reduced motion)
- Icons: 200–300ms hover scale/rotate; trail-marker pulse on primary CTA
- Page: crossfade via existing PageTransition
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo)
- Ban: bounce, elastic, uniform fade-up on every section

## Imagery

Full-bleed Sahyadri / Maharashtra outdoor photography. One decisive hero image > five mediocre. Alt text describes place and mood.
