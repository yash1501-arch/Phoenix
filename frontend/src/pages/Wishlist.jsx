import { Link } from 'react-router-dom';
import { Heart, MapPin, Clock, Trash2, Compass, ChevronRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import EmptyState from '../components/ui/EmptyState';
import { getImageUrl } from '../utils/api';
import { AnimatePresence, motion } from 'framer-motion';
import { Reveal, StaggerContainer, StaggerItem, EASE } from '../components/ui/Motion';

const Wishlist = () => {
  const { items, remove } = useWishlist();

  return (
    <div className="min-h-screen bg-mist">
      <Seo title="My Wishlist" description="Treks and adventures you've saved for later." />
      <Navbar />
      <PageHero
        eyebrow="Saved for later"
        title="Your Wishlist"
        subtitle="Treks and adventures you're dreaming about. Pick up where you left off."
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]}
      />
      <section className="bg-mist-subtle py-12 md:py-16">
        <div className="container">
          {items.length === 0 ? (
            <Reveal variant="scale">
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
            </Reveal>
          ) : (
            <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {items.map((item) => {
                  const a = item.adventure || {};
                  const advId = item.adventure_id;
                  return (
                    <StaggerItem key={advId}>
                      <motion.article
                        layout
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="group relative flex flex-col overflow-hidden rounded-lg border border-stone/8 bg-mist-subtle shadow-smoke transition-shadow hover:shadow-card h-full"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={getImageUrl(a.image_url) || '/placeholder.jpg'}
                            alt={a.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => (e.currentTarget.src = '/placeholder.jpg')}
                          />
                        </div>
                        <button
                          onClick={() => remove(advId)}
                          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-md bg-mist-subtle/95 text-red-500 shadow-smoke transition-colors hover:bg-red-500 hover:text-white"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="flex flex-1 flex-col p-5">
                          <div className="mb-2 flex items-center justify-between text-xs text-muted">
                            <span className="inline-flex items-center gap-1"><MapPin size={12} className="text-ember" /> {a.location || 'India'}</span>
                            <span className="inline-flex items-center gap-1"><Clock size={12} className="text-ember" /> {a.duration || '—'}</span>
                          </div>
                          <h3 className="font-display line-clamp-2 text-base font-semibold text-stone group-hover:text-ember transition-colors">{a.title}</h3>
                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-stone/8">
                            <span className="font-display text-lg font-semibold text-stone">₹{Number(a.price || 0).toLocaleString('en-IN')}</span>
                            <Link to={`/adventure/${advId}`} className="inline-flex items-center gap-1 text-xs font-bold text-ember hover:text-ember-deep">
                              View <ChevronRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </motion.article>
                    </StaggerItem>
                  );
                })}
              </AnimatePresence>
            </StaggerContainer>
          )}
        </div>
      </section>
            <Footer />
    </div>
  );
};

export default Wishlist;
