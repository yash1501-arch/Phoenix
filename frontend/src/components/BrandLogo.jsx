import { Link } from 'react-router-dom';

/**
 * Same circular mark as the browser tab favicon.
 * Renders /logo-mark.png as-is (no extra CSS crop) so nav/footer match the tab.
 */
const LOGO_MARK = '/logo-mark.png?v=6';
const LOGO_FULL = '/logo.png';

const BrandLogo = ({
  to = '/',
  variant = 'mark',
  size = 40,
  showWordmark = true,
  fullArtwork = false,
  className = '',
  onClick,
  inverted = false,
}) => {
  // Browser tab uses the PNG square with transparent corners — do the same here.
  // Do NOT wrap in rounded-full/overflow-hidden; that double-crops and looks different.
  const img = (
    <img
      src={fullArtwork ? LOGO_FULL : LOGO_MARK}
      alt={showWordmark ? '' : 'Phoenix Adventures'}
      width={size}
      height={size}
      className="block shrink-0 select-none pointer-events-none"
      style={{ width: size, height: size }}
      decoding="async"
      aria-hidden={showWordmark ? true : undefined}
    />
  );

  const wordColor = inverted ? 'text-cream' : 'text-stone';
  const accent = 'text-ember';

  const inner = (
    <span className={`inline-flex items-center gap-2.5 group ${className}`}>
      {img}
      {showWordmark && variant !== 'icon' && (
        <span className="flex flex-col leading-none">
          <span className={`font-display text-base md:text-lg font-semibold tracking-tight ${wordColor} group-hover:text-ember transition-colors`}>
            Phoenix
          </span>
          <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.18em] ${accent}`}>
            Adventures
          </span>
        </span>
      )}
    </span>
  );

  if (!to) return inner;
  return (
    <Link to={to} onClick={onClick} className="shrink-0" aria-label="Phoenix Adventures home">
      {inner}
    </Link>
  );
};

export default BrandLogo;
