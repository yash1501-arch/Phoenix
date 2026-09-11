import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink, MapPin } from 'lucide-react';
import { publicSettingsAPI } from '../../utils/api';
import { CURATED_GOOGLE_REVIEWS, GOOGLE_PLACE } from '../../data/googleReviews';

/**
 * Google Reviews showcase — 4★ and 5★ only.
 * Prefers settings.google_reviews (admin-editable); falls back to curated verified quotes.
 * TODO: When GOOGLE_MAPS_API_KEY is set, wire Places Details API for live refresh.
 */
function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function normalizeReviews(raw) {
  let list = raw;
  if (typeof list === 'string') list = safeJsonParse(list);
  if (!Array.isArray(list)) return [];
  return list
    .filter((r) => r && r.text && r.name && Number(r.rating) >= 4)
    .map((r) => ({
      name: String(r.name),
      rating: Number(r.rating),
      text: String(r.text),
      date: r.date || r.relative_time_description || null,
      avatar_url: r.avatar_url || r.profile_photo_url || null,
    }));
}

const GoogleReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [mapsUrl, setMapsUrl] = useState(GOOGLE_PLACE.mapsUrl);
  const [rating, setRating] = useState(GOOGLE_PLACE.rating);
  const [reviewCount, setReviewCount] = useState(GOOGLE_PLACE.reviewCount);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    publicSettingsAPI.getAll().then((all) => {
      if (!alive) return;
      const fromSettings = normalizeReviews(all.google_reviews);
      const fallback = normalizeReviews(CURATED_GOOGLE_REVIEWS);
      setReviews(fromSettings.length ? fromSettings : fallback);
      if (all.google_maps_url || all.maps_url) setMapsUrl(all.google_maps_url || all.maps_url);
      if (all.google_rating) setRating(Number(all.google_rating) || GOOGLE_PLACE.rating);
      if (all.google_review_count) setReviewCount(Number(all.google_review_count) || GOOGLE_PLACE.reviewCount);
      setLoading(false);
    }).catch(() => {
      if (!alive) return;
      setReviews(normalizeReviews(CURATED_GOOGLE_REVIEWS));
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-ember border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-cream/20 rounded-lg bg-panel-soft/40">
        <p className="font-display text-xl text-cream mb-2">{rating} / 5 on Google</p>
        <p className="text-cream/60 mb-6 max-w-md mx-auto text-sm leading-relaxed">
          Read verified reviews on our Google Business Profile.
        </p>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-ink inline-flex">
          <MapPin size={16} /> See reviews on Google Maps
        </a>
      </div>
    );
  }

  const shown = reviews.slice(0, 6);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="meta mb-2 !text-cream/65">From Google</p>
          <p className="text-sm text-cream/75 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-gold-deep">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} size={12} className={j < Math.round(rating) ? 'fill-gold-deep text-gold-deep' : 'text-cream/25'} />
              ))}
            </span>
            <span>{rating} · {reviewCount} reviews on Google</span>
            <span className="text-cream/40">·</span>
            <span>Showing {shown.length} recent 4–5★ reviews</span>
          </p>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ember hover:text-ember-bright transition-colors"
        >
          View all on Google
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shown.map((r, i) => (
          <motion.figure
            key={`${r.name}-${i}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="bg-mist-subtle border border-stone/10 p-6 flex flex-col gap-4 relative rounded-lg"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1" aria-label={`${r.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    size={13}
                    className={j < (r.rating || 5) ? 'fill-gold-deep text-gold-deep' : 'text-ink/15'}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Google</span>
            </div>
            <blockquote className="text-sm leading-relaxed text-stone/80 flex-1 line-clamp-6">
              &ldquo;{r.text}&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-3 pt-3 border-t border-stone/10">
              {r.avatar_url ? (
                <img
                  src={r.avatar_url}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="w-9 h-9 rounded-full bg-panel text-cream flex items-center justify-center text-xs font-bold">
                  {(r.name || '?').charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone truncate">{r.name}</p>
                {r.date && (
                  <p className="text-xs text-muted">{r.date}</p>
                )}
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-cream/60">
        Reviews sourced from Google. Ratings shown are 4★ and 5★ only.
      </p>
    </div>
  );
};

export default GoogleReviews;
