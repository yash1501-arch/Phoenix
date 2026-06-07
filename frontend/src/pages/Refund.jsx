import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

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
    <>
        <Seo title="Refund Policy" description="Clear, fair, traveller-first refund and reschedule policy." />
        <Navbar />
        <PageHero
            eyebrow="Fair, transparent"
            title="Refund Policy"
            subtitle="Traveller-first cancellation. We keep it simple."
            breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Refund Policy' }]}
        />
        <section className="bg-white py-20">
            <div className="container">
                <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[#D4AF37]/30 shadow-professional">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gradient-to-r from-black to-[#1a1a1a] text-white">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Days before departure</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Refund</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Mode</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.d} className="border-t border-gray-200 transition-colors hover:bg-[#FFFDF8]">
                                    <td className="px-6 py-4 font-semibold text-gray-900">{r.d}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF8E5] px-3 py-1 text-xs font-bold text-[#B8860B]">
                                            <r.icon size={14} /> {r.refund}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{r.mode}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mx-auto mt-14 max-w-3xl">
                    <h2 className="text-2xl font-extrabold text-gray-900">Frequently asked</h2>
                    <div className="mt-6 space-y-3">
                        {faqs.map((f) => (
                            <details key={f.q} className="group rounded-2xl border border-[#D4AF37]/30 bg-white p-5 shadow-professional transition-all open:shadow-professional-lg">
                                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
                                    {f.q}
                                    <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF8E5] text-[#B8860B] transition-transform group-open:rotate-45">+</span>
                                </summary>
                                <p className="mt-3 text-sm leading-relaxed text-gray-600">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    <MobileTabBarSpacer />
    <Footer />
    </>
);

export default Refund;
