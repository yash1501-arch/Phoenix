import { useReducedMotion } from 'framer-motion';
import { Reveal } from './Motion';

const sizes = {
  sm: 'py-12 md:py-16',
  md: 'py-16 md:py-20',
  lg: 'py-20 md:py-24',
  xl: 'py-24 md:py-28',
};

const toneClasses = {
  light: 'bg-mist',
  mist: 'bg-mist',
  white: 'bg-mist-subtle',
  stone: 'bg-panel text-cream',
  dark: 'bg-panel text-cream',
  muted: 'bg-mist-subtle',
};

/**
 * Section wrapper — vertical rhythm + optional scroll reveal.
 * Prefer `variant` for varied motion (not identical fade-up everywhere).
 */
export default function Section({
  children,
  size = 'lg',
  tone = 'light',
  className = '',
  id,
  container = true,
  reveal = true,
  variant = 'rise',
  ...rest
}) {
  const reduced = useReducedMotion();
  const content = container ? <div className="container">{children}</div> : children;
  const classes = `${sizes[size] || sizes.lg} ${toneClasses[tone] || toneClasses.light} ${className}`;

  if (!reveal || reduced) {
    return (
      <section id={id} className={classes} {...rest}>
        {content}
      </section>
    );
  }

  return (
    <Reveal as="section" id={id} className={classes} variant={variant} {...rest}>
      {content}
    </Reveal>
  );
}
