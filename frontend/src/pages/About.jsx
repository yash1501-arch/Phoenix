import React from 'react';
import { Users, Award, Mountain, Shield, HeartHandshake } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import FounderCard, { BusinessInstagramCTA } from '../components/ui/FounderCard';
import { founders } from '../data/founders';
import Seo from '../components/Seo';
import { Reveal, StaggerContainer, StaggerItem, IconMotion } from '../components/ui/Motion';
import { IMG_LOHAGAD } from '../data/indiaImages';

const About = () => {
  // Trust stats from CONTEXT.md — verbatim
  const stats = [
    { icon: HeartHandshake, value: '45+', label: 'Volunteers connected' },
    { icon: Mountain, value: '500+', label: 'Trips completed' },
    { icon: Users, value: '15,000+', label: 'Happy explorers' },
    { icon: Award, value: '50+', label: 'Local guides' },
    { icon: Shield, value: '4.9/5', label: 'Average rating' },
  ];

  const values = [
    {
      title: 'Safety first',
      description:
        'Every departure is planned with clear grading, local knowledge, and end-to-end logistics so you can walk at your own pace.',
    },
    {
      title: 'Fort & history-led',
      description:
        'We focus on Sahyadri range forts and Maharashtra outdoor destinations — Raigad, Rajgad, Torna, Sagargad, Hadsar, Pratapgad, Shivneri, and more.',
    },
    {
      title: 'Adventure tribe',
      description:
        'Discover the great outdoors with our adventure tribe — small groups, honest routes, and guides who know these trails.',
    },
    {
      title: 'Community',
      description:
        'We believe in connecting people with nature and each other through transformative experiences.',
    },
  ];

  const visibleFounders = founders.filter((f) => !f.placeholder);

  return (
    <div id="main-content" className="min-h-screen bg-mist">
      <Seo
        title="About Us"
        description="Phoenix Adventures — trekking & outdoor adventure focused on Sahyadri forts. Est. 22 March 2023."
      />
      <Navbar />

      <PageHero
        eyebrow="Our story"
        title="Built on the trail"
        subtitle="Phoenix Adventures was established on 22 March 2023. We connect adventurers with Sahyadri fort treks and Maharashtra outdoor destinations — safety-first, own pace, end-to-end logistics."
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'About' }]}
      />

      <BusinessInstagramCTA />

      <Section size="md" tone="mist" variant="fade">
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="text-center p-6 bg-mist-subtle rounded-lg border border-stone/8 h-full">
                <IconMotion className="w-12 h-12 bg-panel text-ember rounded-md flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6" />
                </IconMotion>
                <div className="font-display text-2xl sm:text-3xl font-semibold text-stone mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted font-medium">{stat.label}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      <Section size="lg" tone="white" variant="slideLeft">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="kicker mb-3">Mission</p>
          <h2 className="font-display text-display-lg text-stone font-semibold mb-5">
            Discover the great outdoors with our adventure tribe
          </h2>
          <p className="text-base sm:text-lg text-muted leading-relaxed">
            Trekking and outdoor adventure focused on the Sahyadri range — fort history, safety-first guiding, and logistics handled end to end.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
          <Reveal variant="rise">
            <h3 className="font-display text-xl sm:text-2xl font-semibold text-stone mb-4">
              Creating unforgettable experiences
            </h3>
            <p className="text-muted mb-4 leading-relaxed">
              Since 22 March 2023, Phoenix Adventures has been crafting trail experiences for thrill-seekers and
              nature lovers alike. Our local guides bring knowledge of Sahyadri forts and Maharashtra outdoors to every trip.
            </p>
            {/* TODO: Confirm Onkar Oak staff bio before adding to About/team — named in reviews only */}
            <p className="text-muted leading-relaxed">
              We&apos;ve helped thousands of adventurers discover their limits, overcome challenges, and connect with the
              natural world in profound ways.
            </p>
          </Reveal>
          <Reveal variant="clip">
            <img
              src={IMG_LOHAGAD(800)}
              alt="Team of adventurers on a ridge"
              className="rounded-lg w-full object-cover aspect-[4/3]"
            />
          </Reveal>
        </div>
      </Section>

      <Section size="lg" tone="mist" reveal={false}>
        <Reveal variant="fade" className="text-center max-w-3xl mx-auto mb-12 md:mb-14">
          <p className="kicker mb-3">Principles</p>
          <h2 className="font-display text-display-lg text-stone font-semibold mb-4">
            What we hold to
          </h2>
          <p className="text-muted">
            Four commitments that shape every departure we run.
          </p>
        </Reveal>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map((value) => (
            <StaggerItem key={value.title}>
              <div className="bg-mist-subtle rounded-lg p-6 border border-stone/8 h-full">
                <IconMotion className="w-10 h-10 bg-panel text-ember rounded-md flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5" />
                </IconMotion>
                <h3 className="font-display text-lg font-semibold text-stone mb-2">{value.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{value.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {visibleFounders.length > 0 && (
        <Section size="lg" tone="white" variant="slideRight">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="kicker mb-3">Team</p>
            <h2 className="font-display text-display-lg text-stone font-semibold mb-4">
              Meet our founders
            </h2>
            <p className="text-muted">
              The people behind every Phoenix adventure — guiding, building, and living the journey.
            </p>
          </div>

          <StaggerContainer className="grid sm:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {visibleFounders.map((founder) => (
              <StaggerItem key={founder.name}>
                <FounderCard founder={founder} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Section>
      )}

            <Footer />
    </div>
  );
};

export default About;
