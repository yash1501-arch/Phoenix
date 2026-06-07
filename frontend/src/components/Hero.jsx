import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Play, MapPin, Users, Star, Shield } from 'lucide-react';

const Hero = () => {
  const badges = [
    { icon: Users, label: '15K+ Adventurers' },
    { icon: Shield, label: 'Safety First' },
    { icon: Star, label: '4.9/5 Rating' },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop"
          alt="Mountain landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
      </div>

      <div className="container relative z-10 pt-28 pb-16">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-6 sm:mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                Born to Explore India
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-black leading-[0.95] tracking-tight mb-4 sm:mb-6"
            >
              Discover the
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">
                Unseen Bharat
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-gray-600 max-w-xl mb-8 sm:mb-10 leading-relaxed"
            >
              From the peaks of Himalayas to the ghats of Maharashtra. Experience the true spirit of Indian adventure with the country's most elite trekking community.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col xs:flex-row gap-3 sm:gap-4 mb-10 sm:mb-12"
            >
              <button className="group inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-colors shadow-lg text-sm sm:text-base">
                Start Yatra
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all text-sm sm:text-base">
                <Play size={18} className="fill-gray-700" />
                Watch Video
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-4 sm:gap-6"
            >
              {badges.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                    <b.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">{b.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 hidden lg:block"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <div className="bg-white rounded-2xl p-3 shadow-xl shadow-black/5 border border-gray-100 -rotate-2">
                  <img
                    src="https://images.unsplash.com/photo-1541336032412-204896aeb7d0?q=80&w=600&auto=format&fit=crop"
                    className="rounded-xl w-full h-44 object-cover"
                    alt="Trekking"
                  />
                  <div className="p-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Camping</p>
                    <p className="font-bold text-gray-900">Rishikesh</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl">
                  <p className="text-3xl font-black text-white mb-1">4.9/5</p>
                  <p className="text-[#D4AF37] text-lg tracking-wider mb-1">★★★★★</p>
                  <p className="text-sm text-gray-400 font-medium">2,000+ reviews</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-2xl p-6 h-36 flex flex-col justify-between shadow-xl">
                  <MapPin className="text-white/70 w-6 h-6" />
                  <div>
                    <p className="text-white/80 text-xs font-medium">Top Location</p>
                    <p className="text-white font-black text-xl">Himalayas</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-3 shadow-xl shadow-black/5 border border-gray-100 rotate-2">
                  <img
                    src="https://images.unsplash.com/photo-1516738901171-8eb4fc2ab429?q=80&w=600&auto=format&fit=crop"
                    className="rounded-xl w-full h-72 object-cover"
                    alt="Mountain"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
