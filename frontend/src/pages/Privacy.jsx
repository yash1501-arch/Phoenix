import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import { Lock, Database, Share2, Eye, Mail, Cookie } from 'lucide-react';
import { publicSettingsAPI } from '../utils/api';
import { Reveal, StaggerContainer, StaggerItem, IconMotion } from '../components/ui/Motion';

const lastUpdated = '12 September 2026';

const CONTACT_DEFAULTS = {
  email: 'pheonixadventuress@gmail.com',
  phone: '+91 93725 06447',
};

const Privacy = () => {
  const [contact, setContact] = useState(CONTACT_DEFAULTS);

  useEffect(() => {
    publicSettingsAPI.getAll().then((all) => {
      setContact({
        email: all.contact_email || CONTACT_DEFAULTS.email,
        phone: all.contact_phone || CONTACT_DEFAULTS.phone,
      });
    }).catch(() => {});
  }, []);

  const blocks = [
    {
      icon: Database,
      h: 'What we collect',
      p: 'Account: name, email, password (stored hashed), optional avatar, and optional two-factor setup. Bookings: trip, date, seats, WhatsApp number, emergency contact, participant names/phones, meal preference, pickup point, and for tours train class (Sleeper or 3AC). Payments: UTR, payer name, optional payer UPI ID, amount, and a screenshot for staff to match the bank. Contact form and newsletter email if you send them. We do not collect Aadhaar or PAN on this site unless a future trip page explicitly asks for a permit.',
    },
    {
      icon: Share2,
      h: 'Why we use it (DPDP purpose)',
      p: 'To perform the booking contract: hold seats, verify UPI, confirm the trip, send itinerary PDFs, WhatsApp/email updates, and waitlist notices. To run the site (login cookies, CSRF protection, wishlist). With your “Accept all” cookie choice, to count anonymous page views for our own operations dashboard — not for ads. We do not sell personal data.',
    },
    {
      icon: Cookie,
      h: 'Cookies, storage, and analytics',
      p: 'Essential: httpOnly session cookie after login, CSRF cookie for form security, and local storage for wishlist plus your cookie choice (phoenix-cookie-consent). The first-visit banner lets you Accept all or Essential only. VisitTracker sends path + a random visitor id to our API only if you chose Accept all, and not if the browser Do Not Track flag is set. We do not run ad pixels or third-party ad cookies. Dismissing the banner is treated as essential only.',
    },
    {
      icon: Lock,
      h: 'How we protect it',
      p: 'HTTPS in transit, hashed passwords, role-based staff access (admin vs payments clerk vs member), and payment screenshots kept for verification — not shown as a public gallery. We do not claim a specific on-disk encryption standard we cannot verify. You are responsible for the security of your own UPI PIN and devices.',
    },
    {
      icon: Eye,
      h: 'Who sees it',
      p: 'You (dashboard). Phoenix Adventures staff who need it to verify payments and run trips. Processors who host the app, send email, and store images/screenshots. Indian Railways, homestays, or forest desks only when a booking actually requires it. We do not share lists with advertisers.',
    },
    {
      icon: Database,
      h: 'Where data lives',
      p: 'We operate for travellers in India (phoenixadventures.in). Hosting, email, and image tools may process data outside India. We use them only to run this product. If that is not acceptable, do not create an account.',
    },
    {
      icon: Eye,
      h: 'Your rights (DPDP Act, 2023)',
      p: 'As a Data Principal you may request access, correction, or erasure of personal data we hold, and you may withdraw consent for optional tracking (switch to essential-only cookies; we will not send VisitTracker hits). Some records we must keep for tax, dispute, or legal reasons (for example verified payments). We will respond through the contact below. We are not a “significant data fiduciary” filing and do not invent a named Grievance Officer beyond this mailbox until one is designated in writing.',
    },
    {
      icon: Mail,
      h: 'Grievance and contact',
      p: `${contact.email} · ${contact.phone}. Postal: Sindhudurg Building, 56/C8, Kandivali, Charkop, Sahyadri Nagar, Kandivali West, Mumbai, Maharashtra 400067, India. Aim: acknowledge promptly and resolve grievances within a reasonable period (we target 30 days). For trip emergencies use the Safety Policy numbers.`,
    },
  ];

  return (
    <div className="min-h-screen bg-mist">
      <Seo title="Privacy Policy" description="How Phoenix Adventures collects and uses booking, UPI, and cookie data under India’s DPDP Act." />
      <Navbar />
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="Plain language for accounts, UPI screenshots, cookies, and your rights under the Digital Personal Data Protection Act, 2023."
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Privacy' }]}
      />
      <Section size="lg" tone="muted" variant="fade" reveal={false}>
        <p className="mx-auto mb-10 max-w-3xl text-center text-sm leading-relaxed text-muted">
          Phoenix Adventures processes personal data to take you on the trail — not to run an ad network.{' '}
          <Link to="/terms" className="text-ember hover:underline">Terms of Service</Link>
          {' · '}
          <Link to="/refund" className="text-ember hover:underline">Refund Policy</Link>
        </p>
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
      </Section>
      <Footer />
    </div>
  );
};

export default Privacy;
