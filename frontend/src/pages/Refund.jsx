import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import { CheckCircle2, Clock, XCircle, Banknote, ChevronDown } from 'lucide-react';
import { publicSettingsAPI } from '../utils/api';
import { Reveal, StaggerContainer, StaggerItem, IconMotion } from '../components/ui/Motion';

const lastUpdated = '12 September 2026';

const DEFAULTS = {
  email: 'pheonixadventuress@gmail.com',
  phone: '+91 93725 06447',
  cancelDays: 14,
  holdMinutes: 15,
  payee: 'PHEONIX ADVENTURES LLP',
};

const Refund = () => {
  const [s, setS] = useState(DEFAULTS);

  useEffect(() => {
    publicSettingsAPI.getAll().then((all) => {
      const days = parseInt(all.cancellation_window_days, 10);
      const hold = parseInt(all.seat_hold_minutes, 10);
      setS({
        email: all.contact_email || DEFAULTS.email,
        phone: all.contact_phone || DEFAULTS.phone,
        cancelDays: Number.isFinite(days) && days >= 0 ? days : DEFAULTS.cancelDays,
        holdMinutes: Number.isFinite(hold) && hold > 0 ? hold : DEFAULTS.holdMinutes,
        payee: all.upi_payee_name || DEFAULTS.payee,
      });
    }).catch(() => {});
  }, []);

  const rows = [
    {
      d: 'Awaiting UPI or still under review',
      refund: 'Cancel in dashboard anytime',
      mode: 'Seats released. If you already transferred UPI, we refund after matching the UTR — manually, not instantly.',
      icon: Clock,
    },
    {
      d: `Confirmed · ${s.cancelDays}+ days before departure`,
      refund: 'Self-cancel allowed',
      mode: `Dashboard cancel is open (cancellation window: ${s.cancelDays} days). Verified amounts go back by UPI/bank transfer after staff process it — not an automatic card refund.`,
      icon: CheckCircle2,
    },
    {
      d: `Confirmed · fewer than ${s.cancelDays} days`,
      refund: 'No self-cancel',
      mode: 'The app blocks cancel. Email or call us. Refunds inside this window are not guaranteed (train tickets, rooms, and permits may already be committed).',
      icon: XCircle,
    },
    {
      d: 'We cancel the trip',
      refund: 'Full verified UPI back, or a new date',
      mode: 'Your choice when we call off a departure for weather, safety, or operations. Unpaid tour balance is simply not collected.',
      icon: Banknote,
    },
  ];

  const faqs = [
    {
      q: 'Why isn’t the money instant?',
      a: `You pay ${s.payee} over UPI. There is no Razorpay/card capture to reverse. Staff (admin or clerk) confirm the credit on the bank statement, then send the refund on UPI to the account that paid. That usually takes several working days after we approve it — not 5 minutes.`,
    },
    {
      q: 'Treks vs tours — what gets refunded?',
      a: 'Treks and camping: the full amount we verified. Tours: the advance we verified, plus any later balance UPI we verified. If you only paid the advance, that is what we can return. Unpaid balance was never taken.',
    },
    {
      q: 'Seat hold expired — I still paid',
      a: `Holds last about ${s.holdMinutes} minutes. If the timer ran out, the booking may show expired even if UPI went through. Write to ${s.email} with booking code, UTR, and screenshot. We will match the bank and either confirm seats (if still available) or refund.`,
    },
    {
      q: 'Can I reschedule instead of cancelling?',
      a: 'Yes, if the new date has seats — ask on WhatsApp or email. There is no automatic “one free reschedule” button in the app. Date changes are done by the team.',
    },
    {
      q: 'No-show',
      a: 'If you miss pickup or the train without cancelling in time, unused services are generally not refunded.',
    },
  ];

  return (
    <div className="min-h-screen bg-mist">
      <Seo title="Refund Policy" description="Phoenix Adventures UPI refunds: cancellation window, manual bank matching, treks vs tour advance." />
      <Navbar />
      <PageHero
        eyebrow="Fair, transparent"
        title="Refund Policy"
        subtitle="Written for how we actually take money: UPI screenshot + UTR, human verification, manual return — not instant card reversals."
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Refund Policy' }]}
      />
      <Section size="lg" tone="muted" variant="fade" reveal={false}>
        <p className="mx-auto mb-8 max-w-3xl text-center text-sm leading-relaxed text-muted">
          Last updated {lastUpdated}. The cancellation window for confirmed bookings is currently{' '}
          <strong className="text-stone">{s.cancelDays} days</strong> before departure (site setting{' '}
          <code className="text-xs">cancellation_window_days</code>).{' '}
          <Link to="/terms" className="text-ember hover:underline">Terms</Link>
          {' · '}
          <Link to="/faq" className="text-ember hover:underline">FAQ</Link>
        </p>

        <Reveal variant="clip" className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-stone/10 shadow-smoke">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel text-cream">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">When</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">What you can do</th>
                <th className="hidden px-6 py-4 text-xs font-bold uppercase tracking-widest md:table-cell">How money moves</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.d} className="border-t border-stone/8 transition-colors hover:bg-mist/60">
                  <td className="px-6 py-4 font-semibold text-stone">{r.d}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 rounded-md bg-ember/10 px-3 py-1 text-xs font-bold text-ember-deep">
                      <r.icon size={14} /> {r.refund}
                    </span>
                    <p className="mt-2 text-xs leading-relaxed text-muted md:hidden">{r.mode}</p>
                  </td>
                  <td className="hidden px-6 py-4 text-muted md:table-cell">{r.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <div className="mx-auto mt-14 max-w-3xl">
          <Reveal variant="slideLeft">
            <h2 className="font-display text-2xl font-semibold text-stone">Details that matter</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Percentage ladders (90% / 50% / 25%) are not how this product works. The live rule is the cancellation window
              plus manual UPI. Forest permits and train tickets, once issued, may be non-refundable even when we try to help.
              Contact {s.email} or {s.phone} with your booking code and UTR.
            </p>
          </Reveal>
          <StaggerContainer className="mt-6 space-y-3">
            {faqs.map((f) => (
              <StaggerItem key={f.q}>
                <details className="group rounded-lg border border-stone/10 bg-mist/40 p-5 open:bg-mist-subtle open:shadow-smoke transition-all">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-stone">
                    {f.q}
                    <IconMotion className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-panel text-ember">
                      <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                    </IconMotion>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
                </details>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </Section>
      <Footer />
    </div>
  );
};

export default Refund;
