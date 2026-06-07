/* eslint-disable react-refresh/only-export-components, react-hooks/preserve-manual-memoization */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);
export { WishlistContext };
const STORAGE_KEY = 'phoenix-wishlist';

export const WishlistProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [items, setItems] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Persist
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch { /* ignore */ }
    }, [items]);

    // Sync with server if logged in
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            api.get(`/wishlist/user/${user.id}`)
                .then((res) => {
                    const list = Array.isArray(res.data?.data) ? res.data.data : [];
                    setItems(list.map((w) => ({
                        id: w._id,
                        adventure: w.adventure,
                        adventure_id: w.adventure_id,
                        created_at: w.created_at,
                    })).filter((w) => w.adventure));
                })
                .catch(() => { /* keep local */ });
        }
    }, [isAuthenticated, user?.id]);

    const add = useCallback(async (adventure) => {
        if (!adventure) return;
        const advId = adventure.id || adventure._id;
        // Optimistic update
        setItems((prev) => {
            if (prev.some((i) => i.adventure_id === advId)) return prev;
            return [...prev, { adventure, adventure_id: advId, created_at: new Date().toISOString() }];
        });
        if (isAuthenticated && user?.id) {
            try {
                await api.post('/wishlist', { user_id: user.id, adventure_id: advId });
                toast.success('Added to wishlist');
            } catch {
                toast.error('Could not sync to server');
            }
        } else {
            toast.success('Added to wishlist');
        }
    }, [isAuthenticated, user?.id]);

    const remove = useCallback(async (adventureId) => {
        setItems((prev) => prev.filter((i) => i.adventure_id !== adventureId));
        if (isAuthenticated && user?.id) {
            try {
                await api.delete('/wishlist', { data: { user_id: user.id, adventure_id: adventureId } });
                toast.success('Removed from wishlist');
            } catch { /* local-only removal ok */ }
        } else {
            toast.success('Removed');
        }
    }, [isAuthenticated, user?.id]);

    const toggle = useCallback((adventure) => {
        const advId = adventure.id || adventure._id;
        if (items.some((i) => i.adventure_id === advId)) {
            remove(advId);
        } else {
            add(adventure);
        }
    }, [items, add, remove]);

    const has = useCallback((adventureId) => items.some((i) => i.adventure_id === adventureId), [items]);

    const count = items.length;

    return (
        <WishlistContext.Provider value={{ items, count, add, remove, toggle, has }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) return { items: [], addItem: () => {}, removeItem: () => {}, isInWishlist: () => false, clear: () => {} };
    return ctx;
};
