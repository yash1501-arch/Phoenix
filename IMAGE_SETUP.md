# Image Setup Guide

Replace Unsplash placeholder images with your own images from Google Drive.

## How to get a Google Drive image URL

1. Upload your image to Google Drive
2. Share it: right-click → **Share** → **General access → Anyone with the link**
3. Copy the file ID from the share URL:
   `https://drive.google.com/file/d/`**`FILE_ID`**`/view`
4. Use this URL in the code:
   ```
   https://drive.google.com/uc?export=view&id=FILE_ID
   ```

---

## Files to Edit

### 1. Landing page — Featured Destinations carousel
**`frontend/src/pages/Landing.jsx`** — lines 87–92

Replace the `image:` values in the `destinations` array:

```js
// Line 87  — Himalayas
{ name: 'Himalayas', ..., image: 'https://drive.google.com/uc?export=view&id=YOUR_ID', ... },
// Line 88  — Ladakh
{ name: 'Ladakh', ..., image: 'https://drive.google.com/uc?export=view&id=YOUR_ID', ... },
// Line 89  — Kashmir
{ name: 'Kashmir', ..., image: 'https://drive.google.com/uc?export=view&id=YOUR_ID', ... },
// Line 90  — Sahyadris
{ name: 'Sahyadris', ..., image: 'https://drive.google.com/uc?export=view&id=YOUR_ID', ... },
// Line 91  — Spiti
{ name: 'Spiti', ..., image: 'https://drive.google.com/uc?export=view&id=YOUR_ID', ... },
// Line 92  — Meghalaya
{ name: 'Meghalaya', ..., image: 'https://drive.google.com/uc?export=view&id=YOUR_ID', ... },
```

### 2. Landing page — Adventure Categories grid
**`frontend/src/pages/Landing.jsx`** — lines 96–101

Replace the `image:` values in the `categories` array (used in the "Choose Your Adventure" section):

```js
// Line 96  — Mountain Trekking
{ name: 'Mountain Trekking', ..., image: 'https://drive.google.com/uc?export=view&id=YOUR_ID' },
// Line 97  — Camping
{ name: 'Camping', ..., image: 'https://drive.google.com/uc?export=view&id=YOUR_ID' },
// Line 98  — Backpacking
{ name: 'Backpacking', ..., image: 'https://drive.google.com/uc?export=view&id=YOUR_ID' },
// Line 99  — Photography Tours
{ name: 'Photography Tours', ..., image: 'https://drive.google.com/uc?export=view&id=YOUR_ID' },
// Line 100 — Snow Expeditions
{ name: 'Snow Expeditions', ..., image: 'https://drive.google.com/uc?export=view&id=YOUR_ID' },
// Line 101 — Wilderness
{ name: 'Wilderness', ..., image: 'https://drive.google.com/uc?export=view&id=YOUR_ID' },
```

### 3. Landing page — Gallery section
**`frontend/src/pages/Landing.jsx`** — lines 139–146

Replace URLs in the `galleryImages` array (8 images used in the masonry gallery):

```js
const galleryImages = [
  'https://drive.google.com/uc?export=view&id=YOUR_ID',  // line 139
  'https://drive.google.com/uc?export=view&id=YOUR_ID',  // line 140
  'https://drive.google.com/uc?export=view&id=YOUR_ID',  // line 141
  'https://drive.google.com/uc?export=view&id=YOUR_ID',  // line 142
  'https://drive.google.com/uc?export=view&id=YOUR_ID',  // line 143
  'https://drive.google.com/uc?export=view&id=YOUR_ID',  // line 144
  'https://drive.google.com/uc?export=view&id=YOUR_ID',  // line 145
  'https://drive.google.com/uc?export=view&id=YOUR_ID',  // line 146
];
```

### 4. Landing page — Our Story collage
**`frontend/src/pages/Landing.jsx`** — lines 534, 537, 542, 545

Replace `src` attributes on 4 `<img>` tags:

