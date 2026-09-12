import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import { publicSettingsAPI } from '../utils/api';
import { BOOKING_CUTOFF_HOURS } from '../utils/bookingWindow';
import { StaggerContainer, StaggerItem } from '../components/ui/Motion';

const lastUpdated = '12 September 2026';

const DEFAULTS = {
  email: 'pheonixadventuress@gmail.com',
  phone: '+91 93725 06447',
  phoneSecondary: '+91 77580 79726',
  cancelDays: 14,
  holdMinutes: 15,
  upiId: '9372506447@sbi',
  payee: 'PHEONIX ADVENTURES LLP',
  advance: 1000,
};

const Terms = () => {
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
      });
    }).catch(() => {});
  }, []);

  const clauses = [
    {
      h: '1. Who we are',
      p: [
        `Phoenix Adventures (“we”, “us”) operates the public site at phoenixadventures.in for treks, camping, and tours. Staff tools live at admin.phoenixadventures.in. These Terms govern browsing, accounts, waitlists, and bookings.`,
        `UPI transfers are collected in the name shown on the payment screen (currently ${s.payee}). The consumer brand is Phoenix Adventures. Established 22 March 2023. Mumbai base: Kandivali West (full address on the Contact page).`,
      ],
    },
    {
      h: '2. Acceptance',
      p: 'By creating an account or completing a booking you agree to these Terms, the Privacy Policy, Refund Policy, and Safety Policy. If you do not agree, do not book. Guests may browse adventures without an account; booking, waitlist with an account email, dashboard, and UPI confirmation require login.',
    },
    {
      h: '3. Adventures: treks, camping, and tours',
      p: [
        'Each listing shows category, dates, start time (IST), difficulty, inclusions/exclusions, pickup points, and price in Indian rupees. What is on that page is the trip you are buying.',
        'Treks and camping: you pay the full trip amount by UPI at checkout (options, if any, are included in that total).',
        `Tours: you typically pay a per-person UPI advance now (site default ₹${Number(s.advance).toLocaleString('en-IN')}; a tour may override this). Remaining balance is due before departure via a second UPI. At booking you choose train class (Sleeper coach or 3AC, with 3AC usually carrying a per-person extra). Stay is group stay — three people share a room. Twin and private rooms are not offered unless a specific trip says otherwise.`,
      ],
    },
    {
      h: '4. Bookings, seat holds, cutoff, and waitlist',
      p: [
        `Bookings close about ${BOOKING_CUTOFF_HOURS} hours before the adventure’s listed start time on the chosen date, in India Standard Time. After that cutoff the Book button will not take new seats.`,
        `When you start checkout we hold seats for about ${s.holdMinutes} minutes (configurable). Complete UPI and submit screenshot + UTR before the timer ends or the hold expires and seats go back into the pool.`,
        'If a departure has no open dates or seats, you can join the waitlist. We notify you when dates or seats open — a waitlist spot is not a confirmed booking.',
        'You must give a working WhatsApp number, emergency contact, and participant details (name, phone, meal preference, pickup). Pickup must be one of the listed Mumbai/Pune points for that trip.',
      ],
    },
    {
      h: '5. Payments (UPI only — no card gateway)',
      p: [
        `We do not charge cards through Razorpay, Paytm Gateway, or similar. You pay by UPI to ${s.payee} (${s.upiId}), using the QR or UPI link on the payment page. Pay the exact amount shown (advance, full trip, or remaining balance).`,
        'Then upload your payment screenshot, UTR / UPI reference, payer name, and amount. An admin or payments clerk matches this against the bank statement. The booking is confirmed only after that verification — not when you hit Pay.',
        'Duplicate UTRs can be flagged. Do not reuse an old reference. If the hold expires after you already transferred money, write to us with the UTR so we can match it or refund.',
      ],
    },
    {
      h: '6. Cancellation by you',
      p: [
        `You can cancel from your dashboard while the booking is awaiting payment or still under review. Confirmed bookings can be self-cancelled only if at least ${s.cancelDays} days remain before the departure date (this window is set in site settings as cancellation_window_days).`,
        'Cancelling in the app releases seats. It does not instantly send money back. Verified UPI refunds are processed manually — see the Refund Policy. Inside the window, contact us; self-cancel is blocked and refunds are not guaranteed.',
      ],
    },
    {
      h: '7. Cancellation or change by Phoenix Adventures',
      p: 'We may cancel or change a departure for weather, safety, permits, transport disruption, or too few travellers. We will offer a move to another date or a refund of verified UPI amounts under the Refund Policy. We are not a licensed insurer; trip-cancellation insurance is only included if that adventure’s page says so.',
    },
    {
      h: '8. Your responsibilities',
      p: 'Disclose medical conditions that affect the trail. Carry valid government ID. Follow leader instructions and Leave No Trace. Harassment, violence, illegal substances, or damaging the trail can get you removed without refund. Adventure travel has inherent risk; you participate voluntarily.',
    },
    {
      h: '9. Platform, IP, and accounts',
      p: 'Route copy, photographs, logos, and software on phoenixadventures.in are ours or used with permission. Keep your password safe; sessions use httpOnly cookies. We may suspend accounts for fraud, abuse, or payment disputes. Admin/clerk access is only for authorised staff.',
    },
    {
      h: '10. Limitation of liability',
      p: 'To the extent allowed by Indian law, our liability for a booking is limited to the amounts you actually paid us for that booking and that we verified. We are not liable for delays or failures of Indian Railways, homestays, forests, or other third parties, or for losses from following (or not following) trail advice. Nothing here limits liability that cannot be limited by law (including proven fraud or death/personal injury caused by our negligence where the law requires).',
    },
    {
      h: '11. Governing law',
      p: 'These terms are governed by the laws of India. Courts in Mumbai, Maharashtra have exclusive jurisdiction, consistent with our Kandivali operations address.',
    },
    {
      h: '12. Contact',
      p: `Questions: ${s.email} · ${s.phone} · ${s.phoneSecondary}. Also see Contact, FAQ, and Refund Policy.`,
    },
  ];

  return (
    <div className="min-h-screen bg-mist">
      <Seo title="Terms of Service" description="Terms for booking Phoenix Adventures treks, camping, and tours via UPI on phoenixadventures.in." />
      <Navbar />
      <PageHero
        eyebrow="Legal"
        title="Terms of Service"
        subtitle="The agreement for using phoenixadventures.in and joining our trips — written for how we actually book and pay."
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Terms' }]}
      />
      <Section size="lg" tone="muted" variant="rise">
        <div className="mx-auto max-w-3xl rounded-lg border border-stone/10 bg-mist/30 p-8 md:p-10">
          <p className="kicker !text-ember mb-6">Last updated · {lastUpdated}</p>
          <p className="mb-8 text-[15px] leading-relaxed text-muted">
            Related:{' '}
            <Link to="/privacy" className="text-ember hover:underline">Privacy</Link>
            {' · '}
            <Link to="/refund" className="text-ember hover:underline">Refunds</Link>
            {' · '}
            <Link to="/safety" className="text-ember hover:underline">Safety</Link>
            {' · '}
            <Link to="/faq" className="text-ember hover:underline">FAQ</Link>
          </p>
          <StaggerContainer className="space-y-8 text-[15px] leading-relaxed text-muted">
            {clauses.map((c) => (
              <StaggerItem key={c.h}>
                <h2 className="font-display text-lg font-semibold text-stone">{c.h}</h2>
                {(Array.isArray(c.p) ? c.p : [c.p]).map((para) => (
                  <p key={para.slice(0, 48)} className="mt-2">{para}</p>
                ))}
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </Section>
      <Footer />
    </div>
  );
};

export default Terms;
