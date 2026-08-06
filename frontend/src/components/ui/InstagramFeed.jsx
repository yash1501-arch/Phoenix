import { useMemo, useState } from 'react';
import { Instagram, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal, StaggerContainer, StaggerItem, IconMotion, EASE } from './Motion';

function extractShortcode(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]{6,})/i);
  if (m) return { shortcode: m[2], type: m[1].toLowerCase() };
  const bare = url.match(/^([A-Za-z0-9_-]{6,})$/);
  return bare ? { shortcode: bare[1], type: 'p' } : null;
}

function buildEmbedUrl(shortcode, type = 'p', autoplay = false) {
  const base = type === 'reel' || type === 'reels'
    ? `https://www.instagram.com/reel/${shortcode}/embed/`
    : `https://www.instagram.com/p/${shortcode}/embed/`;
  const params = autoplay ? '?hidecaption=1&autoplay=1' : '?hidecaption=1';
  return base + params;
}

const isValid = (u) => Boolean(extractShortcode(u));

const Lightbox = ({ src, onClose }) => (
  <AnimatePresence>
    {src && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Instagram post viewer"
        className="fixed inset-0 z-[60] bg-stone/95 flex items-center justify-center p-4"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-mist/80 hover:text-mist p-2 rounded-md bg-mist/10"
        >
          <X size={22} />
        </button>
        <motion.iframe
          key={src}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          onClick={(e) => e.stopPropagation()}
          src={src}
          title="Instagram post"
          className="w-full max-w-[468px] h-[80vh] max-h-[700px] bg-white rounded-lg shadow-lift"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </motion.div>
    )}
  </AnimatePresence>
);

const Card = ({ url, onOpen }) => {
  const parsed = extractShortcode(url);
  if (!parsed) return null;
  const { shortcode, type } = parsed;
  const isReel = type === 'reel' || type === 'reels';
  const href = isReel
    ? `https://www.instagram.com/reel/${shortcode}/`
    : `https://www.instagram.com/p/${shortcode}/`;
  const [hovered, setHovered] = useState(false);
  return (
    <StaggerItem>
      <button
        type="button"
        onClick={() => onOpen(buildEmbedUrl(shortcode, type))}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="group relative aspect-square w-full overflow-hidden rounded-lg border border-stone/10 bg-mist-muted shadow-smoke transition-shadow hover:shadow-card"
      >
        <iframe
          key={`${shortcode}-${hovered && isReel ? 'play' : 'idle'}`}
          src={buildEmbedUrl(shortcode, type, hovered && isReel)}
          title={`Instagram ${type} ${shortcode}`}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
          className="pointer-events-none absolute inset-0 h-[120%] w-[120%] -translate-x-[8%] -translate-y-[8%] scale-[0.83] origin-top-left border-0 bg-white"
          tabIndex={-1}
          scrolling="no"
        />
        {isReel && !hovered && (
          <div className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-md bg-stone/70 text-mist pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="inline-flex items-center gap-1.5 text-mist text-xs font-semibold">
            <Instagram size={14} /> {isReel ? 'Open reel' : 'Open post'}
          </span>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Open on Instagram"
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-mist/15 text-mist hover:bg-ember transition"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </button>
    </StaggerItem>
  );
};

export default function InstagramFeed({ posts = [], handle = '@phoenixadventures' }) {
  const [open, setOpen] = useState(null);

  const valid = useMemo(() => posts.filter(isValid), [posts]);

  if (valid.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-mist">
      <div className="container">
        <Reveal variant="rise" className="text-center mb-12">
          <p className="kicker !text-ember mb-4 inline-flex items-center gap-2 justify-center">
            <IconMotion>
              <Instagram size={14} />
            </IconMotion>
            From the trail
          </p>
          <h2 className="font-display text-display-lg text-stone font-semibold mb-4">
            Follow the journey on{' '}
            <a
              href={`https://www.instagram.com/${handle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ember hover:text-ember-bright transition-colors"
            >
              {handle}
            </a>
          </h2>
          <p className="text-muted max-w-2xl mx-auto text-base md:text-lg">
            Real-time dispatches from the field — sunrises, summits, and the people we trek with.
          </p>
        </Reveal>

        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {valid.slice(0, 8).map((url) => (
            <Card key={url} url={url} onOpen={setOpen} />
          ))}
        </StaggerContainer>

        <Reveal variant="fade" className="mt-10 text-center">
          <a
            href={`https://www.instagram.com/${handle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary inline-flex"
          >
            <Instagram size={16} /> Follow on Instagram
          </a>
        </Reveal>
      </div>

      <Lightbox src={open} onClose={() => setOpen(null)} />
    </section>
  );
}
