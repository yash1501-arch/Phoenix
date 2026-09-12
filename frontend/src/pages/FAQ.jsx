import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { faqPageJsonLd } from '../utils/seo';
import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import { publicSettingsAPI } from '../utils/api';
import { BOOKING_CUTOFF_HOURS } from '../utils/bookingWindow';
import { Reveal, StaggerContainer, StaggerItem } from '../components/ui/Motion';

const DEFAULTS = {
  email: 'pheonixadventuress@gmail.com',
  phone: '+91 93725 06447',
  phoneSecondary: '+91 77580 79726',
  cancelDays: 14,
  holdMinutes: 15,
  upiId: '9372506447@sbi',
  payee: 'PHEONIX ADVENTURES LLP',
  advance: 1000,
  instagram: 'https://www.instagram.com/phoenix_adventures__/',
};

const FAQ = () => {
  const [query, setQuery] = useState('');
  const [s, setS] = useState(DEFAULTS);

  useEffect(() => {
    publicSettingsAPI.getAll().then((all) => {
      const days = parseInt(all.cancellation_window_days, 10);
      const hold = parseInt(all.seat_hold_minutes, 10);
      const adv = parseFloat(all.advance_per_person);
      setS({
        email: all.contact_email || DEFAULTS.email,
        phone: all.contact_phone || DEFAULTS.phone,
        phoneSecondary: all.contact_phone_secondary || DEFAULTS.phoneSecondary,
        cancelDays: Number.isFinite(days) && days >= 0 ? days : DEFAULTS.cancelDays,
        holdMinutes: Number.isFinite(hold) && hold > 0 ? hold : DEFAULTS.holdMinutes,
        upiId: all.upi_id || DEFAULTS.upiId,
        payee: all.upi_payee_name || DEFAULTS.payee,
        advance: Number.isFinite(adv) && adv >= 0 ? adv : DEFAULTS.advance,
        instagram: all.instagram_url || all.instagram || DEFAULTS.instagram,
      });
    }).catch(() => {});
  }, []);

  const groups = [
    {
      title: 'Booking & payment',
      items: [
        {
          q: 'How do I book?',
          a: `Browse freely, then log in. Open the adventure, choose date and seats, add participant pickup/meals (and train class on tours). We hold seats for about ${s.holdMinutes} minutes. Pay the amount shown via UPI, then upload screenshot + UTR. An admin or clerk confirms after matching the bank — not a card gateway.`,
        },
        {
          q: 'What payment methods do you take?',
          a: `Direct UPI only, to ${s.payee} (${s.upiId}). Scan the merchant QR or open the UPI link. No Razorpay, Paytm Gateway, cards, or EMI checkout on this site.`,
        },
        {
          q: 'Trek / camping vs tour — what do I pay now?',
          a: `Treks and camping: full trip amount on UPI. Tours: usually a per-person advance now (default ₹${Number(s.advance).toLocaleString('en-IN')}; some tours set their own). Remaining tour balance is a second UPI before departure. You can pay a tour in full at checkout if that option is offered.`,
        },
        {
          q: 'When do bookings close?',
          a: `About ${BOOKING_CUTOFF_HOURS} hours before the trip’s start time (IST) on that date. The listing shows start time; the book flow shows the cutoff.`,
        },
        {
          q: 'What if the trip is full or has no dates?',
          a: 'Join the waitlist with your email. We notify you when seats or dates open. Waitlist is not a paid booking.',
        },
      ],
    },
    {
      title: 'Treks, camping & tours',
      items: [
        {
          q: 'What is included?',
          a: 'Whatever that adventure lists under included / excluded. Typical trek copy covers guide, trek meals, camping gear, permits, and first-aid — transport and stay depend on the page. Do not assume insurance or Himalayan medical kits unless written there.',
        },
        {
          q: 'How do tour trains and rooms work?',
          a: 'Each traveller picks Sleeper coach or 3AC (3AC usually adds a per-person extra). Stay is group stay — three people share a room. Twin/private is not the default product.',
        },
        {
          q: 'What should I pack? How fit do I need to be?',
          a: 'Use the packing list and difficulty (Easy / Moderate / Challenging) on the adventure. Common kit: trekking shoes, layers, rain shell, headlamp, personal medication, government ID.',
        },
        {
          q: 'Pickup and reporting time?',
          a: 'Choose a listed Mumbai or Pune pickup at booking. Exact reporting time is shared on WhatsApp before departure. Bring government ID.',
        },
      ],
    },
    {
      title: 'Cancellation, refunds & safety',
      items: [
        {
          q: 'How do I cancel?',
          a: `Dashboard → cancel, while payment is pending/under review, or when a confirmed trip is at least ${s.cancelDays} days out. Inside that window the button is blocked — email ${s.email} or call ${s.phone}. Full rules: Refund Policy.`,
        },
        {
          q: 'How do refunds actually arrive?',
          a: 'Manually, back through UPI/bank after we verify the original credit. Not an instant card reversal. Keep your UTR.',
        },
        {
          q: 'What if weather turns bad?',
          a: 'We may postpone or cancel rather than run an unsafe route. You get a new date or a refund of verified UPI (see Refund Policy).',
        },
        {
          q: 'Is every trip insured? Do you gift loyalty points?',
          a: 'Insurance only if that listing says so — we do not auto-attach a domestic policy to every seat. There is no Phoenix Circle points programme and no “gift this trip” checkout in the app today. Follow Instagram for stories from the trail.',
        },
      ],
    },
    {
      title: 'Account & contact',
      items: [
        {
          q: 'Do I need an account?',
          a: 'To book, pay, download itinerary PDFs, and manage cancellations — yes. Browsing adventures, gallery, and journal does not require login.',
        },
        {
          q: 'Cookies and tracking?',
          a: 'Login and wishlist need essential cookies/storage. Optional visit counts run only if you tap Accept all on the banner (and not if Do Not Track is on). Details: Privacy Policy.',
        },
        {
          q: 'How do I reach you?',
          a: `${s.email} · ${s.phone} · ${s.phoneSecondary}. Instagram: phoenix_adventures__. Site: www.phoenixadventures.in. Staff login: admin.phoenixadventures.in (not for travellers).`,
        },
      ],
    },
  ];

  const lower = query.toLowerCase();
  const filtered = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => i.q.toLowerCase().includes(lower) || i.a.toLowerCase().includes(lower)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-mist">
      <Seo
        title="FAQ"
        description="Booking, UPI, treks vs tours, cancellation window, and waitlist — Phoenix Adventures."
        jsonLd={faqPageJsonLd(groups)}
      />
      <Navbar />
      <PageHero
        eyebrow="Help center"
        title="Frequently Asked Questions"
        subtitle="How www.phoenixadventures.in actually books: UPI, holds, treks versus tours, and how to reach us."
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]}
      />
      <Section size="lg" tone="muted" variant="rise" reveal={false}>
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
          <p className="mt-4 text-center text-xs text-muted">
            <Link to="/refund" className="text-ember hover:underline">Refund Policy</Link>
            {' · '}
            <Link to="/terms" className="text-ember hover:underline">Terms</Link>
            {' · '}
            <Link to="/privacy" className="text-ember hover:underline">Privacy</Link>
            {' · '}
            <Link to="/safety" className="text-ember hover:underline">Safety</Link>
            {' · '}
            <a href={s.instagram} className="text-ember hover:underline" target="_blank" rel="noopener noreferrer">Instagram</a>
          </p>

          <div className="mt-10 space-y-12">
            {filtered.length === 0 && (
              <Reveal variant="fade">
                <p className="rounded-lg border border-dashed border-stone/20 p-10 text-center text-sm text-muted">
                  No results. Try another keyword or email {s.email}.
                </p>
              </Reveal>
            )}
            {filtered.map((g, gi) => (
              <Reveal key={g.title} variant={gi % 2 === 0 ? 'slideLeft' : 'slideRight'}>
                <h2 className="font-display text-lg font-semibold text-stone">{g.title}</h2>
                <StaggerContainer className="mt-4 space-y-3">
                  {g.items.map((item) => (
                    <StaggerItem key={item.q}>
                      <details className="group rounded-lg border border-stone/10 bg-mist/40 p-5 open:bg-mist-subtle open:shadow-smoke transition-all">
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
      </Section>
      <Footer />
    </div>
  );
};

export default FAQ;