```jsx
// Line 534 — Mountain
<img src="https://drive.google.com/uc?export=view&id=YOUR_ID" ... />
// Line 537 — Camping
<img src="https://drive.google.com/uc?export=view&id=YOUR_ID" ... />
// Line 542 — Hiking
<img src="https://drive.google.com/uc?export=view&id=YOUR_ID" ... />
// Line 545 — Sunset
<img src="https://drive.google.com/uc?export=view&id=YOUR_ID" ... />
```

### 5. Landing page — CTA background
**`frontend/src/pages/Landing.jsx`** — line 811

Replace the `backgroundImage` URL:

```jsx
style={{ backgroundImage: 'url(https://drive.google.com/uc?export=view&id=YOUR_ID)' }}
```

### 6. Adventures component — fallback image
**`frontend/src/components/Adventures.jsx`** — lines 100 and 103

Replace the placeholder fallback image shown when an adventure has no image:

```jsx
// Line 100 — primary fallback
src={getImageUrl(adv.image_url) || 'https://drive.google.com/uc?export=view&id=YOUR_ID'}

// Line 103 — error fallback
onError={(e) => { e.target.src = 'https://drive.google.com/uc?export=view&id=YOUR_ID'; }}
```

### 7. AdventuresPage — fallback image
**`frontend/src/pages/AdventuresPage.jsx`** — lines 125 and 128

Same pattern as Adventures.jsx:

```jsx
// Line 125
src={getImageUrl(adv.image_url) || 'https://drive.google.com/uc?export=view&id=YOUR_ID'}
// Line 128
onError={(e) => { e.target.src = 'https://drive.google.com/uc?export=view&id=YOUR_ID'; }}
```

### 8. About page
**`frontend/src/pages/About.jsx`** — line 118

Replace the image in the story section:

```jsx
src="https://drive.google.com/uc?export=view&id=YOUR_ID"
```

### 9. Adventure Detail page — hero fallback
**`frontend/src/pages/AdventureDetail.jsx`** — lines 387 and 391

```jsx
// Line 387
src={getImageUrl(adventure.image_url) || 'https://drive.google.com/uc?export=view&id=YOUR_ID'}
// Line 391
onError={e => { e.target.src = 'https://drive.google.com/uc?export=view&id=YOUR_ID'; }}
```

### 10. Blog page
**`frontend/src/pages/Blog.jsx`** — lines 20, 31, 42, 53, 64, 75

Replace `src` on each blog card image:

```jsx
// Line 20
src="https://drive.google.com/uc?export=view&id=YOUR_ID"
// Line 31
src="https://drive.google.com/uc?export=view&id=YOUR_ID"
// Line 42
src="https://drive.google.com/uc?export=view&id=YOUR_ID"
// Line 53
src="https://drive.google.com/uc?export=view&id=YOUR_ID"
// Line 64
src="https://drive.google.com/uc?export=view&id=YOUR_ID"
// Line 75
src="https://drive.google.com/uc?export=view&id=YOUR_ID"
```

### 11. User Dashboard — booking fallback
**`frontend/src/pages/UserDashboard.jsx`** — line 194

```jsx
src={getImageUrl(booking.adventures?.image_url) || 'https://drive.google.com/uc?export=view&id=YOUR_ID'}
```

---

## Quick Reference: All files & line numbers

| File | Lines |
|------|-------|
| `frontend/src/pages/Landing.jsx` | 87–92, 96–101, 139–146, 534, 537, 542, 545, 811 |
| `frontend/src/components/Adventures.jsx` | 100, 103 |
| `frontend/src/pages/AdventuresPage.jsx` | 125, 128 |
| `frontend/src/pages/About.jsx` | 118 |
| `frontend/src/pages/AdventureDetail.jsx` | 387, 391 |
| `frontend/src/pages/Blog.jsx` | 20, 31, 42, 53, 64, 75 |
| `frontend/src/pages/UserDashboard.jsx` | 194 |
