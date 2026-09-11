import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Heart, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { adventuresAPI, getImageUrl } from '../utils/api';
import { IMG_FALLBACK } from '../data/indiaImages';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

const Adventures = () => {
    const [adventures, setAdventures] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();
    const { toggle, isWishlisted } = useWishlist();

    useEffect(() => {
        let alive = true;
        const fetchAdventures = async () => {
            try {
                const response = await adventuresAPI.getAll({ status: 'active', limit: 8 });
                if (alive) setAdventures(response.data.data || []);
            } catch (error) {
                console.error('Error fetching adventures:', error);
            } finally {
                if (alive) setLoading(false);
            }
        };
        fetchAdventures();
        return () => { alive = false; };
    }, []);

    const handleWishlist = async (e, adv) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.error('Sign in to save adventures to your wishlist');
            return;
        }
        try {
            await toggle(adv._id || adv.id);
        } catch {
            /* context shows toast */
        }
    };

    if (loading) {
        return (
            <section className="py-24 md:py-32 bg-mist flex justify-center items-center min-h-[50vh]">
                <div className="w-10 h-10 border-2 border-ember border-t-transparent rounded-full animate-spin" />
            </section>
        );
    }

    if (!loading && adventures.length === 0) {
        return null;
    }

    return (
        <section id="adventures" className="py-24 md:py-32 bg-mist" aria-labelledby="adventures-heading">
            <div className="container">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-2xl"
                    >
                        <p className="kicker mb-3">Open departures</p>
                        <h2 id="adventures-heading" className="font-display text-display-lg text-stone font-semibold">
                            Upcoming expeditions
                        </h2>
                        <p className="mt-4 text-base md:text-lg text-muted max-w-xl">
                            Small groups. Certified guides. Book seats on WhatsApp.
                        </p>
                    </motion.div>

                    <Link
                        to="/adventures"
                        className="hidden md:inline-flex items-center gap-2 font-bold text-stone hover:text-ember transition-colors group"
                    >
                        Browse all
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                    {adventures.map((adv, index) => {
                        const advId = adv._id || adv.id;
                        const wishlisted = isAuthenticated && isWishlisted?.(advId);
                        return (
                            <motion.article
                                key={advId}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05 }}
                                whileHover={{ y: -4 }}
                                className="group h-full bg-mist-subtle rounded-lg overflow-hidden border border-stone/10 shadow-smoke hover:shadow-card transition-shadow"
                            >
                                <Link to={`/adventure/${advId}`} className="flex h-full flex-col">
                                    <div className="relative aspect-[4/5] overflow-hidden shrink-0">
                                        <img
                                            src={getImageUrl(adv.image_url) || IMG_FALLBACK}
                                            alt={`${adv.title} — ${adv.location}`}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            onError={(e) => { e.target.src = IMG_FALLBACK; }}
                                        />
                                        <span className="absolute top-3 left-3 bg-panel/90 text-cream text-[10px] font-bold px-2.5 py-1.5 uppercase tracking-wider rounded-md">
                                            {adv.difficulty || 'Moderate'}
                                        </span>
                                        <button
                                            onClick={(e) => handleWishlist(e, adv)}
                                            aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                                            aria-pressed={wishlisted}
                                            className="absolute top-3 right-3 w-10 h-10 bg-mist/95 backdrop-blur-sm rounded-md flex items-center justify-center text-stone hover:bg-ember hover:text-cream transition-colors shadow-smoke"
                                        >
                                            <Heart size={15} className={wishlisted ? 'fill-current text-ember' : ''} />
                                        </button>
                                    </div>

                                    <div className="flex flex-1 flex-col p-4">
                                        <div className="flex items-start justify-between gap-2 min-h-[3.25rem]">
                                            <h3 className="font-display text-lg leading-snug text-stone group-hover:text-ember transition-colors font-semibold line-clamp-2">
                                                {adv.title}
                                            </h3>
                                            {adv.rating > 0 && (
                                                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                                    <Star size={12} className="text-ember fill-current" />
                                                    <span className="text-sm font-bold text-stone">{adv.rating}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-center gap-3 text-sm text-muted min-h-[1.25rem]">
                                            <span className="inline-flex items-center gap-1 min-w-0 truncate">
                                                <MapPin size={12} className="text-ember shrink-0" />
                                                <span className="truncate">{adv.location}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1 shrink-0">
                                                <Clock size={12} className="text-ember" />
                                                {adv.duration}
                                            </span>
                                        </div>

                                        <div className="mt-auto flex items-baseline justify-between pt-3 border-t border-stone/8">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">From</span>
                                                <span className="font-display text-xl text-stone font-semibold">₹{adv.price?.toLocaleString('en-IN')}</span>
                                            </div>
                                            <span className="text-sm font-bold text-ember inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                                                Book <ArrowRight size={14} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.article>
                        );
                    })}
                </div>

                <div className="md:hidden mt-10">
                    <Link to="/adventures" className="btn btn-primary w-full">
                        Browse all adventures
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Adventures;
