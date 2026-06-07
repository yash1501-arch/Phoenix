import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Filter, MapPin, Clock, Star, Mountain } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import EmptyState from '../components/ui/EmptyState';
import LoadingScreen from '../components/ui/LoadingScreen';
import { SkeletonCard } from '../components/ui/Skeleton';

const Treks = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initial = searchParams.get('difficulty') || 'all';
    const [difficulty, setDifficulty] = useState(initial);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        api
            .get('/adventures', { params: { category: 'trek', difficulty: difficulty === 'all' ? undefined : difficulty, limit: 24 } })
            .then((res) => {
                if (!alive) return;
                const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
                setItems(list.filter((a) => (a.category || '').toLowerCase().includes('trek')));
            })
            .catch(() => alive && toast.error('Could not load treks'))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [difficulty]);

    const onChange = (d) => {
        setDifficulty(d);
        const next = new URLSearchParams(searchParams);
        if (d === 'all') next.delete('difficulty');
        else next.set('difficulty', d);
        setSearchParams(next, { replace: true });
    };

    return (
        <>
            <Seo
                title="Treks"
                description="Multi-day Himalayan expeditions and Sahyadri day treks handpicked by Phoenix Adventures."
            />
            <Navbar />
            <PageHero
                eyebrow="Multi-day treks"
                title="Treks that change you"
                subtitle="From Sahyadri monsoon classics to high-altitude Himalayan expeditions — find your next summit."
                breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Adventures', to: '/adventures' }, { label: 'Treks' }]}
                showCta
                ctaLabel="View all adventures"
            />
            <section className="bg-white py-12">
                <div className="container">
                    <div className="mb-8 flex flex-wrap items-center gap-3">
                        <Filter size={18} className="text-gray-500" />
                        {['all', 'easy', 'moderate', 'challenging'].map((d) => (
                            <button
                                key={d}
                                onClick={() => onChange(d)}
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
                            icon={Mountain}
                            title="No treks match this filter"
                            description="Try changing the difficulty or browse all adventures."
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
                                            src={a.image_url || a.image || '/placeholder.jpg'}
                                            alt={a.title || 'Trek'}
                                            onError={(e) => (e.currentTarget.src = '/placeholder.jpg')}
                                        />
                                    </div>
                                    <div className="p-5">
                                        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                                            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {a.location || 'India'}</span>
                                            <span className="inline-flex items-center gap-1"><Clock size={12} /> {a.duration || '—'}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-[#B8860B]">{a.title || 'Trek'}</h3>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-lg font-extrabold text-[#B8860B]">₹{Number(a.price || 0).toLocaleString('en-IN')}</span>
                                            <Link to={`/adventure/${a.id || a._id}`} className="rounded-lg border-2 border-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#B8860B] hover:bg-[#D4AF37] hover:text-white">
                                                Explore
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

export default Treks;
