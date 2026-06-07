import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Clock } from 'lucide-react';
import api from '../utils/api';
import { getImageUrl } from '../utils/api';

const RECENT_KEY = 'phoenix-search-history';

const SearchBar = ({ className = '' }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recent, setRecent] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        } catch { return []; }
    });
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Click-outside to close
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus on open
    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get('/adventures', {
                    params: { status: 'active', limit: 8, search: query },
                });
                const list = Array.isArray(res.data?.data) ? res.data.data
                    : Array.isArray(res.data) ? res.data : [];
                setResults(list);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [query]);

    const pushRecent = useCallback((q) => {
        if (!q?.trim()) return;
        setRecent((prev) => {
            const next = [q, ...prev.filter((p) => p !== q)].slice(0, 6);
            localStorage.setItem(RECENT_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const onSubmit = (e) => {
        e?.preventDefault?.();
        if (!query.trim()) return;
        pushRecent(query);
        navigate(`/search?q=${encodeURIComponent(query)}`);
        setOpen(false);
    };

    const onPickAdventure = (adv) => {
        const advId = adv.id || adv._id;
        pushRecent(query);
        setOpen(false);
        setQuery('');
        navigate(`/adventure/${advId}`);
    };

    const clearRecent = () => {
        setRecent([]);
        localStorage.removeItem(RECENT_KEY);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl border-2 border-[#D4AF37]/30 bg-white/80 px-3 py-2 text-sm font-semibold text-gray-600 backdrop-blur-sm transition-all hover:border-[#D4AF37] hover:text-[#B8860B]"
                aria-label="Open search"
            >
                <Search size={16} />
                <span className="hidden md:inline">Search</span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-50 mt-2 w-[min(90vw,420px)] overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-white shadow-professional-lg"
                    >
                        <form onSubmit={onSubmit} className="relative border-b border-gray-100 p-3">
                            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search treks, camps, places…"
                                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-10 text-sm focus:border-[#D4AF37] focus:outline-none"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                    aria-label="Clear"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </form>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {!query.trim() && recent.length > 0 && (
                                <div className="p-3">
                                    <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        <span>Recent</span>
                                        <button onClick={clearRecent} className="text-[#B8860B] hover:underline">Clear</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {recent.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => { setQuery(q); }}
                                                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:border-[#D4AF37] hover:text-[#B8860B]"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {query.trim() && (
                                <div className="p-2">
                                    {loading && <p className="px-3 py-6 text-center text-sm text-gray-400">Searching…</p>}
                                    {!loading && results.length === 0 && (
                                        <p className="px-3 py-6 text-center text-sm text-gray-400">No results for "{query}"</p>
                                    )}
                                    {results.map((a) => (
                                        <button
                                            key={a.id || a._id}
                                            onClick={() => onPickAdventure(a)}
                                            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[#FFFDF8]"
                                        >
                                            <img
                                                src={getImageUrl(a.image_url) || '/placeholder.jpg'}
                                                alt=""
                                                onError={(e) => (e.currentTarget.src = '/placeholder.jpg')}
                                                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-gray-900">{a.title}</p>
                                                <p className="flex items-center gap-2 text-[11px] text-gray-500">
                                                    <span className="inline-flex items-center gap-1"><MapPin size={10} /> {a.location || 'India'}</span>
                                                    <span className="inline-flex items-center gap-1"><Clock size={10} /> {a.duration || '—'}</span>
                                                </p>
                                            </div>
                                            <span className="text-sm font-extrabold text-[#B8860B]">₹{Number(a.price || 0).toLocaleString('en-IN')}</span>
                                        </button>
                                    ))}
                                    {results.length > 0 && (
                                        <button
                                            onClick={onSubmit}
                                            className="mt-2 block w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] py-2.5 text-sm font-bold text-white"
                                        >
                                            See all results for "{query}"
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchBar;
