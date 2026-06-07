import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollAnimation from '../components/ScrollAnimation';
import InstagramFeed from '../components/ui/InstagramFeed';
import { MobileTabBarSpacer } from '../components/Footer';
import { publicSettingsAPI } from '../utils/api';

const Gallery = () => {
  const [filter, setFilter] = useState('all');
  const [igPosts, setIgPosts] = useState([]);
  const [igHandle, setIgHandle] = useState('@phoenixadventures');

  useEffect(() => {
    let alive = true;
    Promise.all([
      publicSettingsAPI.getInstagramPosts(),
      publicSettingsAPI.getHandle(),
    ]).then(([posts, handle]) => {
      if (!alive) return;
      setIgPosts(posts);
      setIgHandle(handle);
    });
    return () => { alive = false; };
  }, []);

  return (
    <div id="main-content" className="min-h-screen bg-gradient-to-b from-white to-[#F0E68C]/5">
      <Navbar />

      {/* Hero — generous top padding so the fixed navbar doesn't clip, balanced bottom margin */}
      <section className="relative overflow-hidden pt-28 sm:pt-32 pb-12 sm:pb-16">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero-bg.png"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm" />
        </div>

        <ScrollAnimation>
          <div className="relative z-10 text-center max-w-4xl mx-auto mb-12 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[#D4AF37] text-xs font-bold tracking-wider uppercase">
                Our Adventures
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black mb-6">
              Photo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">Gallery</span>
            </h1>
            <p className="text-gray-800 text-lg md:text-xl leading-relaxed">
              Explore breathtaking moments from our adventures around the world. Every picture tells a story of courage, beauty, and unforgettable experiences.
            </p>
          </div>
        </ScrollAnimation>
      </section>

      {/* Instagram feed — only renders if admin has set instagram_posts in /api/settings */}
      <InstagramFeed posts={igPosts} handle={igHandle} />

      <Footer />
      <MobileTabBarSpacer />
    </div>
  );
};

export default Gallery;