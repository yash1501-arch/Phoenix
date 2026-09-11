import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import { Reveal, StaggerContainer, StaggerItem } from '../components/ui/Motion';

const lastUpdated = '01 June 2026';

const clauses = [
  {
    h: '1. Acceptance of Terms',
    p: 'By accessing or booking through Phoenix Adventures, you agree to be bound by these Terms of Service. If you do not agree, you must not use the platform.',
  },
  {
    h: '2. Bookings & Payments',
    p: 'All bookings are processed through WhatsApp. Our team will contact you to confirm your reservation and assist with any payments. Prices are in INR and inclusive of GST.',
  },
  {
    h: '3. Cancellation by Traveller',
    p: 'Cancellations 30+ days before the trip: 90% refund. 15–29 days: 50% refund. 7–14 days: 25% refund. Less than 7 days or no-show: no refund. Reschedule is free up to 14 days prior (one-time).',
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
    p: 'For questions on these terms, write to pheonixadventuress@gmail.com.',
  },
];

const Terms = () => (
  <div className="min-h-screen bg-mist">
    <Seo title="Terms of Service" description="The terms governing your use of Phoenix Adventures services." />
    <Navbar />
    <PageHero
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="The agreement between Phoenix Adventures and every traveller who joins our trips."
      breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Terms' }]}
    />
    <section className="bg-mist-subtle py-16 md:py-24">
      <div className="container">
        <Reveal variant="rise" className="mx-auto max-w-3xl rounded-lg border border-stone/10 bg-mist/30 p-8 md:p-10">
          <p className="kicker !text-ember mb-6">Last updated · {lastUpdated}</p>
          <StaggerContainer className="space-y-8 text-[15px] leading-relaxed text-muted">
            {clauses.map((c) => (
              <StaggerItem key={c.h}>
                <h2 className="font-display text-lg font-semibold text-stone">{c.h}</h2>
                <p className="mt-2">{c.p}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Reveal>
      </div>
    </section>
        <Footer />
  </div>
);

export default Terms;
