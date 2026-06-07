import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, MapPin, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import ScrollAnimation from '../components/ScrollAnimation';
import WishlistButton from '../components/ui/WishlistButton';
import { adventuresAPI, getImageUrl } from '../utils/api';

const AdventuresPage = () => {
  const [adventures, setAdventures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAdventures = async () => {
      try {
        const response = await adventuresAPI.getAll({ status: 'active' });
        setAdventures(response.data.data);
      } catch (error) {
        console.error('Error fetching adventures:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdventures();
  }, []);

  const filteredAdventures = adventures.filter(adv => {
    const matchesSearch = (adv.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (adv.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || adv.difficulty?.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const difficultyFilters = [
    { id: 'all', name: 'All Adventures' },
    { id: 'easy', name: 'Easy' },
    { id: 'moderate', name: 'Moderate' },
    { id: 'challenging', name: 'Challenging' },
  ];

  if (loading) {
    return (
      <div id="main-content" className="min-h-screen bg-gradient-to-b from-white to-[#F0E68C]/5">
        <Navbar />
        <div className="pt-32 flex justify-center items-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        </div>
    <MobileTabBarSpacer />
    <Footer />
      </div>
    );
  }

  return (
    <div id="main-content" className="min-h-screen bg-gradient-to-b from-white to-[#F0E68C]/5">
      <Navbar />
      
      <div className="pt-28 sm:pt-32 pb-12 sm:pb-16 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
            <img 
                src="/src/assets/images/hero-bg.png" 
                alt="Background" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm" />
        </div>
        
        {/* Hero Section */}
        <ScrollAnimation>
          <div className="relative z-10 text-center max-w-4xl mx-auto mb-12 md:mb-16 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[#D4AF37] text-xs font-bold tracking-wider uppercase">
                Explore Our Adventures
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black mb-6">
              Available <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">Adventures</span>
            </h1>
            <p className="text-gray-800 text-lg md:text-xl leading-relaxed">
              Discover our handpicked collection of adventures curated by our expert team. Each adventure is carefully planned for your safety and enjoyment.
            </p>
          </div>
        </ScrollAnimation>

        {/* Search and Filter Section */}
        <ScrollAnimation>
          <div className="container mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-professional border border-[#D4AF37]/20">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search adventures or locations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-[#D4AF37]/30 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Difficulty Filter */}
                <div className="flex items-center gap-3">
                  <svg className="text-[#D4AF37] w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-3 border border-[#D4AF37]/30 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all bg-white"
                  >
                    {difficultyFilters.map(filterOption => (
                      <option key={filterOption.id} value={filterOption.id}>{filterOption.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimation>

        {/* Adventures Grid */}
        <div className="container">
          {filteredAdventures.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAdventures.map((adv, index) => (
                <ScrollAnimation key={adv._id} delay={index * 0.1}>
                  <Link to={`/adventure/${adv._id}`} className="block">
                    <motion.div
                      whileHover={{ y: -8 }}
                      className="group bg-white rounded-3xl p-4 shadow-professional hover:shadow-professional-lg transition-all duration-300 cursor-pointer border border-[#D4AF37]/20"
                    >
                    {/* Image Container */}
                    <div className="relative overflow-hidden rounded-2xl mb-4 aspect-[4/5]">
                      <img
                        src={getImageUrl(adv.image_url) || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop'}
                        alt={adv.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop'; }}
                      />
                      
                      {/* Difficulty Badge */}
                      <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border backdrop-blur-sm ${
                        adv.difficulty === 'Easy' ? 'bg-[#F0E68C]/20 text-[#D4AF37] border-[#D4AF37]/30' :
                        adv.difficulty === 'Moderate' ? 'bg-[#F0E68C]/30 text-[#D4AF37] border-[#D4AF37]/40' :
                        adv.difficulty === 'Challenging' ? 'bg-black/10 text-black border-black/20' :
                        'bg-white/10 text-black border-black/20'
                      }`}>
                        {adv.difficulty || 'Adventure'}
                      </div>

                      {/* Like Button */}
                      <div className="absolute top-3 right-3">
                        <WishlistButton adventure={adv} size="sm" />
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="space-y-3">
                      {/* Title & Rating */}
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-base md:text-lg font-bold leading-tight text-black group-hover:text-[#D4AF37] transition-colors line-clamp-2 flex-1">
                          {adv.title}
                        </h3>
                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg shrink-0">
                          <Star size={12} className="text-green-600 fill-current" />
                          <span className="text-xs font-bold text-green-700">{adv.rating || 'New'}</span>
                        </div>
                      </div>

                      {/* Location & Duration */}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-[#D4AF37]" />
                          <span className="font-medium line-clamp-1">{adv.location}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-[#D4AF37]" />
                          <span className="font-medium">{adv.duration}</span>
                        </div>
                      </div>

                      {/* Next available date */}
                      {(() => {
                        const raw = typeof adv.available_dates === 'string'
                          ? JSON.parse(adv.available_dates || '[]')
                          : (adv.available_dates || []);
                        const next = Array.isArray(raw) && raw.length > 0 ? raw[0] : null;
                        if (!next) return (
                          <p className="text-[11px] text-amber-700 bg-amber-50 inline-block px-2 py-0.5 rounded-md font-semibold">
                            No upcoming dates
                          </p>
                        );
                        const [y, m, d] = next.split('-').map(Number);
                        const dt = new Date(Date.UTC(y, m - 1, d));
                        const formatted = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
                        const total = Array.isArray(raw) ? raw.length : 0;
                        return (
                          <p className="text-[11px] text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded-md font-semibold">
                            Next: {formatted}{total > 1 ? ` (+${total - 1} more)` : ''}
                          </p>
                        );
                      })()}

                      {/* Price & CTA */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-0.5">
                            Starting from
                          </p>
                          <p className="text-xl md:text-2xl font-black text-black">
                            ₹{adv.price}
                          </p>
                        </div>
                        <button className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:scale-110 transition-all shadow-lg">
                          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>

                      {/* Reviews Count */}
                      <p className="text-xs text-gray-500 font-medium">
                        {adv.reviews_count > 0 ? `Based on ${adv.reviews_count} reviews` : 'Be the first to review!'}
                      </p>
                    </div>
                    </motion.div>
                  </Link>
                </ScrollAnimation>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-500 text-lg">No adventures found matching your criteria.</div>
              <button 
                onClick={() => { setFilter('all'); setSearchTerm(''); }}
                className="mt-4 px-6 py-3 bg-[#D4AF37] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    <MobileTabBarSpacer />
    <Footer />
    </div>
  );
};

export default AdventuresPage;