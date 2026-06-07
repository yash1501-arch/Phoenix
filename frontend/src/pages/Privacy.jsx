import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import { Lock, Database, Share2, Eye, Mail } from 'lucide-react';

const lastUpdated = '01 June 2026';

const blocks = [
    {
        icon: Database,
        h: 'What we collect',
        p: 'Account info (name, email, phone, Aadhaar/PAN for permits), booking history, and trip feedback. We never store full card details — all payments are tokenised by Razorpay.',
    },
    {
        icon: Lock,
        h: 'How we protect it',
        p: 'TLS in transit, AES-256 at rest, role-based access for staff, and audited code. We are GDPR-aware and DPDP Act (2023) compliant.',
    },
    {
        icon: Share2,
        h: 'How we use it',
        p: 'To confirm bookings, share trip updates, issue permits, and improve our routes. We never sell your data. We share only with forest/trek authorities and our insurance partner when required.',
    },
    {
        icon: Eye,
        h: 'Your rights',
        p: 'Request export, correction, or deletion of your data at any time. We respond within 7 business days.',
    },
    {
        icon: Mail,
        h: 'Contact DPO',
        p: 'privacy@phoenixadventures.in — for any privacy-related query or grievance.',
    },
    {
        icon: Lock,
        h: 'Cookies & consent',
        p: 'We use local storage for your cart, wishlist, and session. You can manage cookie preferences anytime from the banner that appears on your first visit. Under the DPDP Act 2023, consent can be withdrawn at any time.',
    },
    {
        icon: Database,
        h: 'Data retention',
        p: 'Account data is retained while your account is active plus 3 years for tax and audit purposes. Booking records are retained for 7 years. Anonymous analytics are retained for 26 months.',
    },
    {
        icon: Share2,
        h: 'Cross-border transfers',
        p: 'Primary data resides in India. Limited operational data (email delivery, payment processing via Razorpay) may transit through third-party processors in other regions under their respective data-protection frameworks.',
    },
    {
        icon: Eye,
        h: 'Grievance officer',
        p: 'As required under DPDP Act 2023 §8(10), our Grievance Officer is: Anika Rao, grievance@phoenixadventures.in, +91 98765 43210. Response SLA: 30 days.',
    },
];

const Privacy = () => (
    <>
        <Seo title="Privacy Policy" description="How Phoenix Adventures collects, uses, and protects your data." />
        <Navbar />
        <PageHero
            eyebrow="Legal"
            title="Privacy Policy"
            subtitle="Your data, your control. Plain-language privacy practices."
            breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Privacy' }]}
        />
        <section className="bg-white py-20">
            <div className="container">
                <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
                    {blocks.map((b) => (
                        <article key={b.h} className="rounded-2xl border border-[#D4AF37]/30 bg-white p-6 shadow-professional">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-white">
                                <b.icon size={22} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{b.h}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600">{b.p}</p>
                        </article>
                    ))}
                </div>
                <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-gray-500">Last updated · {lastUpdated}</p>
            </div>
        </section>
    <MobileTabBarSpacer />
    <Footer />
    </>
);

export default Privacy;
