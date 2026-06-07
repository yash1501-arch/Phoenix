import React from 'react';
import { Users, Award, Globe, Shield, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import ScrollAnimation from '../components/ScrollAnimation';
import Section from '../components/ui/Section';
import FounderCard, { BusinessInstagramCTA, BusinessSocialButtons } from '../components/ui/FounderCard';
import { founders } from '../data/founders';
import { StaggerContainer, StaggerItem } from '../components/ui/Motion';

const About = () => {
  const stats = [
    { icon: Users, value: '15,000+', label: 'Happy Adventurers' },
    { icon: Award, value: '50+', label: 'Destinations' },
    { icon: Globe, value: '12+', label: 'Years Experience' },
    { icon: Shield, value: '4.9/5', label: 'Safety Rating' }
  ];

  const values = [
    {
      title: 'Sustainability',
      description: 'We prioritize eco-friendly practices and contribute to conservation efforts in every destination we visit.',
      color: 'from-green-400 to-green-600'
    },
    {
      title: 'Safety',
      description: 'We maintain the highest safety standards with comprehensive risk assessments and emergency protocols.',
      color: 'from-blue-400 to-blue-600'
    },
    {
      title: 'Excellence',
      description: 'Our commitment to quality ensures every adventure exceeds expectations with professional service.',
      color: 'from-purple-400 to-purple-600'
    },
    {
      title: 'Community',
      description: 'We believe in connecting people with nature and each other through transformative experiences.',
      color: 'from-orange-400 to-orange-600'
    }
  ];

  return (
    <div id="main-content" className="min-h-screen bg-gradient-to-b from-white to-[#F0E68C]/5">
      <Navbar />

      {/* Hero — top padding clears the fixed navbar; balanced bottom padding */}
      <section className="relative bg-black text-white pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero-bg.png"
            alt="About Background"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-black/80" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-transparent z-[1]"></div>
        <div className="relative z-10 container text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full mb-6">
            <Sparkles size={14} className="text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-xs font-bold tracking-wider uppercase">
              Our Story
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight">
            About <span className="text-[#D4AF37]">Phoenix Adventures</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Founded with a passion for exploration and deep respect for nature, we've been connecting adventurers with the world's most breathtaking destinations for over a decade.
          </p>
        </div>
      </section>

      {/* Business Instagram CTA strip */}
      <BusinessInstagramCTA />

      {/* Stats */}
      <Section size="md" tone="light">
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="text-center p-6 bg-white rounded-2xl shadow-professional border border-[#D4AF37]/20 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-full flex items-center justify-center text-white mx-auto mb-4">
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-black mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600 font-semibold">{stat.label}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* Mission */}
      <Section size="lg" tone="gold">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-black mb-5">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">Mission</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            To inspire people to step out of their comfort zones and discover the transformative power of adventure.
            We believe that every journey should be an opportunity for growth, connection, and wonder.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-black mb-5">Creating Unforgettable Experiences</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Since 2024, Phoenix Adventures has been crafting life-changing experiences for thrill-seekers and nature lovers alike.
              Our team of certified guides brings years of experience and local knowledge to every adventure.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We've helped thousands of adventurers discover their limits, overcome challenges, and connect with the natural world in profound ways.
            </p>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&h=400&q=80"
              alt="Team of adventurers"
              className="rounded-2xl shadow-professional w-full"
            />
          </div>
        </div>
      </Section>

      {/* Values */}
      <Section size="lg" tone="light" reveal={false}>
        <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-black mb-5">
            Our Core <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">Values</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-700">
            These principles guide everything we do and ensure we maintain the highest standards.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value) => (
            <div
              key={value.title}
              className="group bg-white rounded-2xl p-6 shadow-professional hover:shadow-professional-lg border border-[#D4AF37]/20 transition-all h-full hover:-translate-y-1"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${value.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">{value.title}</h3>
              <p className="text-gray-600 leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Founders */}
      <Section size="lg" tone="cream">
        <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-black mb-5">
            Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">Founders</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-700">
            The two people behind every Phoenix adventure — guiding, building, and living the journey.
          </p>
        </div>

        <StaggerContainer className="grid sm:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {founders.map((founder) => (
            <StaggerItem key={founder.name}>
              <FounderCard founder={founder} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      <MobileTabBarSpacer />
      <Footer />
    </div>
  );
};

export default About;