import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import { Reveal, StaggerContainer, StaggerItem } from '../components/ui/Motion';

const groups = [
  {
    title: 'Booking & Payment',
    items: [
      {
        q: 'How do I book an adventure?',
        a: 'Open an adventure, tap Book Now, choose date and number of people. Pay the total (price × seats) via UPI to our QR / UPI ID, then upload your screenshot and UTR. We confirm after matching the bank statement — no Razorpay or Paytm fees.',
      },
      {
        q: 'What payment methods are supported?',
        a: 'Direct UPI to PHEONIX ADVENTURES LLP (9372506447@sbi). Scan the QR or open your UPI app. After paying, submit screenshot + reference ID for manual verification.',
      },
      {
        q: 'Do you offer EMI or installment plans?',
        a: 'For multi-day expeditions above ₹15,000 we can split the payment into two or three installments — contact our team before booking and we\'ll work out a schedule.',
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
        a: 'Email pheonixadventuress@gmail.com or call +91 93725 06447. Our refund policy is outlined here.',
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
    <div className="min-h-screen bg-mist">
      <Seo title="FAQ" description="Frequently asked questions about Phoenix Adventures treks and bookings." />
      <Navbar />
      <PageHero
        eyebrow="Help center"
        title="Frequently Asked Questions"
        subtitle="Quick answers about bookings, safety, gear, and more."
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]}
      />
      <section className="bg-white py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <Reveal variant="rise">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the FAQ…"
                  aria-label="Search FAQ"
                  className="input w-full py-4 pl-11 pr-4"
                />
              </div>
            </Reveal>

            <div className="mt-10 space-y-12">
              {filtered.length === 0 && (
                <Reveal variant="fade">
                  <p className="rounded-lg border border-dashed border-stone/20 p-10 text-center text-sm text-muted">
                    No results. Try a different keyword or email pheonixadventuress@gmail.com.
                  </p>
                </Reveal>
              )}
              {filtered.map((g, gi) => (
                <Reveal key={g.title} variant={gi % 2 === 0 ? 'slideLeft' : 'slideRight'}>
                  <h2 className="font-display text-lg font-semibold text-stone">{g.title}</h2>
                  <StaggerContainer className="mt-4 space-y-3">
                    {g.items.map((item) => (
                      <StaggerItem key={item.q}>
                        <details className="group rounded-lg border border-stone/10 bg-mist/40 p-5 open:bg-white open:shadow-smoke transition-all">
                          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-stone">
                            {item.q}
                            <ChevronDown size={18} className="ml-4 shrink-0 text-ember transition-transform group-open:rotate-180" />
                          </summary>
                          <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
                        </details>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
            <Footer />
    </div>
  );
};

export default FAQ;
