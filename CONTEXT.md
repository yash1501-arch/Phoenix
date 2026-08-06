# Phoenix Adventures — Content & Data Brief for Cursor

Paste this whole file into Cursor chat (or drop it in the repo as `CONTEXT.md` and
`@`-reference it). The app already exists — this is the missing real-world data
Cursor needs to stop guessing/placeholder-ing content.

**Guardrail for the agent:** use only the facts below. Do not invent awards,
extra locations, staff bios, or numbers not listed here. If a section needs
something not in this brief, leave a `TODO:` comment instead of making it up.

## 1. Business Identity
- Name: Phoenix Adventures
- Category: Trekking & outdoor adventure tour operator, focused on Sahyadri range forts and Maharashtra outdoor destinations
- Established: 22 March 2023
- Brand voice: "Discover the great outdoors with our adventure tribe"
- Content themes: fort/history-led treks, safety-first, own pace, end-to-end logistics. Forts: Raigad, Rajgad, Torna, Sagargad, Hadsar, Pratapgad, Shivneri.
- Trek leader named in reviews: Onkar Oak — don't add bio without confirming.
  - TODO: Confirm Onkar Oak staff bio before adding to About/team pages.

## 2. Trust Stats (verbatim)
- Volunteers connected: 45+
- Trips completed: 500+
- Happy explorers: 15,000+
- Local guides: 50+
- Average rating: 4.9 / 5
Note: 139 Google reviews = review count, not explorer count. Do not merge these metrics.

## 3. Contact
- Phone: +91 93725 06447, +91 77580 79726
- Email: pheonixadventuress@gmail.com
  (spelled "pheonix" — do NOT "correct" to phoenix)

## 4. Location & Hours
- Address: Sindhudurg Building, 56/C8, Kandivali, Charkop, Sahyadri Nagar, Kandivali West, Mumbai, Maharashtra 400067, India
- Hours: Open daily, 9:00 AM – 10:00 PM
- Maps: https://maps.app.goo.gl/n5uUa7B6FQLKS5aZ6
- Coordinates: 19.2129911, 72.8301628
- Place ID: ChIJBZcX2Oy35zsRXjj7MoK62as

## 5. Social
- Instagram: https://www.instagram.com/phoenix_adventures__/
- Facebook: https://www.facebook.com/profile.php?id=61564975211438

## 6. Testimonials
TODO — do NOT invent or scrape review quotes. Options:
1. Embed live Google Reviews via Places API using place_id `ChIJBZcX2Oy35zsRXjj7MoK62as`
2. Client-provided 3–5 attributed quotes

## 7. Light Theme Palette (client request)
- Background warm off-white: ~#FAF7F1
- Primary deep forest/sage: ~#2F4A3D
- Accent terracotta/rust: ~#C1622D (CTAs)
- Text dark charcoal: ~#2B2B26
- Type: clean modern sans for body; characterful but legible headings

## 8. Tasks
1. Replace all wrong/placeholder identity & contact data across frontend (+ admin/settings defaults)
2. Wire maps (place_id / coordinates / maps URL) into Contact page
3. Apply light theme to design tokens
4. Neutralize fake testimonials; leave TODO for live Places API or client quotes
5. Update Convex settings DEFAULTS to match this brief
6. Ensure maps/place-related keys can be public in backend settings

## Values Reference Table

| Field | Correct value |
|-------|---------------|
| Name | Phoenix Adventures |
| Tagline / voice | Discover the great outdoors with our adventure tribe |
| Established | 22 March 2023 |
| Volunteers connected | 45+ |
| Trips completed | 500+ |
| Happy explorers | 15,000+ |
| Local guides | 50+ |
| Average rating | 4.9 / 5 |
| Google review count | 139 (separate metric — do not merge with explorers) |
| Phone | +91 93725 06447, +91 77580 79726 |
| WhatsApp (wa.me) | 919372506447 |
| Email | pheonixadventuress@gmail.com |
| Address | Sindhudurg Building, 56/C8, Kandivali, Charkop, Sahyadri Nagar, Kandivali West, Mumbai, Maharashtra 400067, India |
| Hours | Open daily, 9:00 AM – 10:00 PM |
| Maps link | https://maps.app.goo.gl/n5uUa7B6FQLKS5aZ6 |
| Coordinates | 19.2129911, 72.8301628 |
| Place ID | ChIJBZcX2Oy35zsRXjj7MoK62as |
| Instagram | https://www.instagram.com/phoenix_adventures__/ |
| Facebook | https://www.facebook.com/profile.php?id=61564975211438 |
