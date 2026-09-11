import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import {
  IMG_RAJMACHI_AERIAL,
  IMG_LOHAGAD,
  IMG_KAZA_CAMP,
  IMG_LADAKH,
  IMG_HIMALAYA_PEAKS,
  IMG_FALLBACK,
} from '../data/indiaImages';

const SLIDES = [
  // Dark night camp — high contrast for cream / ember hero type
  { src: IMG_KAZA_CAMP(2000), caption: 'Camp under Spiti skies' },
  { src: IMG_RAJMACHI_AERIAL(2000), caption: 'Rajmachi ridge over the Sahyadris' },
  { src: IMG_LOHAGAD(2000), caption: 'Monsoon trails in the Western Ghats' },
  { src: IMG_LADAKH(2000), caption: 'Ladakh peaks and prayer flags' },
  { src: IMG_HIMALAYA_PEAKS(2000), caption: 'Snow peaks of the Indian Himalaya' },
];
const SLIDE_INTERVAL_MS = 6000;
const FADE_MS = 1.1;

const Hero = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  // Preload every slide once so fades don't flash empty frames
  useEffect(() => {
    SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.src;
    });
  }, []);

  const goTo = useCallback((index) => {
    setActive(((index % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => {
    setActive((a) => (a + 1) % SLIDES.length);
  }, []);

  // Auto-advance; restarts cleanly after manual clicks / pause
  useEffect(() => {
    if (paused || reduceMotion) return undefined;
    timerRef.current = window.setInterval(next, SLIDE_INTERVAL_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [paused, reduceMotion, active, next]);

  return (
    <section
      className="relative min-h-[100svh] flex items-end md:items-center overflow-hidden bg-panel"
      aria-label="Hero — Phoenix Adventures"
      aria-roledescription="carousel"
    >
      <div className="absolute inset-0" aria-hidden="true">
        {/* Keep previous + current layered so crossfade never blanks */}
        <AnimatePresence initial={false}>
          <motion.img
            key={active}
            src={SLIDES[active].src}
            alt={SLIDES[active].caption}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 1 }}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: reduceMotion ? 0.2 : FADE_MS, ease: [0.22, 1, 0.36, 1] },
              scale: {
                duration: reduceMotion ? 0 : SLIDE_INTERVAL_MS / 1000,
                ease: 'linear',
              },
            }}
            loading={active === 0 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            onError={(e) => {
              if (e.currentTarget.src !== IMG_FALLBACK) {
                e.currentTarget.src = IMG_FALLBACK;
              }
            }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
      </div>

      <div className="container relative z-10 pb-28 pt-32 md:py-36 lg:py-44">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 mb-6"
          >
            <motion.span
              animate={reduceMotion ? {} : { rotate: [0, 15, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex text-ember"
            >
              <Compass size={18} strokeWidth={2.2} />
            </motion.span>
            <span className="text-ember text-xs font-bold tracking-[0.16em] uppercase">
              Phoenix Adventures · Est. 22 March 2023
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-cream font-semibold"
            style={{ fontSize: 'clamp(2.6rem, 8vw, 5.25rem)', lineHeight: 1.02, letterSpacing: '-0.025em' }}
          >
            Walk into
            <br />
            <span className="text-ember-bright">India&apos;s wild.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-base md:text-lg text-cream/85 max-w-xl leading-relaxed"
          >
            Discover the great outdoors with our adventure tribe. Fort-led treks across the Sahyadris — safety-first, own pace, end-to-end logistics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-9"
          >
            <button
              type="button"
              onClick={() => navigate('/adventures')}
              className="btn btn-primary btn-trail group"
            >
              Find your adventure
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button type="button" onClick={() => navigate('/treks')} className="btn btn-outline group">
              Browse treks
              <ArrowRight size={16} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream/75"
          >
            <span><strong className="text-cream font-semibold">15,000+</strong> explorers</span>
            <span className="text-ember">·</span>
            <span><strong className="text-cream font-semibold">4.9★</strong> rated</span>
            <span className="text-ember">·</span>
            <span><strong className="text-cream font-semibold">500+</strong> trips</span>
          </motion.div>
        </div>
      </div>

      <div
        className="absolute bottom-8 right-5 md:right-10 z-20 flex flex-col items-end gap-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="text-xs md:text-sm text-cream/75 font-medium"
          >
            {SLIDES[active].caption}
          </motion.p>
        </AnimatePresence>
        <div className="flex gap-2" role="tablist" aria-label="Hero slides">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              role="tab"
              aria-selected={i === active}
              aria-label={`Show slide ${i + 1}: ${SLIDES[i].caption}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'w-9 bg-ember' : 'w-4 bg-cream/30 hover:bg-cream/55'
              }`}
            />
          ))}
        </div>
      </div>

      {!reduceMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          aria-hidden
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-cream/55 pointer-events-none"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Scroll</span>
          <motion.span
            animate={{ scaleY: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="block w-px h-8 bg-gradient-to-b from-mist/50 to-transparent origin-top"
          />
        </motion.div>
      )}
    </section>
  );
};

export default Hero;
