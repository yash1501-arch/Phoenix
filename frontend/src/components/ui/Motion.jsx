/* eslint-disable react-refresh/only-export-components */
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

// Stagger container — wrap a list, then use <StaggerItem> on each child.
export const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

export const staggerItem = {
    hidden: { opacity: 0, y: 18 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] },
    },
};

export const StaggerContainer = ({ children, className = '', viewport = { once: true, margin: '-80px' }, ...rest }) => (
    <motion.div
        className={className}
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        {...rest}
    >
        {children}
    </motion.div>
);

const Item = forwardRef(({ children, className = '', ...rest }, ref) => (
    <motion.div ref={ref} variants={staggerItem} className={className} {...rest}>
        {children}
    </motion.div>
));
Item.displayName = 'StaggerItem';
export const StaggerItem = Item;

// Reveal — single element fade + rise on enter viewport.
export const Reveal = ({ children, className = '', delay = 0, y = 24, viewport = { once: true, margin: '-60px' }, as = 'div', ...rest }) => {
    const MotionEl = motion[as] || motion.div;
    return (
        <MotionEl
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] }}
            {...rest}
        >
            {children}
        </MotionEl>
    );
};

// Gentle scale-in for cards / hero features.
export const Pop = ({ children, className = '', delay = 0, viewport = { once: true, margin: '-50px' } }) => (
    <motion.div
        className={className}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={viewport}
        transition={{ duration: 0.45, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
        {children}
    </motion.div>
);
