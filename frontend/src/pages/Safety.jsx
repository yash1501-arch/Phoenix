import { Shield, Heart, AlertTriangle, Phone, MapPin, Wind } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import { Reveal, StaggerContainer, StaggerItem, IconMotion, Pop } from '../components/ui/Motion';

const sections = [
  {
    icon: Shield,
    title: 'Pre-Trip Briefings',
    body:
      'Every trek starts with a 45-minute safety brief covering route, weather, altitude, and emergency exits. No exceptions.',
  },
  {
    icon: AlertTriangle,
    title: 'Real-Time Risk Monitoring',
    body:
      'Our operations team monitors IMD weather alerts, forest department bulletins, and route telemetry 24/7 during active trips.',
  },
  {
    icon: Heart,
    title: 'Certified Wilderness First Responders',
    body:
      'Lead guides hold WFR or WFA certifications. Each group carries a fully-stocked medical kit, oxygen cylinder, and AED on Himalayan routes.',
  },
  {
    icon: Wind,
    title: 'Acclimatisation Protocol',
    body:
      'For treks above 3,000 m, we follow a slow ascent protocol (≤ 500 m sleeping elevation gain per day) and include a mandatory rest day.',
  },
  {
    icon: Phone,
    title: 'Always-On Communication',
    body:
      'Every trekker carries a satellite messenger (Garmin inReach) on remote routes. You can share live location with family at any time.',
  },
  {
    icon: MapPin,
    title: 'Insurance & Permits',
    body:
      'All trips include domestic travel insurance and forest/trekking permits. We do not operate in restricted zones without authorisation.',
  },
];

const Safety = () => (
  <div className="min-h-screen bg-mist">
    <Seo
      title="Safety Policy"
      description="How Phoenix Adventures keeps every trekker safe — from Sahyadri monsoon trails to Himalayan summits."
    />
    <Navbar />
    <PageHero
      eyebrow="Your safety is non-negotiable"
      title="Built for the Wild. Engineered for Safety."
      subtitle="Comprehensive protocols, certified guides, and real-time risk monitoring on every adventure we run."
      breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Safety Policy' }]}
    />
    <section className="bg-mist-subtle py-16 md:py-24">
      <div className="container">
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
              <h2 className="font-display text-2xl font-semibold !text-cream">24/7 Emergency Line</h2>
              <p className="mt-2 text-sm text-cream/70">
                If a loved one is on an active trek and you need real-time updates, call our operations desk.
              </p>
              <a href="tel:+919372506447" className="btn btn-primary mt-5 inline-flex">
                <Phone size={16} /> +91 93725 06447
              </a>
            </Reveal>
          </div>
        </Pop>
      </div>
    </section>
        <Footer />
  </div>
);

export default Safety;
