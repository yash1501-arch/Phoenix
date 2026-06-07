// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Shield, Heart, AlertTriangle, Phone, MapPin, Wind } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';

const sections = [
    {
        icon: Shield,
        title: 'Pre-Trip Briefings',
        body:
            'Every trek starts with a 45-minute safety brief covering route, weather, altitude, and emergency exits. No exceptions.',
    },
    {
        icon: AlertTriangle,
        title: 'Real-Time Risk Monitoring',
        body:
            'Our operations team monitors IMD weather alerts, forest department bulletins, and route telemetry 24/7 during active trips.',
    },
    {
        icon: Heart,
        title: 'Certified Wilderness First Responders',
        body:
            'Lead guides hold WFR or WFA certifications. Each group carries a fully-stocked medical kit, oxygen cylinder, and AED on Himalayan routes.',
    },
    {
        icon: Wind,
        title: 'Acclimatisation Protocol',
        body:
            'For treks above 3,000 m, we follow a slow ascent protocol (≤ 500 m sleeping elevation gain per day) and include a mandatory rest day.',
    },
    {
        icon: Phone,
        title: 'Always-On Communication',
        body:
            'Every trekker carries a satellite messenger (Garmin inReach) on remote routes. You can share live location with family at any time.',
    },
    {
        icon: MapPin,
        title: 'Insurance & Permits',
        body:
            'All trips include domestic travel insurance and forest/trekking permits. We do not operate in restricted zones without authorisation.',
    },
];

const Safety = () => (
    <>
        <Seo
            title="Safety Policy"
            description="How Phoenix Adventures keeps every trekker safe — from Sahyadri monsoon trails to Himalayan summits."
        />
        <Navbar />
        <PageHero
            eyebrow="Your safety is non-negotiable"
            title="Built for the Wild. Engineered for Safety."
            subtitle="Comprehensive protocols, certified guides, and real-time risk monitoring on every adventure we run."
            breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Safety Policy' }]}
        />
        <section className="bg-white py-20">
            <div className="container">
                <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sections.map((s, i) => (
                        <motion.article
                            key={s.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-2xl border border-[#D4AF37]/30 bg-white p-6 shadow-professional transition-all hover:-translate-y-1 hover:shadow-professional-lg"
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-white">
                                <s.icon size={22} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.body}</p>
                        </motion.article>
                    ))}
                </div>

                <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#FFFDF8] to-[#FFF8E5] p-8 text-center">
                    <h2 className="text-2xl font-extrabold text-gray-900">24/7 Emergency Line</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        If a loved one is on an active trek and you need real-time updates, call our operations desk.
                    </p>
                    <a href="tel:+919876543210" className="btn btn-primary mt-5">
                        <Phone size={16} /> +91 98765 43210
                    </a>
                </div>
            </div>
        </section>
    <MobileTabBarSpacer />
    <Footer />
    </>
);

export default Safety;
