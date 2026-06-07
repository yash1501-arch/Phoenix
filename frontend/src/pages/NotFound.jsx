import { Link } from 'react-router-dom';
import { Home, Compass, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import Seo from '../components/Seo';

const NotFound = () => (
    <>
        <Seo title="404 | Page Not Found" description="The page you are looking for has wandered off the trail." />
        <Navbar />
        <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-black via-[#0b0b0b] to-black px-4 pt-24 text-white">
            <div aria-hidden className="pointer-events-none absolute -top-32 -right-20 h-96 w-96 rounded-full bg-[#D4AF37]/20 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />
            <div className="relative z-10 max-w-2xl text-center">
                <div className="font-display text-[140px] font-black leading-none text-transparent bg-gradient-to-br from-[#D4AF37] to-[#F0E68C] bg-clip-text md:text-[200px]">
                    404
                </div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                    <Compass size={14} /> Off the trail
                </div>
                <h1 className="text-3xl font-extrabold sm:text-4xl">This path leads nowhere… yet.</h1>
                <p className="mx-auto mt-3 max-w-md text-base text-white/70">
                    The page you are looking for has wandered into the Sahyadris. Let's get you back to base camp.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link to="/" className="btn btn-primary">
                        <Home size={16} /> Back to Home
                    </Link>
                    <Link to="/adventures" className="btn btn-outline border-white/30 text-white hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white">
                        <Compass size={16} /> Explore Adventures
                    </Link>
                </div>
                <Link to="/" className="mt-8 inline-flex items-center gap-1 text-sm text-white/50 hover:text-white">
                    <ArrowLeft size={14} /> Or go back
                </Link>
            </div>
        </main>
    <MobileTabBarSpacer />
    <Footer />
    </>
);

export default NotFound;
