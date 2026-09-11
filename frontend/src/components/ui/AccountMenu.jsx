import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar, { firstName } from './UserAvatar';
import { EASE } from './Motion';

/**
 * Logged-in account control: avatar + first name + dropdown.
 */
const AccountMenu = ({ compact = false, onNavigate }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!user) return null;

  const name = firstName(user.name);
  const close = () => setOpen(false);
  const go = () => {
    close();
    onNavigate?.();
  };

  const items = [
    { to: '/dashboard', label: 'My trips', icon: CalendarDays },
    { to: '/profile', label: 'Profile', icon: Settings },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          'inline-flex items-center gap-2 rounded-full transition-colors',
          'hover:bg-panel/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/40',
          compact ? 'p-0.5' : 'pl-0.5 pr-2.5 py-0.5',
        ].join(' ')}
      >
        <UserAvatar user={user} size="sm" />
        {!compact && (
          <>
            <span className="text-sm font-semibold text-stone max-w-[7.5rem] truncate">
              {name}
            </span>
            <ChevronDown
              size={14}
              className={`text-stone/45 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="absolute right-0 top-full mt-2 w-56 bg-mist-subtle border border-stone/10 shadow-lift rounded-md overflow-hidden z-50"
          >
            <div className="px-3.5 py-3 border-b border-stone/8 bg-mist/40">
              <p className="text-sm font-semibold text-stone truncate">{user.name || name}</p>
              {user.email && (
                <p className="text-[11px] text-stone/45 truncate mt-0.5">{user.email}</p>
              )}
            </div>
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                role="menuitem"
                onClick={go}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-stone/85 hover:bg-mist hover:text-stone transition-colors"
              >
                <item.icon size={16} className="text-ember shrink-0" />
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                logout();
                onNavigate?.();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-stone/70 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-stone/8"
            >
              <LogOut size={16} className="shrink-0" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountMenu;
