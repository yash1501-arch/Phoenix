import { Link } from 'react-router-dom';
import { Heart, MapPin, Clock, Trash2, Compass, ChevronRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import EmptyState from '../components/ui/EmptyState';
import { getImageUrl } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const Wishlist = () => {
    const { items, remove } = useWishlist();

    return (
        <>
            <Seo title="My Wishlist" description="Treks and adventures you've saved for later." />
            <Navbar />
            <PageHero
                eyebrow="Saved for later"
                title="Your Wishlist"
                subtitle="Treks and adventures you're dreaming about. Pick up where you left off."
                breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]}
            />
            <section className="bg-white py-12">
                <div className="container">
                    {items.length === 0 ? (
                        <EmptyState
                            icon={Heart}
                            title="Your wishlist is empty"
                            description="Tap the heart on any adventure to save it for later."
                            action={
                                <Link to="/adventures" className="btn btn-primary">
                                    <Compass size={16} /> Discover adventures
                                </Link>
                            }
                        />
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <AnimatePresence>
                                {items.map((item, i) => {
                                    const a = item.adventure || {};
                                    const advId = item.adventure_id;
                                    return (
                                        <motion.article
                                            key={advId}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: i * 0.04 }}
                                            className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-white shadow-professional transition-all hover:-translate-y-1 hover:shadow-professional-lg"
                                        >
                                            <div className="img-wrapper rounded-none pb-[60%]">
                                                <img
                                                    src={getImageUrl(a.image_url) || '/placeholder.jpg'}
                                                    alt={a.title}
                                                    onError={(e) => (e.currentTarget.src = '/placeholder.jpg')}
                                                />
                                            </div>
                                            <button
                                                onClick={() => remove(advId)}
                                                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-md backdrop-blur-sm transition-all hover:bg-red-500 hover:text-white"
                                                aria-label="Remove from wishlist"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="p-5">
                                                <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                                                    <span className="inline-flex items-center gap-1"><MapPin size={12} /> {a.location || 'India'}</span>
                                                    <span className="inline-flex items-center gap-1"><Clock size={12} /> {a.duration || '—'}</span>
                                                </div>
                                                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#B8860B]">{a.title}</h3>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-lg font-extrabold text-[#B8860B]">₹{Number(a.price || 0).toLocaleString('en-IN')}</span>
                                                    <Link to={`/adventure/${advId}`} className="rounded-lg border-2 border-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#B8860B] hover:bg-[#D4AF37] hover:text-white">
                                                        View <ChevronRight size={12} className="inline" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.article>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </section>
    <MobileTabBarSpacer />
    <Footer />
        </>
    );
};

export default Wishlist;
