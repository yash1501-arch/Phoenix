import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';

const lastUpdated = '01 June 2026';

const clauses = [
    {
        h: '1. Acceptance of Terms',
        p: 'By accessing or booking through phoenixadventures.in, you agree to be bound by these Terms of Service. If you do not agree, you must not use the platform.',
    },
    {
        h: '2. Bookings & Payments',
        p: 'All bookings require full payment at the time of booking, processed securely via Razorpay. The booking is confirmed only after successful payment verification. Prices are in INR and inclusive of GST.',
    },
    {
        h: '3. Cancellation by Traveller',
        p: 'Cancellations 30+ days before the trip: 90% refund. 15–29 days: 50% refund. Less than 15 days: no refund. Reschedule is free up to 14 days prior (one-time).',
    },
    {
        h: '4. Cancellation by Operator',
        p: 'Phoenix Adventures reserves the right to cancel a trip due to weather, safety, or force majeure events. A full refund or full credit transfer will be offered.',
    },
    {
        h: '5. Traveller Responsibility',
        p: 'You are responsible for accurate disclosure of medical conditions, carrying valid government ID, and following guide instructions. The operator is not liable for injuries caused by non-compliance.',
    },
    {
        h: '6. Code of Conduct',
        p: 'Phoenix Adventures follows a zero-tolerance policy on harassment, substance abuse, and environmental damage (Leave No Trace). Violators are removed from the trip without refund.',
    },
    {
        h: '7. Intellectual Property',
        p: 'All content, including route descriptions, photographs, and brand assets, is the property of Phoenix Adventures and protected under the Indian Copyright Act, 1957.',
    },
    {
        h: '8. Limitation of Liability',
        p: "Adventure activities carry inherent risk. Phoenix Adventures' liability is limited to the trip cost paid. We are not liable for losses arising from third-party services (transport, lodging).",
    },
    {
        h: '9. Governing Law',
        p: 'These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Pune, Maharashtra.',
    },
    {
        h: '10. Contact',
        p: 'For questions on these terms, write to legal@phoenixadventures.in.',
    },
];

const Terms = () => (
    <>
        <Seo title="Terms of Service" description="The terms governing your use of Phoenix Adventures services." />
        <Navbar />
        <PageHero
            eyebrow="Legal"
            title="Terms of Service"
            subtitle="The agreement between Phoenix Adventures and every traveller who joins our trips."
            breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Terms' }]}
        />
        <section className="bg-white py-20">
            <div className="container">
                <div className="mx-auto max-w-3xl rounded-3xl border border-[#D4AF37]/30 bg-white p-8 shadow-professional">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Last updated · {lastUpdated}</p>
                    <div className="prose prose-slate mt-6 max-w-none space-y-6 text-[15px] leading-relaxed text-gray-700">
                        {clauses.map((c) => (
                            <div key={c.h}>
                                <h2 className="text-lg font-bold text-gray-900">{c.h}</h2>
                                <p className="mt-1.5">{c.p}</p>
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

export default Terms;
