import { Link } from 'react-router-dom';
import { Home, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0b0b0b] to-black px-4 text-white">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md text-center"
        >
            <div className="font-display text-[120px] font-black leading-none bg-gradient-to-br from-[#D4AF37] to-[#F0E68C] bg-clip-text text-transparent">
                404
            </div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                <Shield size={14} /> Restricted area
            </div>
            <h1 className="text-2xl font-extrabold">Page not found</h1>
            <p className="mt-2 text-sm text-white/70">
                The admin page you tried to open doesn't exist or has been moved.
            </p>
            <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-5 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all">
                <Home size={16} /> Back to dashboard
            </Link>
        </motion.div>
    </div>
);

export default NotFound;
