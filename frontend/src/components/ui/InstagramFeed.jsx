import { useEffect, useMemo, useState, useRef } from 'react';
import { Instagram, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal, IconMotion, EASE } from './Motion';

/** Pull post/reel shortcode from a full URL or bare code. */
export function extractShortcode(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const m = trimmed.match(
    /instagram\.com\/(?:[\w.-]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]{6,})/i
  );
  if (m) return { shortcode: m[2], type: m[1].toLowerCase() === 'reels' ? 'reel' : m[1].toLowerCase() };
  const bare = trimmed.match(/^([A-Za-z0-9_-]{6,})$/);
  return bare ? { shortcode: bare[1], type: 'p' } : null;
}

export function normalizeInstagramUrl(url) {
  const parsed = extractShortcode(url);
  if (!parsed) return null;
  const { shortcode, type } = parsed;
  return type === 'reel' || type === 'tv'
    ? `https://www.instagram.com/${type === 'tv' ? 'tv' : 'reel'}/${shortcode}/`
    : `https://www.instagram.com/p/${shortcode}/`;
}

function buildEmbedUrl(shortcode, type = 'p') {
  const path = type === 'reel' || type === 'reels' ? 'reel' : type === 'tv' ? 'tv' : 'p';
  return `https://www.instagram.com/${path}/${shortcode}/embed/?hidecaption=1&cr=1&v=14`;
}

/** Instagram still redirects /p/{code}/media/?size=l to a CDN jpeg (poster for video). */
function buildMediaUrl(shortcode, size = 'l') {
  return `https://www.instagram.com/p/${shortcode}/media/?size=${size}`;
}

/** Image proxy — keeps thumbnails loadable when IG hotlink/referrer blocks the browser. */
function buildProxiedThumb(shortcode, size = 720) {
  const target = `www.instagram.com/p/${shortcode}/media/?size=l`;
  return `https://images.weserv.nl/?url=${encodeURIComponent(target)}&w=${size}&h=${size}&fit=cover&a=attention&output=jpg`;
}

/**
 * Accept JSON array of URLs, objects `{ url, image? }`, newline/comma lists, or arrays.
 * Returns `{ href, image? }[]`.
 */
export function parseInstagramPosts(raw) {
  const coerce = (item) => {
    if (!item) return null;
    if (typeof item === 'string') {
      const href = normalizeInstagramUrl(item.trim());
      return href ? { href, image: null } : null;
    }
    if (typeof item === 'object') {
      const url = item.url || item.href || item.link || item.post || '';
      const href = normalizeInstagramUrl(String(url).trim());
      if (!href) return null;
      const image =
        item.image || item.thumb || item.thumbnail || item.cover || item.src || null;
      return { href, image: typeof image === 'string' && image.trim() ? image.trim() : null };
    }
    return null;
  };

  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(coerce).filter(Boolean);

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(coerce).filter(Boolean);
      if (typeof parsed === 'string') return parseInstagramPosts(parsed);
    } catch {
      /* plain text list */
    }
    return trimmed
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(coerce)
      .filter(Boolean);
  }

  return [];
}

/** Back-compat: callers that expect string[] still get URLs via .map(p => p.href) elsewhere. */
export function parseInstagramPostUrls(raw) {
  return parseInstagramPosts(raw).map((p) => p.href);
}

const Lightbox = ({ src, href, onClose }) => (
  <AnimatePresence>
    {src && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="dialog"
        aria-modal="true"
        aria-label="Instagram post viewer"
        className="fixed inset-0 z-[60] bg-panel/95 flex items-center justify-center p-3 sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 text-cream/80 hover:text-cream p-2 rounded-md bg-mist/10"
        >
          <X size={22} />
        </button>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 left-4 z-10 inline-flex items-center gap-2 text-sm font-semibold text-cream/80 hover:text-cream px-3 py-2 rounded-md bg-mist/10"
          >
            <Instagram size={16} /> Open on Instagram
          </a>
        )}
        <motion.iframe
          key={src}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          onClick={(e) => e.stopPropagation()}
          src={src}
          title="Instagram post"
          className="w-full max-w-[480px] h-[min(85vh,720px)] bg-mist-subtle rounded-lg shadow-lift border-0"
          allow="encrypted-media; picture-in-picture; clipboard-write"
          allowFullScreen
        />
      </motion.div>
    )}
  </AnimatePresence>
);

/**
 * When Instagram’s /media/ thumbnail 404s (common on newer posts),
 * crop the official embed so only the photo fills the square cell.
 */
