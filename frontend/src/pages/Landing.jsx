import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Adventures from '../components/Adventures';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import { motion, useScroll, useSpring } from 'framer-motion';
import { BookOpen, ArrowRight, MessageCircle, Mountain, Compass, Camera, Sun, Navigation, Wind } from 'lucide-react';

const useCountUp = (end, duration = 2) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = null;
          const fn = (t) => {
            if (!start) start = t;
            const p = Math.min((t - start) / (duration * 1000), 1);
            const e = 1 - Math.pow(1 - p, 3);
            setCount(Math.floor(e * end));
            if (p < 1) requestAnimationFrame(fn);
          };
          requestAnimationFrame(fn);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);
  return [count, ref];
};

const StatCounter = ({ value, label, delay }) => {
  const n = parseInt(String(value).replace(/[+,]/g, ''), 10) || 0;
  const suf = String(value).includes('+') ? '+' : '';
  const [count, ref] = useCountUp(n);
  return (
    <FadeIn delay={delay}>
      <div ref={ref} className="text-center">
        <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">
          {count.toLocaleString()}{suf}
        </p>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1.5">{label}</p>
      </div>
    </FadeIn>
  );
};

const FadeIn = ({ children, delay = 0, y = 30, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const SectionTitle = ({ tag, title, highlight }) => (
  <div className="text-center max-w-2xl mx-auto mb-14">
    <span className="inline-block text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase mb-4">{tag}</span>
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black leading-tight">
      {title}{' '}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">{highlight}</span>
    </h2>
  </div>
);

const features = [
  { icon: Mountain, title: 'Summit Treks', desc: 'Guided expeditions to the most iconic peaks across the Indian Himalayas.' },
  { icon: Compass, title: 'Guided Routes', desc: 'Expert-led journeys through untouched trails and hidden valleys.' },
  { icon: Camera, title: 'Photo Tours', desc: 'Golden-hour shoots at the most scenic vantage points in the country.' },
  { icon: Sun, title: 'Sunrise Camps', desc: 'Spend the night above the clouds and wake to unforgettable sunrises.' },
  { icon: Navigation, title: 'Off-Map Treks', desc: 'Venture beyond the guidebooks into raw, unexplored wilderness.' },
  { icon: Wind, title: 'Thrill Activities', desc: 'Rappelling, river crossings, and high-altitude adventure sports.' },
];

const statItems = [
  { value: '15,000+', label: 'Happy Explorers' },
  { value: '120+', label: 'Adventures' },
  { value: '50+', label: 'Expert Guides' },
  { value: '4.9/5', label: 'Safety Rating' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 30 });

  return (
    <div className="overflow-x-hidden bg-white">
      <motion.div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] origin-left z-50" style={{ scaleX: progress }} />

      <Navbar />
      <Hero />

      <section className="py-16 border-y border-gray-100">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statItems.map((s, i) => (
              <StatCounter key={s.label} value={s.value} label={s.label} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container">
          <FadeIn>
            <SectionTitle tag="Why Phoenix" title="Built for" highlight="Adventurers" />
            <p className="text-center text-gray-500 max-w-xl mx-auto mb-14 -mt-10">
              Every expedition is crafted from real experience. We trek the same trails, sleep under the same stars, and share the same fire.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="group p-5 sm:p-6 rounded-xl border border-gray-100 hover:border-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/5 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-[#D4AF37]/20 transition-colors">
                    <f.icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2} className="text-center mt-12">
            <button
              onClick={() => navigate('/adventures')}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-colors shadow-lg"
            >
              <BookOpen size={18} />
              Explore All Adventures
              <ArrowRight size={18} />
            </button>
          </FadeIn>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div>
                <span className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase mb-4 block">Our Story</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black leading-tight mb-6">
                  Crafting Adventures,
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">Creating Memories</span>
                </h2>
                <p className="text-gray-500 leading-relaxed mb-8">
                  Phoenix Adventures was born from a simple belief — that the best stories are written on mountain trails. 
                  For over a decade, we've been connecting passionate explorers with India's most breathtaking landscapes, 
                  blending safety and sustainability with pure thrill.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-10">
                  {[
                    { value: '10K+', label: 'Adventurers' },
                    { value: '50+', label: 'Destinations' },
                    { value: '12+', label: 'Years' },
                    { value: '4.9/5', label: 'Rating' },
                  ].map((a, i) => (
                    <div key={i}>
                      <p className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">{a.value}</p>
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">{a.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-lg -rotate-2">
                    <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop" className="w-full h-48 object-cover" alt="Mountain" />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg translate-y-4 rotate-2">
                    <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=600&auto=format&fit=crop" className="w-full h-48 object-cover" alt="Camping" />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="rounded-2xl overflow-hidden shadow-lg -rotate-1">
                    <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop" className="w-full h-48 object-cover" alt="Hiking" />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg -translate-y-4 rotate-1">
                    <img src="https://images.unsplash.com/photo-1487730116645-74489c95b41b?q=80&w=600&auto=format&fit=crop" className="w-full h-48 object-cover" alt="Sunset" />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/95 to-black/80" />
        </div>

        <div className="container relative z-10">
          <FadeIn className="text-center max-w-3xl mx-auto">
            <span className="inline-block text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase mb-4">Start Your Journey</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Ready for the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F0E68C]">Unknown?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              The mountains are calling. Come breathe the thin air, feel the raw wind, and stand where few have stood.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => navigate('/adventures')}
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/25 transition-all"
              >
                <BookOpen size={18} />
                Book Next Trek
              </button>
              <a
                href="https://wa.me/919326546593"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-4 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/5 transition-colors"
              >
                <MessageCircle size={18} />
                Chat on WhatsApp
              </a>
            </div>

            <div className="flex justify-center gap-8 mt-12 text-xs text-gray-500">
              {['Available Now', '24/7 Support', 'Instant Booking'].map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${['bg-green-500', 'bg-blue-500', 'bg-[#D4AF37]'][i]}`} />
                  {l}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>
    <MobileTabBarSpacer />
    <Footer />
    </div>
  );
};

export default Landing;
