import { motion } from 'framer-motion';

// Consistent section wrapper. Standardises vertical rhythm across the app.
// All public pages should use this for major content blocks.
const sizes = {
    sm: 'py-12 md:py-16',     // 48/64
    md: 'py-16 md:py-20',     // 64/80
    lg: 'py-20 md:py-24',     // 80/96
    xl: 'py-24 md:py-28',     // 96/112
};

const toneClasses = {
    light: 'bg-white',
    cream: 'bg-gradient-to-b from-white to-[#F0E68C]/5',
    gold: 'bg-gradient-to-r from-[#F0E68C]/10 to-[#D4AF37]/10 border-y border-[#D4AF37]/20',
    dark: 'bg-gradient-to-br from-black via-[#0b0b0b] to-black text-white',
};

export default function Section({
    children,
    size = 'lg',
    tone = 'light',
    className = '',
    id,
    container = true,
    reveal = true,
    ...rest
}) {
    const y = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
    const Wrapper = reveal ? motion.section : 'section';
    const inner = (
        <Wrapper
            id={id}
            className={`${sizes[size] || sizes.lg} ${toneClasses[tone] || toneClasses.light} ${className}`}
            {...(reveal
                ? {
                    initial: { opacity: 0, y },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, margin: '-80px' },
                    transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] },
                }
                : {})}
            {...rest}
        >
            {container ? <div className="container">{children}</div> : children}
        </Wrapper>
    );
    return inner;
}
