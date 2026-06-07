import { useMemo, useState } from 'react';
import { Instagram, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Parse an Instagram post or reel URL and return { shortcode, type }.
// Accepts: /p/CODE/, /reel/CODE/, /reels/CODE/, /tv/CODE/, full https://www.instagram.com/...
function extractShortcode(url) {
    if (!url || typeof url !== 'string') return null;
    const m = url.match(/instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]{6,})/i);
    if (m) return { shortcode: m[2], type: m[1].toLowerCase() };
    const bare = url.match(/^([A-Za-z0-9_-]{6,})$/);
    return bare ? { shortcode: bare[1], type: 'p' } : null;
}

// Build the official Instagram embed URL. We append ?hidecaption=1 to keep the feed tidy.
// `autoplay` triggers the reel/video to play (used on hover for reels).
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
                className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10"
                >
                    <X size={22} />
                </button>
                <motion.iframe
                    key={src}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={(e) => e.stopPropagation()}
                    src={src}
                    title="Instagram post"
                    className="w-full max-w-[468px] h-[80vh] max-h-[700px] bg-white rounded-2xl shadow-2xl"
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
        <motion.button
            type="button"
            onClick={() => onOpen(buildEmbedUrl(shortcode, type))}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            whileHover={{ y: -4 }}
            className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-zinc-100 shadow-professional transition-all hover:shadow-professional-lg"
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
                <div className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-white pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="inline-flex items-center gap-1.5 text-white text-xs font-semibold">
                    <Instagram size={14} /> {isReel ? 'Open reel' : 'Open post'}
                </span>
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Open on Instagram"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/15 text-white hover:bg-white/25 transition"
                >
                    <ExternalLink size={14} />
                </a>
            </div>
        </motion.button>
    );
};

export default function InstagramFeed({ posts = [], handle = '@phoenixadventures' }) {
    const [open, setOpen] = useState(null);

    const valid = useMemo(() => posts.filter(isValid), [posts]);

    if (valid.length === 0) {
        return null; // Hide section if admin hasn't configured any posts
    }

    return (
        <section className="py-16 md:py-20 bg-white">
            <div className="container">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/10 via-fuchsia-500/10 to-amber-500/10 border border-pink-500/20 rounded-full mb-5">
                        <Instagram size={14} className="text-pink-500" />
                        <span className="text-pink-500 text-xs font-bold tracking-wider uppercase">
                            From Instagram
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4">
                        Follow the journey on{' '}
                        <a
                            href={`https://www.instagram.com/${handle.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-500 hover:brightness-110 transition"
                        >
                            {handle}
                        </a>
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">
                        Real-time dispatches from the field — sunrises, summits, and the people we trek with.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {valid.slice(0, 8).map((url) => (
                        <Card key={url} url={url} onOpen={setOpen} />
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <a
                        href={`https://www.instagram.com/${handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-500 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition"
                    >
                        <Instagram size={16} /> Follow on Instagram
                    </a>
                </div>
            </div>

            <Lightbox src={open} onClose={() => setOpen(null)} />
        </section>
    );
}
