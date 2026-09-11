import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import { Lock, Database, Share2, Eye, Mail } from 'lucide-react';
import { Reveal, StaggerContainer, StaggerItem, IconMotion } from '../components/ui/Motion';

const lastUpdated = '01 June 2026';

const blocks = [
  {
    icon: Database,
    h: 'What we collect',
    p: 'Account info (name, email, phone, Aadhaar/PAN for permits), booking history, and trip feedback. All bookings are processed and confirmed via WhatsApp.',
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
    p: 'pheonixadventuress@gmail.com — for any privacy-related query or grievance.',
  },
  {
    icon: Lock,
    h: 'Cookies & consent',
    p: 'We use local storage for your wishlist and session preferences. You can manage cookie preferences anytime from the banner that appears on your first visit. Under the DPDP Act 2023, consent can be withdrawn at any time.',
  },
  {
    icon: Database,
    h: 'Data retention',
    p: 'Account data is retained while your account is active plus 3 years for tax and audit purposes. Booking records are retained for 7 years. Anonymous analytics are retained for 26 months.',
  },
  {
    icon: Share2,
    h: 'Cross-border transfers',
    p: 'Primary data resides in India. Limited operational data (email delivery) may transit through third-party processors in other regions under their respective data-protection frameworks.',
  },
  {
    icon: Eye,
    // TODO: Confirm named Grievance Officer with client — do not invent staff
    h: 'Grievance officer',
    p: 'For grievances under the DPDP Act 2023, contact pheonixadventuress@gmail.com or +91 93725 06447. Response SLA: 30 days.',
  },
];

const Privacy = () => (
  <div className="min-h-screen bg-mist">
    <Seo title="Privacy Policy" description="How Phoenix Adventures collects, uses, and protects your data." />
    <Navbar />
    <PageHero
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="Your data, your control. Plain-language privacy practices."
      breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Privacy' }]}
    />
    <section className="bg-mist-subtle py-16 md:py-24">
      <div className="container">
        <StaggerContainer className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {blocks.map((b) => (
            <StaggerItem key={b.h} as="article" className="rounded-lg border border-stone/8 bg-mist/40 p-6 h-full">
              <IconMotion className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-panel text-ember">
                <b.icon size={20} />
              </IconMotion>
              <h3 className="font-display text-lg font-semibold text-stone">{b.h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.p}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
        <Reveal variant="fade" className="mx-auto mt-12 max-w-3xl text-center">
          <p className="kicker !text-muted">Last updated · {lastUpdated}</p>
        </Reveal>
      </div>
    </section>
        <Footer />
  </div>
);

export default Privacy;
