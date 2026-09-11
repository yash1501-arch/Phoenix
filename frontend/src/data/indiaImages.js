/**
 * Curated Unsplash photos tagged / located in India
 * (Maharashtra forts, Sahyadri trails, Himalayan camps & peaks).
 * Prefer landscape crops for wide UI panels so sky-heavy shots don't wash out.
 */
const img = (id, w = 1200, h = null) => {
  const size = h ? `w=${w}&h=${h}&fit=crop` : `w=${w}&fit=crop`;
  return `https://images.unsplash.com/${id}?q=80&${size}&auto=format`;
};

/** Raigad Fort ridge — Maharashtra (can read sky-heavy; prefer aerial for panels) */
export const IMG_RAIGAD_FORT = (w, h) => img('photo-1522839739452-214ac4843019', w, h);

/** Valley around Raigad Fort */
export const IMG_RAIGAD_VALLEY = (w, h) => img('photo-1560756718-59609860409c', w, h);

/** Pratapgad hill fort — Maharashtra (portrait / sky-heavy; avoid in wide panels) */
export const IMG_PRATAPGAD = (w, h) => img('photo-1710317981465-c6d04de48c67', w, h);

/** Lohagad monsoon ridge trek — Western Ghats */
export const IMG_LOHAGAD = (w, h) => img('photo-1663089555977-35842f16da8a', w, h);

/** Rajmachi fort approach trail — Lonavala */
export const IMG_RAJMACHI = (w, h) => img('photo-1642516864651-ed817c229a9f', w, h);

/** Rajmachi fort aerial — clear ridge + stone walls over green forest */
export const IMG_RAJMACHI_AERIAL = (w, h) => img('photo-1712186870325-00427d06341a', w, h);

/** Night camp under stars — Kaza, Spiti, India */
export const IMG_KAZA_CAMP = (w, h) => img('photo-1531242450852-175ae27d351c', w, h);

/** Ladakh Himalaya with prayer flags */
export const IMG_LADAKH = (w, h) => img('photo-1758468205157-404815a21784', w, h);

/** Snow peaks / Himalayan forest ridge (India) */
export const IMG_HIMALAYA_PEAKS = (w, h) => img('photo-1605649487212-47bdab064df7', w, h);

/** Himalayan winter trail trek */
export const IMG_HIMALAYA_TREK = (w, h) => img('photo-1626621341517-bbf3d9990a23', w, h);

/** Mountain ridges / adventure (Himachal-style) */
export const IMG_HIMALAYA_RIDGE = (w, h) => img('photo-1618083707368-b3823daa2726', w, h);

/** Safe default when an adventure image fails */
export const IMG_FALLBACK = IMG_LOHAGAD(800);
