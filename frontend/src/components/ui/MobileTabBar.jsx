import { NavLink } from 'react-router-dom';
import { Home, Compass, Calendar, Heart, User } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

const items = [
    { to: '/', label: 'Home', Icon: Home, end: true },
    { to: '/adventures', label: 'Explore', Icon: Compass },
    { to: '/dashboard', label: 'Trips', Icon: Calendar, requireAuth: true },
    { to: '/wishlist', label: 'Saved', Icon: Heart, badge: true },
    { to: '/dashboard', label: 'Me', Icon: User, requireAuth: true },
];

export default function MobileTabBar() {
    const wishlist = useWishlist();
    const wishItems = wishlist?.items || [];
    const { user } = useAuth() || {};

    return (
        <nav
            aria-label="Quick navigation"
            className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
        >
            <ul className="grid grid-cols-5">
                {items.map((it) => {
                    const dest = it.requireAuth && !user ? '/login' : it.to;
                    return (
                        <li key={it.label}>
                            <NavLink
                                to={dest}
                                end={it.end}
                                className={({ isActive }) =>
                                    `relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition ${isActive ? 'text-primary' : 'text-zinc-400'}`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className="relative">
                                            <it.Icon size={20} />
                                            {it.badge && wishItems.length > 0 && (
                                                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-black text-[9px] font-bold flex items-center justify-center">
                                                    {wishItems.length}
                                                </span>
                                            )}
                                        </div>
                                        <span>{it.label}</span>
                                        {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />}
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
