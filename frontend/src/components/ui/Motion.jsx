/* eslint-disable react-refresh/only-export-components */
import { motion, useReducedMotion } from 'framer-motion';
import { forwardRef } from 'react';

/** Shared out-expo curve from DESIGN.md */
export const EASE = [0.16, 1, 0.3, 1];

const DEFAULT_VIEWPORT = { once: true, amount: 0.15 };

/** Instant show when user prefers reduced motion */
const reducedShow = { opacity: 1, y: 0, x: 0, scale: 1, filter: 'none' };

function useMotionSafe() {
  const prefersReduced = useReducedMotion();
  return Boolean(prefersReduced);
}

// ── Stagger list ─────────────────────────────────────────────────────────────

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.06 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

export const StaggerContainer = ({
  children,
  className = '',
  viewport = DEFAULT_VIEWPORT,
  as = 'div',
  ...rest
}) => {
  const reduced = useMotionSafe();
  const MotionEl = motion[as] || motion.div;
  const Static = as;
  if (reduced) {
    return (
      <Static className={className} {...rest}>
        {children}
      </Static>
    );
  }
  return (
    <MotionEl
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      {...rest}
    >
      {children}
    </MotionEl>
  );
};

const Item = forwardRef(({ children, className = '', as = 'div', ...rest }, ref) => {
  const reduced = useMotionSafe();
  const MotionEl = motion[as] || motion.div;
  const Static = as;
  if (reduced) {
    return (
      <Static ref={ref} className={className} {...rest}>
        {children}
      </Static>
    );
  }
  return (
    <MotionEl ref={ref} variants={staggerItem} className={className} {...rest}>
      {children}
    </MotionEl>
  );
});
Item.displayName = 'StaggerItem';
export const StaggerItem = Item;

// ── Reveal variants (intentionally NOT all identical fade-up) ────────────────

const REVEAL = {
  rise: {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -36 },
    show: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: 36 },
    show: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94 },
    show: { opacity: 1, scale: 1 },
  },
  clip: {
    hidden: { opacity: 0, clipPath: 'inset(12% 0 12% 0)' },
    show: { opacity: 1, clipPath: 'inset(0% 0 0% 0)' },
  },
};

/**
 * Scroll reveal — pick a `variant` so sections don't all animate the same way.
 * @param {'rise'|'fade'|'slideLeft'|'slideRight'|'scale'|'clip'} variant
 */
export const Reveal = ({
  children,
  className = '',
  delay = 0,
  duration = 0.55,
  variant = 'rise',
  viewport = DEFAULT_VIEWPORT,
  as = 'div',
  ...rest
}) => {
  const reduced = useMotionSafe();
  const MotionEl = motion[as] || motion.div;
  const presets = REVEAL[variant] || REVEAL.rise;

  if (reduced) {
    const Static = as === 'div' ? 'div' : as;
    return (
      <Static className={className} {...rest}>
        {children}
      </Static>
    );
  }

  return (
    <MotionEl
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      variants={{
        hidden: presets.hidden,
        show: {
          ...presets.show,
          transition: { duration, delay, ease: EASE },
        },
      }}
      {...rest}
    >
      {children}
    </MotionEl>
  );
};

/** Gentle scale-in for cards / feature blocks */
export const Pop = ({
  children,
  className = '',
  delay = 0,
  viewport = { once: true, margin: '-50px' },
}) => {
  const reduced = useMotionSafe();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={viewport}
      transition={{ duration: 0.45, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Icon hover micro-motion — scale + slight rotate on pointer enter.
 * Wraps Lucide (or any) icons. Disabled under reduced motion.
 */
export const IconMotion = ({
  children,
  className = '',
  hoverRotate = 8,
  hoverScale = 1.12,
  ...rest
}) => {
  const reduced = useMotionSafe();
  if (reduced) {
    return (
      <span className={`inline-flex ${className}`} {...rest}>
        {children}
      </span>
    );
  }
  return (
    <motion.span
      className={`inline-flex ${className}`}
      whileHover={{ scale: hoverScale, rotate: hoverRotate }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.22, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.span>
  );
};

export { reducedShow, useMotionSafe };
