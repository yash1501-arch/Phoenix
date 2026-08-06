import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'phoenix-cookie-consent';

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                const t = setTimeout(() => setVisible(true), 800);
                return () => clearTimeout(t);
            }
        } catch {
            // ignore
        }
    }, []);

    const persist = (value) => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ consent: value, at: new Date().toISOString() })); } catch { /* ignore */ }
    };

    const accept = () => { persist('all'); setVisible(false); };
    const decline = () => { persist('essential'); setVisible(false); };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    role="dialog"
                    aria-live="polite"
                    aria-label="Cookie consent"
                    className="fixed bottom-3 left-3 right-3 md:bottom-6 md:left-6 md:right-auto md:max-w-sm z-50 bg-zinc-900/95 border border-primary/30 rounded-xl p-4 md:p-5 shadow-2xl backdrop-blur"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                            <Cookie size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm mb-1">Cookies &amp; privacy</h3>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                                We use cookies for authentication and to remember your wishlist. No ad trackers.{' '}
                                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    onClick={accept}
                                    className="px-4 py-1.5 rounded-full bg-primary text-black text-xs font-bold hover:brightness-110 transition"
                                >
                                    Accept all
                                </button>
                                <button
                                    onClick={decline}
                                    className="px-4 py-1.5 rounded-full border border-zinc-700 text-zinc-200 text-xs font-semibold hover:bg-zinc-800 transition"
                                >
                                    Essential only
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={decline}
                            aria-label="Dismiss cookie banner"
                            className="text-zinc-500 hover:text-white transition shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