const ClippedEmbed = ({ src }) => {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => {
      const w = el.clientWidth || 320;
      setScale(w / 320);
    };
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  return (
    <span ref={wrapRef} className="absolute inset-0 overflow-hidden pointer-events-none bg-panel/10" aria-hidden>
      <iframe
        src={src}
        title=""
        loading="lazy"
        tabIndex={-1}
        className="absolute left-0 top-0 max-w-none border-0"
        style={{
          width: 320,
          height: 560,
          transform: `translateY(-48px) scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </span>
  );
};

/**
 * Square mosaic tile — real photo fills the cell (Instagram / NatGeo style).
 * Thumbnail cascade: custom image → weserv proxy → IG /media/ → clipped embed.
 */
const MosaicTile = ({ post, index, onOpen }) => {
  const parsed = extractShortcode(post.href);
  const shortcode = parsed?.shortcode || '';
  const type = parsed?.type || 'p';
  const isReel = type === 'reel' || type === 'reels' || type === 'tv';
  const embed = shortcode ? buildEmbedUrl(shortcode, type) : null;

  const sources = useMemo(() => {
    if (!shortcode) return [];
    const list = [];
    if (post.image) list.push(post.image);
    list.push(buildProxiedThumb(shortcode));
    list.push(buildMediaUrl(shortcode, 'l'));
    return list;
  }, [post.image, shortcode]);

  const [srcIndex, setSrcIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);
  const [inView, setInView] = useState(index < 6);

  useEffect(() => {
    const el = imgRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!parsed || !embed) return null;

  const src = !failed && inView ? sources[srcIndex] : null;

  const onError = () => {
    if (srcIndex < sources.length - 1) {
      setLoaded(false);
      setSrcIndex((i) => i + 1);
    } else {
      setFailed(true);
    }
  };

  return (
    <motion.button
      ref={imgRef}
      type="button"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.28), ease: EASE }}
      onClick={() => onOpen({ embed, href: post.href })}
      aria-label={`View Instagram ${isReel ? 'reel' : 'photo'}`}
      className="group relative aspect-square w-full overflow-hidden bg-panel/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-inset"
    >
      {!loaded && !failed && (
        <span
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-panel/20 via-moss/30 to-panel/25"
          aria-hidden
        />
      )}

      {src && (
        <img
          src={src}
          alt=""
          loading={index < 6 ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={onError}
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {failed && inView && <ClippedEmbed src={embed} />}

      <span
        className="absolute inset-0 bg-panel/0 transition-colors duration-300 group-hover:bg-panel/45 group-focus-visible:bg-panel/45"
        aria-hidden
      />

      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        {isReel ? (
          <Play size={36} className="text-cream drop-shadow-md" fill="currentColor" />
        ) : (
          <Instagram size={32} className="text-cream drop-shadow-md" />
        )}
      </span>

      {isReel && (
        <span className="absolute top-2.5 right-2.5 text-cream drop-shadow-md" aria-hidden>
          <Play size={18} fill="currentColor" />
        </span>
      )}
    </motion.button>
  );
};

export default function InstagramFeed({
  posts = [],
  handle = '@phoenix_adventures__',
  compact = false,
}) {
  const [open, setOpen] = useState(null);

  const valid = useMemo(() => {
    const seen = new Set();
    const out = [];
    const list = Array.isArray(posts) && posts.length && typeof posts[0] === 'object' && posts[0]?.href
      ? posts
      : parseInstagramPosts(posts);
    for (const item of list) {
      const href = item?.href || normalizeInstagramUrl(item);
      if (!href || seen.has(href)) continue;
      seen.add(href);
      out.push({
        href,
        image: item?.image || null,
      });
    }
    return out;
  }, [posts]);

  const handleSlug = String(handle || '@phoenix_adventures__').replace(/^@/, '');

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (valid.length === 0) return null;

  return (
    <section className={`${compact ? 'py-10 md:py-14' : 'py-16 md:py-24'} bg-mist`}>
      <div className="container">
        <Reveal variant="rise" className={`text-center ${compact ? 'mb-7' : 'mb-10'}`}>
          <p className="kicker !text-ember mb-3 inline-flex items-center gap-2 justify-center">
            <IconMotion>
              <Instagram size={14} />
            </IconMotion>
            From the trail
          </p>
          <h2 className="font-display text-display-lg text-stone font-semibold mb-3">
            Follow the journey on{' '}
            <a
              href={`https://www.instagram.com/${handleSlug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ember hover:text-ember-bright transition-colors"
            >
              @{handleSlug}
            </a>
          </h2>
          <p className="text-muted max-w-xl mx-auto text-base md:text-lg">
            Field moments from Sahyadri forts and Himalayan routes.
          </p>
        </Reveal>

        {/* Tight mosaic — image-first, minimal chrome (IG / NatGeo style) */}
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-1.5">
          {valid.slice(0, 12).map((post, i) => (
            <MosaicTile key={post.href} post={post} index={i} onOpen={setOpen} />
          ))}
        </div>

        <Reveal variant="fade" className="mt-10 text-center">
          <a
            href={`https://www.instagram.com/${handleSlug}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary inline-flex"
          >
            <Instagram size={16} /> Follow on Instagram
          </a>
        </Reveal>
      </div>

      <Lightbox
        src={open?.embed || null}
        href={open?.href || null}
        onClose={() => setOpen(null)}
      />
    </section>
  );
}
