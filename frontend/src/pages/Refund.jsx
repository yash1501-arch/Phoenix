import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import { CheckCircle2, Clock, XCircle, ChevronDown } from 'lucide-react';
import { Reveal, StaggerContainer, StaggerItem, IconMotion } from '../components/ui/Motion';

const rows = [
  { d: '30+ days', refund: '90% refund', mode: 'Bank transfer / wallet credit', icon: CheckCircle2 },
  { d: '15 – 29 days', refund: '50% refund', mode: 'Bank transfer / wallet credit', icon: Clock },
  { d: '7 – 14 days', refund: '25% refund', mode: 'Wallet credit only', icon: Clock },
  { d: '< 7 days / No-show', refund: 'No refund', mode: '—', icon: XCircle },
];

const faqs = [
  {
    q: 'Are permits and forest entry fees refundable?',
    a: 'No. Forest/trek permits, national park fees, and third-party booking costs are non-refundable once issued, as they are paid to the relevant government authority.',
  },
  {
    q: 'How long do refunds take?',
    a: 'Refunds are processed within 5 business days. Bank transfer may take 3–7 working days depending on your bank.',
  },
  {
    q: 'What if Phoenix cancels the trip?',
    a: 'You get a 100% refund to the original payment method, or a 110% credit to your Phoenix wallet — your choice.',
  },
  {
    q: 'Can I reschedule instead of cancelling?',
    a: 'Yes, one free reschedule is allowed up to 14 days before departure, subject to availability.',
  },
];

const Refund = () => (
  <div className="min-h-screen bg-mist">
    <Seo title="Refund Policy" description="Clear, fair, traveller-first refund and reschedule policy." />
    <Navbar />
    <PageHero
      eyebrow="Fair, transparent"
      title="Refund Policy"
      subtitle="Traveller-first cancellation. We keep it simple."
      breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Refund Policy' }]}
    />
    <section className="bg-mist-subtle py-16 md:py-24">
      <div className="container">
        <Reveal variant="clip" className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-stone/10 shadow-smoke">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel text-cream">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Days before departure</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Refund</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Mode</th>
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
                  </td>
                  <td className="px-6 py-4 text-muted">{r.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <div className="mx-auto mt-14 max-w-3xl">
          <Reveal variant="slideLeft">
            <h2 className="font-display text-2xl font-semibold text-stone">Frequently asked</h2>
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
      </div>
    </section>
        <Footer />
  </div>
);

export default Refund;
