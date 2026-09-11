import { Link } from 'react-router-dom';
import { Home, Compass, ArrowLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { EASE, IconMotion } from '../components/ui/Motion';

const NotFound = () => {
  const reduced = useReducedMotion();

  return (
    <div className="min-h-screen bg-panel">
      <Seo title="404 | Page Not Found" description="The page you are looking for has wandered off the trail." />
      <Navbar />
      <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-24 text-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(240,89,30,0.12),_transparent_55%)]"
        />
        <div className="relative z-10 max-w-2xl text-center">
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="font-display text-[140px] font-semibold leading-none text-ember md:text-[200px]"
          >
            404
          </motion.div>
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
            className="mb-6 inline-flex items-center gap-2 rounded-md border border-ember/40 bg-ember/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ember"
          >
            <IconMotion>
              <Compass size={14} />
            </IconMotion>
            Off the trail
          </motion.div>
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: EASE }}
            className="font-display text-3xl font-semibold sm:text-4xl !text-cream"
          >
            This path leads nowhere… yet.
          </motion.h1>
          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
            className="mx-auto mt-3 max-w-md text-base text-cream/70"
          >
            The page you are looking for has wandered into the Sahyadris. Let&apos;s get you back to base camp.
          </motion.p>
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/" className="btn btn-primary">
              <Home size={16} /> Back to Home
            </Link>
            <Link to="/adventures" className="btn btn-outline !border-cream/30 !text-cream hover:!border-ember hover:!bg-ember hover:!text-white">
              <Compass size={16} /> Explore Adventures
            </Link>
          </motion.div>
          <Link to="/" className="mt-8 inline-flex items-center gap-1 text-sm text-cream/50 hover:text-cream transition-colors">
            <ArrowLeft size={14} /> Or go back
          </Link>
        </div>
      </main>
            <Footer />
    </div>
  );
};

export default NotFound;
