import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';

const groups = [
    {
        title: 'Booking & Payment',
        items: [
            {
                q: 'How do I book an adventure?',
                a: 'Browse adventures, choose a date, fill in your details, and complete the booking with full payment. Your seat is confirmed the moment payment succeeds — no waiting, no follow-ups.',
            },
            {
                q: 'What payment methods are supported?',
                a: 'UPI, net-banking, all major debit/credit cards, and EMI on cards above ₹5,000. All payments are processed by Razorpay.',
            },
            {
                q: 'Do you offer EMI?',
                a: 'Yes, on bookings above ₹5,000. Choose Card EMI, Bajaj Finserv, or ZestMoney at checkout.',
            },
        ],
    },
    {
        title: 'Trek Logistics',
        items: [
            {
                q: 'What is included in the price?',
                a: 'Permits, guide, meals on trek, accommodation (tents/homestays), safety gear, and first-aid. Transport from base city is included for most trips — check the adventure page.',
            },
            {
                q: 'What should I pack?',
                a: 'Each adventure has a detailed packing list. Common items: sturdy trekking shoes, 30–50L backpack, quick-dry layers, rain shell, headlamp, and personal medication.',
            },
            {
                q: 'How fit do I need to be?',
                a: 'Each adventure is rated Easy, Moderate, or Challenging. We strongly recommend completing the suggested pre-trip fitness routine.',
            },
        ],
    },
    {
        title: 'Safety & Cancellation',
        items: [
            {
                q: 'Is my trip insured?',
                a: 'Yes — every trip includes domestic travel insurance covering trek-related injuries, evacuation, and trip cancellation due to weather.',
            },
            {
                q: 'What if it rains heavily on the trek day?',
                a: 'Our operations team monitors IMD forecasts 72h in advance. If a trip is unsafe, we reschedule or refund 100%.',
            },
            {
                q: 'How do I cancel?',
                a: 'Email bookings@phoenixadventures.in or call +91 98765 43210. Our refund policy is outlined here.',
            },
        ],
    },
    {
        title: 'Account & Membership',
        items: [
            {
                q: 'Do you have a loyalty program?',
                a: 'Yes — Phoenix Circle. Earn 1 point per ₹100 spent; redeem on future trips. Lifetime tiers: Bronze, Silver, Gold.',
            },
            {
                q: 'Can I gift an adventure?',
                a: "Yes. Add \"Gift this trip\" at checkout and we'll email a beautifully designed voucher to the recipient.",
            },
        ],
    },
];

const FAQ = () => {
    const [query, setQuery] = useState('');
    const lower = query.toLowerCase();
    const filtered = groups
        .map((g) => ({ ...g, items: g.items.filter((i) => i.q.toLowerCase().includes(lower) || i.a.toLowerCase().includes(lower)) }))
        .filter((g) => g.items.length > 0);

    return (
        <>
            <Seo title="FAQ" description="Frequently asked questions about Phoenix Adventures treks and bookings." />
            <Navbar />
            <PageHero
                eyebrow="Help center"
                title="Frequently Asked Questions"
                subtitle="Quick answers about bookings, safety, gear, and more."
                breadcrumb={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]}
            />
            <section className="bg-white py-20">
                <div className="container">
                    <div className="mx-auto max-w-3xl">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search the FAQ…"
                                className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pl-11 pr-4 text-sm shadow-professional focus:border-[#D4AF37] focus:outline-none"
                            />
                        </div>

                        <div className="mt-10 space-y-10">
                            {filtered.length === 0 && (
                                <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
                                    No results. Try a different keyword or email help@phoenixadventures.in.
                                </p>
                            )}
                            {filtered.map((g) => (
                                <div key={g.title}>
                                    <h2 className="text-lg font-extrabold text-gray-900">{g.title}</h2>
                                    <div className="mt-4 space-y-3">
                                        {g.items.map((item) => (
                                            <details key={item.q} className="group rounded-2xl border border-[#D4AF37]/30 bg-white p-5 shadow-professional transition-all open:shadow-professional-lg">
                                                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
                                                    {item.q}
                                                    <ChevronDown size={18} className="ml-4 shrink-0 text-[#B8860B] transition-transform group-open:rotate-180" />
                                                </summary>
                                                <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.a}</p>
                                            </details>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
    <MobileTabBarSpacer />
    <Footer />
        </>
    );
};

export default FAQ;
