import { useEffect, useState } from 'react';
import { Shield, Heart, AlertTriangle, Phone, MapPin, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import { publicSettingsAPI } from '../utils/api';
import { Reveal, StaggerContainer, StaggerItem, IconMotion, Pop } from '../components/ui/Motion';

const CONTACT_DEFAULTS = {
  phone: '+91 93725 06447',
  phoneSecondary: '+91 77580 79726',
  email: 'pheonixadventuress@gmail.com',
};

const sections = [
  {
    icon: Shield,
    title: 'Safety first, own pace',
    body:
      'Phoenix Adventures is built around Sahyadri fort treks, camping, and group tours with end-to-end logistics. Leaders introduce the group, ask about prior experience, and let you walk at your own pace — no pressure to rush difficult sections.',
  },
  {
    icon: Users,
    title: 'Leaders who know the trail',
    body:
      'Departures run with local guides and trip leaders. Before you start, you get the day’s plan, pickup notes, and (on tours) train class and stay sharing. Exact reporting time is shared on WhatsApp before departure.',
  },
  {
    icon: Heart,
    title: 'What we collect for your safety',
    body:
      'Every booking needs an emergency contact (10+ digits) plus each participant’s name, phone, meal preference, and pickup point. Bring a valid government ID on the trip. We use this to keep the group together and reach someone if needed — not for marketing.',
  },
  {
    icon: AlertTriangle,
    title: 'Weather, forests, and calling it off',
    body:
      'If a route is unsafe, we postpone or cancel rather than push on. You will hear from us by phone, WhatsApp, or email. Operator cancellations follow the Refund Policy: verified UPI amounts are returned manually, or we move you to another date.',
  },
  {
    icon: MapPin,
    title: 'Honest inclusions — check the trip page',
    body:
      'Permits, meals, stay, and gear vary by adventure. What is included or excluded is listed on each trip. We do not claim blanket travel insurance, satellite messengers, or Himalayan medical kits on every departure — if a trip includes extra kit, it will say so there.',
  },
  {
    icon: Phone,
    title: 'How to reach operations',
    body:
      'For live trip questions, call or WhatsApp the numbers on this page, or email us. Hours on the Contact page are typically 9:00 AM – 10:00 PM IST. If a loved one is on an active departure, start with the operations numbers — we will not invent a 24/7 satellite desk.',
  },
];

const Safety = () => {
  const [contact, setContact] = useState(CONTACT_DEFAULTS);

  useEffect(() => {
    publicSettingsAPI.getAll().then((all) => {
      setContact({
        phone: all.contact_phone || CONTACT_DEFAULTS.phone,
        phoneSecondary: all.contact_phone_secondary || CONTACT_DEFAULTS.phoneSecondary,
        email: all.contact_email || CONTACT_DEFAULTS.email,
      });
    }).catch(() => {});
  }, []);

  const telPrimary = contact.phone.replace(/\s/g, '');
  const telSecondary = contact.phoneSecondary.replace(/\s/g, '');

  return (
    <div className="min-h-screen bg-mist">
      <Seo
        title="Safety Policy"
        description="How Phoenix Adventures runs Sahyadri treks, camping, and tours — own pace, local leaders, and honest weather calls."
      />
      <Navbar />
      <PageHero
        eyebrow="Your safety is non-negotiable"
        title="Built for the wild. Honest about how we keep you safe."
        subtitle="Fort-led treks, camping, and tours with local leaders, your own pace, and a clear way to reach us if something changes."
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Safety Policy' }]}
      />
      <Section size="lg" tone="muted" variant="fade" reveal={false}>
        <StaggerContainer className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <StaggerItem key={s.title} as="article" className="rounded-lg border border-stone/8 bg-mist/40 p-6 h-full transition-shadow hover:shadow-card">
              <IconMotion className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-panel text-ember">
                <s.icon size={20} />
              </IconMotion>
              <h3 className="font-display text-lg font-semibold text-stone">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <Pop className="mx-auto mt-16 max-w-3xl">
          <div className="rounded-lg border border-ember/25 bg-panel p-8 md:p-10 text-center text-cream">
            <Reveal variant="fade">
              <h2 className="font-display text-2xl font-semibold !text-cream">Operations desk</h2>
              <p className="mt-2 text-sm text-cream/70">
                If someone you care about is on an active trip, call us. For bookings and refunds, email{' '}
                <a href={`mailto:${contact.email}`} className="text-ember underline-offset-2 hover:underline">
                  {contact.email}
                </a>
                .
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <a href={`tel:${telPrimary}`} className="btn btn-primary inline-flex">
                  <Phone size={16} /> {contact.phone}
                </a>
                <a href={`tel:${telSecondary}`} className="btn btn-outline inline-flex !text-cream !border-cream/30">
                  <Phone size={16} /> {contact.phoneSecondary}
                </a>
              </div>
            </Reveal>
          </div>
        </Pop>
      </Section>
      <Footer />
    </div>
  );
};

export default Safety;
