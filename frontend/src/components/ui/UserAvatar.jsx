import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { getImageUrl } from '../../utils/api';
import { IconMotion, useMotionSafe, EASE } from './Motion';

/**
 * Shared account avatar — photo, initials, or animated User icon.
 * Used in navbar, mobile tab bar, dashboard, and profile.
 */
const sizeMap = {
  xs: { box: 'w-7 h-7', text: 'text-[10px]', icon: 14 },
  sm: { box: 'w-8 h-8', text: 'text-xs', icon: 15 },
  md: { box: 'w-10 h-10', text: 'text-sm', icon: 18 },
  lg: { box: 'w-12 h-12', text: 'text-base', icon: 22 },
  xl: { box: 'w-24 h-24', text: 'text-3xl', icon: 40 },
};

export function getInitials(name) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function firstName(name) {
  if (!name || typeof name !== 'string') return 'Explorer';
  return name.trim().split(/\s+/)[0] || 'Explorer';
}

const UserAvatar = ({
  user,
  size = 'sm',
  className = '',
  animated = true,
  ring = true,
}) => {
  const s = sizeMap[size] || sizeMap.sm;
  const src = getImageUrl(user?.avatar_url);
  const initials = getInitials(user?.name);
  const reduced = useMotionSafe();

  const inner = src ? (
    <img
      src={src}
      alt=""
      className="block w-full h-full object-cover"
      decoding="async"
    />
  ) : initials ? (
    <span className={`font-semibold leading-none ${s.text}`}>{initials}</span>
  ) : (
    <User size={s.icon} strokeWidth={2.25} aria-hidden />
  );

  const shell = (
    <span
      className={[
        'relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0',
        'bg-stone text-mist',
        ring ? 'ring-2 ring-ember/25 ring-offset-1 ring-offset-mist' : '',
        s.box,
        className,
      ].filter(Boolean).join(' ')}
      aria-hidden
    >
      {inner}
      {!src && !initials && animated && !reduced && (
        <motion.span
          className="absolute inset-0 rounded-full border border-ember/40"
          animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: EASE }}
        />
      )}
    </span>
  );

  if (!animated || reduced) return shell;

  return (
    <IconMotion hoverScale={1.08} hoverRotate={0} className="shrink-0">
      {shell}
    </IconMotion>
  );
};

export default UserAvatar;
