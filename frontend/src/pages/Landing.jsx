import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Adventures from '../components/Adventures';
import Marquee, { MarqueeItem } from '../components/ui/Marquee';
import Footer from '../components/Footer';
import { publicSettingsAPI } from '../utils/api';
import GoogleReviews from '../components/ui/GoogleReviews';
import {
  ArrowRight, Mountain, Compass, Camera, Sun, Navigation, Wind,
  Shield, Users, Leaf, Star, ChevronDown, MessageCircle, MapPin,
} from 'lucide-react';

// Destinations focused on brief (Sahyadri forts / Maharashtra outdoors). TODO: confirm extra ranges with client.
const destinations = [
  { name: 'Sahyadris', desc: 'Fort ridges, monsoon trails, and weekend escapes from Mumbai.', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Raigad & Rajgad', desc: 'History-led fort treks at the heart of the Maratha landscape.', image: 'https://images.unsplash.com/photo-1541336032412-204896aeb7d0?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Torna & Pratapgad', desc: 'Ridge walks with stories of forts and the Konkan wind.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Shivneri & Hadsar', desc: 'Approachable fort day-treks with end-to-end logistics.', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1200&auto=format&fit=crop' },
];

const categories = [
  { name: '1-Day Trek', icon: Mountain, href: '/treks', image: 'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?q=80&w=800&auto=format&fit=crop', count: 'Sahyadri fort day-hikes' },
  { name: 'Camping', icon: Sun, href: '/camping', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop', count: 'Overnight under the stars' },
  { name: 'Tours', icon: Navigation, href: '/tours', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop', count: 'Longer multi-day journeys' },
  { name: 'Gallery', icon: Camera, href: '/gallery', image: 'https://images.unsplash.com/photo-1516738901171-8eb4fc2ab429?q=80&w=800&auto=format&fit=crop', count: 'From the trail' },
];

const pillars = [
  { icon: Shield, title: 'Safety first', text: 'Satellite phones, medical kits, and IRCA-trained leaders on every expedition.' },
  { icon: Users, title: 'Small groups', text: 'Capped at 12–14 people so the trail stays personal and the pace stays human.' },
  { icon: Leaf, title: 'Leave no trace', text: 'We partner with local communities and pack out what we pack in.' },
];

const faqItems = [
  { q: 'What fitness level do I need?', a: 'We run easy weekend treks through high-altitude expeditions. Each trip page lists difficulty, altitude, and prep.' },
  { q: 'What is included?', a: 'Guide, camping gear, trek meals, permits, and first-aid. Transport varies by trip — details are on each adventure page.' },
  { q: 'How do I book and pay?', a: 'Tap Book Now, choose date and seats (total = price × people). Pay via UPI to our QR / 9372506447@sbi, then upload screenshot + UTR. We confirm after bank verification — no Razorpay/Paytm fees.' },
  { q: 'Is it safe for solo travellers?', a: 'Yes — nearly 40% of our guests travel solo. You join a vetted group; guides keep everyone included and safe.' },
  { q: 'Cancellation policy?', a: '30+ days: 90% refund. 15–29 days: 50%. 7–14 days: 25%. Inside 7 days: no refund, but you can transfer your seat. See Refund Policy for full terms.' },
];

const useCountUp = (end, duration = 1.8) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      let start = null;
      const fn = (t) => {
        if (!start) start = t;
        const p = Math.min((t - start) / (duration * 1000), 1);
        setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
        if (p < 1) requestAnimationFrame(fn);
      };
      requestAnimationFrame(fn);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);
  return [count, ref];
};

const Stat = ({ value, label, suffix = '', className = '' }) => {
  const n = parseInt(String(value).replace(/[+,★]/g, ''), 10) || 0;
  const [count, ref] = useCountUp(n);
  return (
    <div ref={ref} className={`text-center ${className}`}>
      <p className="font-display text-3xl md:text-4xl text-mist font-semibold tabular-nums leading-none">
        {value.includes('★') ? '4.9' : count.toLocaleString()}
        <span className="text-ember text-xl md:text-2xl">
          {suffix || (value.includes('+') ? '+' : value.includes('★') ? '★' : '')}
        </span>
      </p>
      <p className="mt-2.5 text-sm text-mist/50 font-medium leading-snug">{label}</p>
    </div>
  );
};

const IconHover = ({ icon: Icon, className = '' }) => (
  <motion.span
    whileHover={{ rotate: [0, -12, 8, 0], scale: 1.1 }}
    transition={{ duration: 0.45 }}
    className={`inline-flex ${className}`}
  >
    <Icon size={22} strokeWidth={2} />
  </motion.span>
);

const Landing = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeDest, setActiveDest] = useState(0);
  const [paused, setPaused] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('919372506447');

  useEffect(() => {
    publicSettingsAPI.getAll().then((all) => {
      if (all.whatsapp) setWhatsappNumber(String(all.whatsapp).replace(/\D/g, '') || '919372506447');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = setInterval(() => setActiveDest((p) => (p + 1) % destinations.length), 4500);
    return () => clearInterval(id);
  }, [paused, reduceMotion]);

  return (
    <div className="overflow-x-hidden bg-mist">
      <Navbar />
      <Hero />

      {/* Trust strip — tribe framing from brief (no invented publications) */}
      <section className="py-10 bg-stone border-y border-mist/5" aria-label="Adventure tribe">
        <Marquee speed={28} pauseOnHover gradientWidth={48}>
          {[
            'Discover the great outdoors with our adventure tribe',
            'Sahyadri forts · Raigad · Rajgad · Torna',
            'Safety-first · Own pace · End-to-end logistics',
            'Est. 22 March 2023 · Mumbai',
            'Pratapgad · Shivneri · Hadsar · Sagargad',
          ].map((name) => (
            <MarqueeItem key={name}>
              <span className="font-display text-sm md:text-base font-medium text-mist/35 tracking-wide whitespace-nowrap px-6">
                {name}
              </span>
            </MarqueeItem>
          ))}
        </Marquee>
      </section>

      {/* Stats from CONTEXT.md — verbatim trust metrics */}
      <section className="bg-stone py-16 md:py-20">
        <div className="container">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-5 lg:gap-x-10 xl:gap-x-12 list-none m-0 p-0">
            {[
              { value: '45+', label: 'Volunteers connected' },
              { value: '500+', label: 'Trips completed' },
              { value: '15000+', label: 'Happy explorers' },
              { value: '50+', label: 'Local guides' },
              { value: '4.9★', label: 'Average rating', mobileCenter: true },
            ].map((item) => (
              <li
                key={item.label}
                className={[
                  'min-w-0 text-center',
                  item.mobileCenter ? 'col-span-2 lg:col-span-1 flex justify-center' : '',
                ].filter(Boolean).join(' ')}
              >
                <Stat
                  value={item.value}
                  label={item.label}
                  className={item.mobileCenter ? 'w-full max-w-[11rem] lg:max-w-none' : 'w-full'}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Category discovery — photo tiles */}
      <section className="section bg-mist">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
            <div>
              <p className="kicker mb-3">Choose your trail</p>
              <h2 className="font-display text-display-lg text-stone font-semibold max-w-lg">
                What kind of wild are you after?
              </h2>
            </div>
            <Link to="/adventures" className="group inline-flex items-center gap-2 font-bold text-stone hover:text-ember transition-colors">
              See all adventures
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {categories.map((cat, i) => (
              <motion.button
                key={cat.name}
                type="button"
                onClick={() => navigate(cat.href)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className="relative h-64 md:h-72 rounded-lg overflow-hidden text-left group"
              >
                <img src={cat.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone via-stone/40 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-ember/90 text-white mb-3">
                    <IconHover icon={cat.icon} />
                  </span>
                  <h3 className="font-display text-xl text-mist font-semibold">{cat.name}</h3>
                  <p className="text-sm text-mist/60 mt-1">{cat.count}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations cinematic carousel */}
      <section className="section bg-stone text-mist overflow-hidden">
        <div className="container">
          <div className="mb-10 md:mb-12 max-w-xl">
            <p className="kicker mb-3">Where we go</p>
            <h2 className="font-display text-display-lg font-semibold">Iconic ranges. Local routes.</h2>
          </div>

          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex gap-2">
                {destinations.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveDest(i); setPaused(true); }}
                    aria-label={`Destination ${i + 1}`}
                    className={`h-1 rounded-full transition-all duration-400 ${
                      i === activeDest ? 'w-8 bg-ember' : 'w-3 bg-mist/20 hover:bg-mist/40'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-mist/40 tracking-widest">
                {String(activeDest + 1).padStart(2, '0')} / {String(destinations.length).padStart(2, '0')}
              </span>
            </div>

            <div className="relative h-[380px] sm:h-[440px] md:h-[520px] rounded-lg overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDest}
                  initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => navigate('/adventures')}
                >
                  <img
                    src={destinations[activeDest].image}
                    alt={destinations[activeDest].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone via-stone/30 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-6 md:p-10">
                    <h3 className="font-display text-3xl md:text-5xl font-semibold mb-2">
                      {destinations[activeDest].name}
                    </h3>
                    <p className="text-mist/70 max-w-md mb-4">{destinations[activeDest].desc}</p>
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-ember">
                      <MapPin size={14} /> Explore departures
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Live expeditions */}
      <Adventures />

      {/* Why Phoenix — asymmetric, not icon-card soup */}
      <section className="section bg-mist">
        <div className="container grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5">
            <p className="kicker mb-3">Why Phoenix</p>
            <h2 className="font-display text-display-lg text-stone font-semibold mb-5">
              Built for the trail — not for a brochure.
            </h2>
            <p className="text-muted leading-relaxed mb-8 max-w-md">
              Same team that answers your WhatsApp also leads the ridge. Book on WhatsApp — we confirm seats and share payment details with you directly.
            </p>
            <button onClick={() => navigate('/about')} className="btn btn-outline-ink group">
              Our story
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="lg:col-span-7 space-y-4">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="flex gap-5 p-5 md:p-6 bg-white rounded-lg border border-stone/8 hover:border-ember/30 transition-colors group"
              >
                <span className="shrink-0 w-12 h-12 rounded-md bg-stone text-ember flex items-center justify-center">
                  <IconHover icon={p.icon} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-stone mb-1">{p.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{p.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews — curated Google 4–5★ quotes; Places API when key available */}
      <section className="section-tight bg-stone">
        <div className="container mb-10">
          <p className="kicker mb-3">From Google</p>
          <h2 className="font-display text-display-lg text-mist font-semibold">What trekkers say</h2>
          <p className="mt-3 text-mist/55 text-sm max-w-lg">
            Real reviews from our Google Business Profile — fort day-treks, camping, and longer tours across the Sahyadris.
          </p>
        </div>
        <div className="container">
          <GoogleReviews />
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-mist">
        <div className="container max-w-3xl">
          <h2 className="font-display text-display-md text-stone font-semibold mb-8 text-center">Common questions</h2>
          <div className="space-y-2">
            {faqItems.map((item, i) => {
              const open = activeFaq === i;
              return (
                <div key={item.q} className="bg-white rounded-lg border border-stone/8 overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left min-h-[56px]"
                    aria-expanded={open}
                  >
                    <span className="font-semibold text-stone">{item.q}</span>
                    <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
                      <ChevronDown size={18} className="text-ember shrink-0" />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm text-muted leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-stone/80" />
        <div className="container relative z-10 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Compass className="mx-auto text-ember mb-6 float-y" size={36} />
            <h2 className="font-display text-display-lg text-mist font-semibold mb-4">
              Ready for the next ridge?
            </h2>
            <p className="text-mist/65 mb-8 mx-auto">
              Pick a departure, message us on WhatsApp with your group size. We confirm seats — usually within hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate('/adventures')} className="btn btn-primary btn-trail group">
                Browse adventures
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi! I want to plan a trek with Phoenix.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline group"
              >
                <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                WhatsApp us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

            <Footer />
    </div>
  );
};

export default Landing;
