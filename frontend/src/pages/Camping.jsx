import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Tent, MapPin, Clock, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';

const Camping = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        api
            .get('/adventures', { params: { category: 'camping', limit: 24 } })
            .then((res) => {
                if (!alive) return;
                const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
                setItems(list.filter((a) => (a.category || '').toLowerCase().includes('camp')));
            })
            .catch(() => alive && toast.error('Could not load camping trips'))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, []);

    return (
        <>
            <Seo
                title="Camping"
                description="Lakeside, riverside, and forest camping experiences across India — curated by Phoenix Adventures."
            />
            <Navbar />
            <PageHero
                eyebrow="Sleep under the stars"
                title="Camping weekends"
                subtitle="Bonfire nights, lakeside tents, and forest cabins across Maharashtra, Karnataka, and the Northeast."
                breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Adventures', to: '/adventures' }, { label: 'Camping' }]}
                showCta
                ctaLabel="View all adventures"
            />
            <section className="bg-white py-12">
                <div className="container">
                    {loading ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <EmptyState
                            icon={Tent}
                            title="No camping trips available right now"
                            description="We're adding new campsites every week. Check back soon!"
                            action={
                                <Link to="/adventures" className="btn btn-primary">
                                    Browse All Adventures
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
                                            alt={a.title || 'Camping'}
                                            onError={(e) => (e.currentTarget.src = '/placeholder.jpg')}
                                        />
                                    </div>
                                    <div className="p-5">
                                        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                                            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {a.location || 'India'}</span>
                                            <span className="inline-flex items-center gap-1"><Clock size={12} /> {a.duration || '—'}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-[#B8860B]">{a.title || 'Camping'}</h3>
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

export default Camping;
