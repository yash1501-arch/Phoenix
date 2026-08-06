import React, { useRef, useEffect } from 'react';
import { motion, useInView, useAnimation, useReducedMotion } from 'framer-motion';
import { EASE } from './ui/Motion';

/** Legacy wrapper — prefer Reveal / Stagger from ui/Motion.jsx for new work. */
const ScrollAnimation = ({ children, delay = 0, duration = 0.6, yOffset = 30 }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -50px 0px' });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      controls.set('visible');
      return;
    }
    if (isInView) controls.start('visible');
  }, [controls, isInView, reduced]);

  if (reduced) return <div>{children}</div>;

  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: yOffset },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration, delay, ease: EASE },
        },
      }}
      initial="hidden"
      animate={controls}
    >
      {children}
    </motion.div>
  );
};

export default ScrollAnimation;
