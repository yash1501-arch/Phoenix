import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import heroBg from '../assets/images/hero-bg.png';

const SLIDES = [
  { src: heroBg, caption: 'Sahyadris at dusk' },
  {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2000&auto=format&fit=crop',
    caption: 'Himalayan high passes',
  },
  {
    src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop',
    caption: 'Alpine meadows',
  },
  {
    src: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2000&auto=format&fit=crop',
    caption: 'Monsoon trails',
  },
];

const SLIDE_INTERVAL_MS = 6500;

const Hero = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const t = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, reduceMotion]);

  useEffect(() => {
    const next = SLIDES[(active + 1) % SLIDES.length];
    if (typeof next?.src === 'string') {
      const img = new Image();
      img.src = next.src;
    }
  }, [active]);

  return (
    <section
      className="relative min-h-[100svh] flex items-end md:items-center overflow-hidden bg-stone"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero — Phoenix Adventures"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <AnimatePresence mode="sync" initial={false}>
          <motion.img
            key={active}
            src={SLIDES[active].src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
              scale: { duration: reduceMotion ? 0 : 8, ease: 'linear' },
            }}
            loading={active === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-stone via-stone/55 to-stone/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone/90 via-stone/40 to-transparent" />
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
            className="font-display text-mist font-semibold"
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
            className="mt-6 text-base md:text-lg text-mist/70 max-w-xl leading-relaxed"
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
              onClick={() => navigate('/adventures')}
              className="btn btn-primary btn-trail group"
            >
              Find your adventure
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button onClick={() => navigate('/treks')} className="btn btn-outline group">
              Browse treks
              <ArrowRight size={16} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-sm text-mist/55"
          >
            <span><strong className="text-mist font-semibold">15,000+</strong> explorers</span>
            <span className="text-ember">·</span>
            <span><strong className="text-mist font-semibold">4.9★</strong> rated</span>
            <span className="text-ember">·</span>
            <span><strong className="text-mist font-semibold">500+</strong> trips</span>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-8 right-5 md:right-10 z-20 flex flex-col items-end gap-3">
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-xs md:text-sm text-mist/60 font-medium"
          >
            {SLIDES[active].caption}
          </motion.p>
        </AnimatePresence>
        <div className="flex gap-2" role="tablist" aria-label="Hero slides">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              role="tab"
              aria-selected={i === active}
              aria-label={`Slide ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === active ? 'w-9 bg-ember' : 'w-4 bg-mist/25 hover:bg-mist/50'
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
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-mist/40 pointer-events-none"
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
