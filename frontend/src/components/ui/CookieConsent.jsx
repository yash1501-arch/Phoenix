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
                    className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 bg-zinc-900/95 border border-primary/30 rounded-2xl p-5 shadow-2xl backdrop-blur"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                            <Cookie size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-white mb-1">Cookies & Privacy</h3>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                                We use cookies for authentication, cart, and analytics to improve your experience. By accepting, you consent to our use as per the
                                {' '}<Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and the DPDP Act 2023.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    onClick={accept}
                                    className="px-4 py-2 rounded-full bg-primary text-black text-sm font-semibold hover:brightness-110 transition"
                                >
                                    Accept All
                                </button>
                                <button
                                    onClick={decline}
                                    className="px-4 py-2 rounded-full border border-zinc-700 text-zinc-200 text-sm font-semibold hover:bg-zinc-800 transition"
                                >
                                    Essential Only
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={decline}
                            aria-label="Dismiss cookie banner"
                            className="text-zinc-400 hover:text-white transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
