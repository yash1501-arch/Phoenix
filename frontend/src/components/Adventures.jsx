import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Star, Heart, MapPin, Clock } from 'lucide-react';
import { adventuresAPI, getImageUrl } from '../utils/api';

const Adventures = () => {
    const [adventures, setAdventures] = useState([]);
    const [loading, setLoading] = useState(true);

    const tagColors = {
        'Easy': 'bg-[#F0E68C]/20 text-[#D4AF37] border-[#D4AF37]/30',
        'Moderate': 'bg-[#F0E68C]/30 text-[#D4AF37] border-[#D4AF37]/40',
        'Challenging': 'bg-black/10 text-black border-black/20',
        'Trending': 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
    };

    useEffect(() => {
        const fetchAdventures = async () => {
            try {
                // Fetch active adventures
                const response = await adventuresAPI.getAll({ status: 'active', limit: 8 });
                setAdventures(response.data.data);
            } catch (error) {
                console.error('Error fetching adventures:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdventures();
    }, []);

    const getTagColor = (difficulty) => {
        return tagColors[difficulty] || 'bg-white/10 text-black border-black/20';
    };

    if (loading) {
        return (
            <section className="py-20 bg-gradient-to-b from-[#F0E68C]/5 to-white flex justify-center items-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            </section>
        );
    }

    if (!loading && adventures.length === 0) {
        // Optional: Show "No adventures found" default or just hide
        return null;
    }

    return (
        <section id="adventures" className="py-16 sm:py-20 md:py-24 lg:py-32 bg-gradient-to-b from-[#F0E68C]/5 to-white" aria-labelledby="adventures-heading">
            <div className="container">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl"
                    >
                        <span className="text-[#D4AF37] font-bold tracking-widest uppercase text-xs md:text-sm inline-block mb-3 md:mb-4">
                            Upcoming Expeditions
                        </span>
                        <h2 id="adventures-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-black leading-tight">
                            Choose Your{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F0E68C]">
                                Destination
                            </span>
                        </h2>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ x: 5 }}
                        className="hidden md:flex items-center gap-2 text-black hover:text-[#D4AF37] transition-colors font-bold group"
                    >
                        View All Treks
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </div>

                {/* Adventures Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                    {adventures.map((adv, index) => (
                        <motion.div
                            key={adv.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -8 }}
                            className="group bg-white rounded-3xl p-3 shadow-professional hover:shadow-professional-lg transition-all duration-300 cursor-pointer border border-[#D4AF37]/20"
                        >
                            {/* Image Container */}
                            <div className="relative overflow-hidden rounded-2xl mb-4 aspect-[4/5]">
                                <img
                                    src={getImageUrl(adv.image_url) || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop'}
                                    alt={adv.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop'; }}
                                />

                                {/* Tag/Difficulty Badge */}
                                <div className={`absolute top-3 left-3 ${getTagColor(adv.difficulty)} backdrop-blur-sm text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider border`}>
                                    {adv.difficulty || 'Adventure'}
                                </div>

                                {/* Like Button */}
                                <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 hover:bg-primary hover:text-white transition-all shadow-sm">
                                    <Heart size={16} className="group-hover:fill-current transition-all" />
                                </button>

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>

                            {/* Card Content */}
                            <div className="px-2 pb-2 space-y-3">
                                {/* Title & Rating */}
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="text-sm sm:text-base md:text-lg font-bold leading-tight text-black group-hover:text-[#D4AF37] transition-colors line-clamp-2 flex-1">
                                        {adv.title}
                                    </h3>
                                    <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg shrink-0">
                                        <Star size={12} className="text-green-600 fill-current" />
                                        <span className="text-xs font-bold text-green-700">{adv.rating || 'New'}</span>
                                    </div>
                                </div>

                                {/* Location & Duration */}
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={14} className="text-[#D4AF37] shrink-0" />
                                        <span className="font-medium line-clamp-1">{adv.location}</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                                    <div className="flex items-center gap-1">
                                        <Clock size={14} className="text-[#D4AF37] shrink-0" />
                                        <span className="font-medium">{adv.duration}</span>
                                    </div>
                                </div>

                                {/* Price & CTA */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <div>
                                        <p className="text-[10px] text-gray-700 font-bold uppercase tracking-wide mb-0.5">
                                            Starting at
                                        </p>
                                        <p className="text-lg sm:text-xl md:text-2xl font-black text-black">
                                            ₹{adv.price}
                                        </p>
                                    </div>
                                    <button className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black text-white flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:scale-110 transition-all shadow-lg">
                                        <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>

                                {/* Reviews Count */}
                                <p className="text-xs text-gray-600 font-medium">
                                    {adv.reviews_count > 0 ? `Based on ${adv.reviews_count} reviews` : 'Be the first to review!'}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Mobile View All Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="md:hidden btn btn-outline w-full mt-8 flex items-center justify-center gap-2 text-black border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
                >
                    View All Treks
                    <ArrowRight size={18} />
                </motion.button>
            </div>
        </section>
    );
};

export default Adventures;
