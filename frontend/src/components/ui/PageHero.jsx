import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, delay: 0.05 + i * 0.08, ease: [0.22, 0.61, 0.36, 1] },
    }),
};

const PageHero = ({
    eyebrow,
    title,
    subtitle,
    align = 'center',
    breadcrumb,
    showCta = false,
    ctaLabel = 'Browse Adventures',
    ctaHref = '/adventures',
    children,
}) => {
    const isCenter = align === 'center';
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-black via-[#0b0b0b] to-black pt-32 pb-20 text-white md:pt-40 md:pb-28">
            <div
                aria-hidden
                className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-[#D4AF37]/20 blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl"
            />
            <div className="container relative z-10">
                {breadcrumb && (
                    <motion.nav
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={0}
                        className="mb-6 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/80"
                    >
                        {breadcrumb.map((crumb, i) => (
                            <span key={crumb.label}>
                                {i > 0 && <span className="mx-2 text-white/40">/</span>}
                                {crumb.to ? (
                                    <Link to={crumb.to} className="hover:text-white">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-white/70">{crumb.label}</span>
                                )}
                            </span>
                        ))}
                    </motion.nav>
                )}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={1}
                    className={isCenter ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}
                >
                    {eyebrow && (
                        <motion.span
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                            custom={1}
                            className="inline-block rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#D4AF37]"
                        >
                            {eyebrow}
                        </motion.span>
                    )}
                    <motion.h1
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={2}
                        className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl"
                    >
                        {title}
                    </motion.h1>
                    {subtitle && (
                        <motion.p
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                            custom={3}
                            className="mt-5 text-base text-white/70 sm:text-lg md:text-xl"
                        >
                            {subtitle}
                        </motion.p>
                    )}
                    {showCta && (
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                            custom={4}
                            className="mt-8 flex flex-wrap items-center justify-center gap-3"
                        >
                            <Link
                                to={ctaHref}
                                className="btn btn-primary"
                            >
                                {ctaLabel} <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    )}
                </motion.div>
                {children && (
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={5}
                        className="mt-10"
                    >
                        {children}
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default PageHero;
