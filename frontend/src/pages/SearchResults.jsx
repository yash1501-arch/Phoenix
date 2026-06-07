import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Clock, Filter, Frown } from 'lucide-react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { getImageUrl } from '../utils/api';
import { motion } from 'framer-motion';

const SearchResults = () => {
    const [params, setParams] = useSearchParams();
    const q = params.get('q') || '';
    const difficulty = params.get('difficulty') || 'all';
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        const p = { status: 'active', limit: 50 };
        if (q) p.search = q;
        if (difficulty !== 'all') p.difficulty = difficulty;
        api.get('/adventures', { params: p })
            .then((res) => {
                if (!alive) return;
                const list = Array.isArray(res.data?.data) ? res.data.data
                    : Array.isArray(res.data) ? res.data : [];
                // Client-side substring match for resilience
                const filtered = q
                    ? list.filter((a) => {
                        const hay = `${a.title || ''} ${a.location || ''} ${a.description || ''}`.toLowerCase();
                        return hay.includes(q.toLowerCase());
                    })
                    : list;
                setItems(filtered);
            })
            .catch(() => alive && setItems([]))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [q, difficulty]);

    const setDiff = (d) => {
        const next = new URLSearchParams(params);
        if (d === 'all') next.delete('difficulty');
        else next.set('difficulty', d);
        setParams(next, { replace: true });
    };

    return (
        <>
            <Seo
                title={q ? `Search "${q}"` : 'Search'}
                description="Find your next Indian adventure."
            />
            <Navbar />
            <PageHero
                eyebrow="Discover"
                title={q ? `Results for "${q}"` : 'Search Adventures'}
                subtitle="Trekking, camping, expeditions — all across India."
                breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Search' }]}
            />
            <section className="bg-white py-12 md:py-16">
                <div className="container">
                    <div className="mb-8 flex flex-wrap items-center gap-3">
                        <Filter size={18} className="text-gray-500" />
                        {['all', 'easy', 'moderate', 'challenging'].map((d) => (
                            <button
                                key={d}
                                onClick={() => setDiff(d)}
                                className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
                                    difficulty === d
                                        ? 'border-[#D4AF37] bg-[#D4AF37] text-white'
                                        : 'border-gray-200 text-gray-600 hover:border-[#D4AF37]'
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <EmptyState
                            icon={Frown}
                            title={q ? `No matches for "${q}"` : 'No adventures found'}
                            description="Try a different keyword, difficulty, or browse all adventures."
                            action={
                                <Link to="/adventures" className="btn btn-primary">
                                    All Adventures
                                </Link>
                            }
                        />
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {items.map((a, i) => (
                                <motion.article
                                    key={a.id || a._id || i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.04 }}
                                    className="group overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-white shadow-professional transition-all hover:-translate-y-1 hover:shadow-professional-lg"
                                >
                                    <div className="img-wrapper rounded-none pb-[60%]">
                                        <img
                                            src={getImageUrl(a.image_url) || '/placeholder.jpg'}
                                            alt={a.title}
                                            onError={(e) => (e.currentTarget.src = '/placeholder.jpg')}
                                        />
                                    </div>
                                    <div className="p-5">
                                        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                                            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {a.location || 'India'}</span>
                                            <span className="inline-flex items-center gap-1"><Clock size={12} /> {a.duration || '—'}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-[#B8860B]">{a.title}</h3>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-lg font-extrabold text-[#B8860B]">₹{Number(a.price || 0).toLocaleString('en-IN')}</span>
                                            <Link to={`/adventure/${a.id || a._id}`} className="rounded-lg border-2 border-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#B8860B] hover:bg-[#D4AF37] hover:text-white">
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
    <MobileTabBarSpacer />
    <Footer />
        </>
    );
};

export default SearchResults;
