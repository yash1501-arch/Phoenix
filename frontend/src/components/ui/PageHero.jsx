import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from './Motion';

/**
 * Interior page hero — stone surface, ember accents, Unbounded display.
 */
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
  const reduced = useReducedMotion();
  const isCenter = align === 'center';

  const fadeUp = (i = 0) =>
    reduced
      ? { opacity: 1, y: 0 }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay: 0.05 + i * 0.08, ease: EASE },
        };

  return (
    <section className="relative overflow-hidden bg-panel pt-28 pb-14 text-cream md:pt-32 md:pb-16">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(240,89,30,0.08),_transparent_55%)]"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-ember/30" />
      <div className="container relative z-10">
        {breadcrumb && (
          <motion.nav
            {...fadeUp(0)}
            aria-label="Breadcrumb"
            className={`mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ember/90 sm:text-xs ${
              isCenter ? 'text-center' : ''
            }`}
          >
            {breadcrumb.map((crumb, i) => (
              <span key={crumb.label}>
                {i > 0 && <span className="mx-2 text-cream/30">/</span>}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-cream transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-cream/50">{crumb.label}</span>
                )}
              </span>
            ))}
          </motion.nav>
        )}
        <div className={isCenter ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
          {eyebrow && (
            <motion.div
              {...fadeUp(1)}
              className={`flex items-center gap-3 ${isCenter ? 'justify-center' : ''}`}
            >
              <span aria-hidden className="rule-gold shrink-0" />
              <p className="kicker !text-ember !text-[0.8rem] sm:!text-[0.8125rem]">{eyebrow}</p>
              {isCenter && <span aria-hidden className="rule-gold shrink-0" />}
            </motion.div>
          )}
          <motion.h1
            {...fadeUp(2)}
            className="mt-4 font-display text-display-2xl !text-cream font-semibold tracking-tight"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              {...fadeUp(3)}
              className={`lede mt-4 !text-cream/75 max-w-2xl ${isCenter ? 'mx-auto' : ''}`}
            >
              {subtitle}
            </motion.p>
          )}
          {showCta && (
            <motion.div
              {...fadeUp(4)}
              className={`mt-8 flex flex-wrap gap-3 ${isCenter ? 'justify-center' : ''}`}
            >
              <Link to={ctaHref} className="btn btn-outline">
                {ctaLabel} <ArrowRight size={16} />
              </Link>
            </motion.div>
          )}
        </div>
        {children && (
          <motion.div {...fadeUp(5)} className="mt-8">
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default PageHero;
