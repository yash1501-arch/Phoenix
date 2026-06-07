import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Subtle, premium-feel page transition. We avoid a full cross-fade so scroll-restore
// stays snappy; the wrapper just nudges opacity + y to give a sense of arrival.
const variants = {
    initial: { opacity: 0, y: 12 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 0.61, 0.36, 1] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

export default function PageTransition({ children }) {
    const location = useLocation();
    const wrapperRef = useRef(null);

    // Reset scroll to top on route change. (ScrollToTop handles hash anchors separately.)
    useEffect(() => {
        if (!wrapperRef.current) return;
        // Don't fight the ScrollToTop component — we just keep the wrapper ready
        // for the AnimatePresence enter animation to apply its transform.
    }, [location.pathname]);

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                ref={wrapperRef}
                key={location.pathname}
                variants={variants}
                initial="initial"
                animate="enter"
                exit="exit"
                className="w-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
