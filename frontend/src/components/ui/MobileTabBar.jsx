import { NavLink } from 'react-router-dom';
import { Home, Mountain, Compass, Heart, LogIn } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from './UserAvatar';
import { IconMotion } from './Motion';

const items = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/treks', label: 'Treks', Icon: Mountain },
  { to: '/tours', label: 'Tours', Icon: Compass },
  { to: '/wishlist', label: 'Saved', Icon: Heart, badge: true },
  { to: '/dashboard', label: 'Me', profile: true, requireAuth: true },
];

export default function MobileTabBar() {
  const wishlist = useWishlist();
  const wishItems = wishlist?.items || [];
  const { user, isAuthenticated } = useAuth() || {};

  return (
    <nav
      aria-label="Quick navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-mist/95 backdrop-blur-md border-t border-stone/10 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const dest = it.requireAuth && !isAuthenticated ? '/login' : it.to;
          return (
            <li key={it.label}>
              <NavLink
                to={dest}
                end={it.end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[52px] text-[11px] font-semibold transition ${
                    isActive ? 'text-ember' : 'text-stone/55'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      {it.profile && isAuthenticated ? (
                        <UserAvatar
                          user={user}
                          size="xs"
                          animated={isActive}
                          ring={isActive}
                        />
                      ) : it.profile ? (
                        <IconMotion hoverScale={1.1} hoverRotate={0}>
                          <LogIn size={20} strokeWidth={isActive ? 2.4 : 2} />
                        </IconMotion>
                      ) : (
                        <IconMotion hoverScale={1.1} hoverRotate={it.Icon === Heart ? -8 : 0}>
                          <it.Icon
                            size={20}
                            strokeWidth={isActive ? 2.4 : 2}
                            className={it.badge && wishItems.length > 0 && it.Icon === Heart ? 'fill-ember/20' : ''}
                          />
                        </IconMotion>
                      )}
                      {it.badge && wishItems.length > 0 && (
                        <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-ember text-white text-[9px] font-bold flex items-center justify-center">
                          {wishItems.length}
                        </span>
                      )}
                    </div>
                    <span>{it.profile && isAuthenticated ? 'Me' : it.label}</span>
                    {isActive && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-ember" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
