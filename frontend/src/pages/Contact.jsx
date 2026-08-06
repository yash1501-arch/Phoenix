import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, MessageCircle, Clock, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/Seo';
import { contactAPI, publicSettingsAPI } from '../utils/api';
import { Reveal, StaggerContainer, StaggerItem, IconMotion } from '../components/ui/Motion';

// Source of truth: CONTEXT.md
const CONTACT_DEFAULTS = {
  email: 'pheonixadventuress@gmail.com',
  phone: '+91 93725 06447',
  phoneSecondary: '+91 77580 79726',
  address: 'Sindhudurg Building, 56/C8, Kandivali, Charkop, Sahyadri Nagar, Kandivali West, Mumbai, Maharashtra 400067, India',
  hours: 'Open daily, 9:00 AM – 10:00 PM',
  mapsUrl: 'https://maps.app.goo.gl/n5uUa7B6FQLKS5aZ6',
  placeId: 'ChIJBZcX2Oy35zsRXjj7MoK62as',
  lat: '19.2129911',
  lng: '72.8301628',
  whatsapp: '919372506447',
};

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General enquiry',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [info, setInfo] = useState(CONTACT_DEFAULTS);

  useEffect(() => {
    publicSettingsAPI.getAll().then((all) => {
      setInfo({
        email: all.contact_email || CONTACT_DEFAULTS.email,
        phone: all.contact_phone || CONTACT_DEFAULTS.phone,
        phoneSecondary: all.contact_phone_secondary || CONTACT_DEFAULTS.phoneSecondary,
        address: all.contact_address || CONTACT_DEFAULTS.address,
        hours: all.contact_hours || CONTACT_DEFAULTS.hours,
        mapsUrl: all.google_maps_url || all.maps_url || CONTACT_DEFAULTS.mapsUrl,
        placeId: all.google_place_id || CONTACT_DEFAULTS.placeId,
        lat: all.google_lat || CONTACT_DEFAULTS.lat,
        lng: all.google_lng || CONTACT_DEFAULTS.lng,
        whatsapp: String(all.whatsapp || CONTACT_DEFAULTS.whatsapp).replace(/\D/g, '') || CONTACT_DEFAULTS.whatsapp,
      });
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await contactAPI.submit(formData);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: 'General enquiry', message: '' });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Could not send your message right now. Please try WhatsApp instead.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      description: info.email,
      note: 'We reply within 24 hours on business days.',
      href: `mailto:${info.email}`,
    },
    {
      icon: Phone,
      title: 'Phone',
      description: `${info.phone} · ${info.phoneSecondary}`,
      note: info.hours,
      href: `tel:${info.phone.replace(/\s/g, '')}`,
    },
    {
      icon: MapPin,
      title: 'Office',
      description: info.address,
      note: 'View us on Google Maps.',
      href: info.mapsUrl,
    },
  ];

  // TODO: Switch to Places Embed API with place_id when VITE_GOOGLE_MAPS_EMBED_KEY is available.
  // place_id available: info.placeId (ChIJBZcX2Oy35zsRXjj7MoK62as)
  const coordsEmbedSrc = `https://maps.google.com/maps?q=${info.lat},${info.lng}&z=15&output=embed`;

  return (
    <div className="min-h-screen bg-mist">
      <Seo
        title="Contact Us"
        description="Questions about a trek, a private group departure, or custom itineraries? Talk to the Phoenix Adventures team."
      />
      <Navbar />
      <PageHero
        eyebrow="Get in touch"
        title="Talk to a real guide"
        subtitle="Every message is read by someone who has led these routes — not a call centre. Ask us anything about difficulty, gear, dates, or custom private departures."
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
      />

      <main id="main-content" className="container py-16 md:py-24">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          <Reveal variant="rise" className="lg:col-span-3">
            <h2 className="font-display text-display-lg text-stone font-semibold mb-2">
              Send us a message
            </h2>
            <p className="text-muted mb-8">
              Fields marked * are required. The more detail you share — dates, group size, experience level — the more
              specific our reply can be.
            </p>

            {submitSuccess ? (
              <div className="p-8 border border-ember/30 bg-ember/5 rounded-lg text-center">
                <IconMotion className="text-ember mx-auto mb-4 inline-flex">
                  <CheckCircle size={40} />
                </IconMotion>
                <h3 className="font-display text-2xl text-stone font-semibold mb-2">Message received</h3>
                <p className="text-muted mb-6">
                  Thanks for reaching out — we typically reply within 24 hours on business days. Need a faster answer?
                  We're on WhatsApp.
                </p>
                <a
                  href={`https://wa.me/${info.whatsapp}?text=${encodeURIComponent('Hi! I just sent a message through your contact form.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary inline-flex"
                >
                  <MessageCircle size={16} /> Continue on WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name">Full name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      className="input"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      className="input"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      className="input"
                      placeholder="+91 …"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject">Subject *</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="input"
                    >
                      <option>General enquiry</option>
                      <option>Booking a departure</option>
                      <option>Private / custom group</option>
                      <option>Gear & preparation</option>
                      <option>Safety & difficulty</option>
                      <option>Press & partnerships</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    minLength={10}
                    maxLength={5000}
                    className="input resize-y"
                    placeholder="Which trip are you interested in? When are you thinking of going? How many people, and any experience level we should know about?"
                  />
                </div>

                {submitError && (
                  <p
                    role="alert"
                    className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3"
                  >
                    {submitError}
                  </p>
                )}

                <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full md:w-auto">
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-mist border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Send message
                    </>
                  )}
                </button>
              </form>
            )}
          </Reveal>

          <aside className="lg:col-span-2 space-y-8">
            <Reveal variant="slideRight">
              <h2 className="font-display text-display-lg text-stone font-semibold mb-6">
                Other ways to reach us
              </h2>
              <StaggerContainer className="space-y-5">
                {contactMethods.map((m) => {
                  const Icon = m.icon;
                  const inner = (
                    <div className="flex items-start gap-4 p-5 border border-stone/10 rounded-lg hover:border-ember transition-colors bg-white">
                      <IconMotion className="w-11 h-11 bg-stone text-ember flex items-center justify-center shrink-0 rounded-md">
                        <Icon className="w-5 h-5" />
                      </IconMotion>
                      <div>
                        <h3 className="font-semibold text-stone">{m.title}</h3>
                        <p className="text-sm text-muted">{m.description}</p>
                        <p className="text-xs text-muted mt-1">{m.note}</p>
                      </div>
                    </div>
                  );
                  return (
                    <StaggerItem key={m.title}>
                      {m.href ? (
                        <a href={m.href} className="block" {...(m.title === 'Office' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                          {inner}
                        </a>
                      ) : (
                        inner
                      )}
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </Reveal>

            <Reveal variant="scale" delay={0.1}>
              <div className="border border-stone/10 rounded-lg p-6 bg-stone text-mist">
                <h3 className="font-display text-xl mb-3 !text-mist font-semibold">Fastest: WhatsApp</h3>
                <p className="text-sm text-mist/70 mb-5">
                  For date availability and last-minute seats, WhatsApp gets you an answer in minutes during office
                  hours.
                </p>
                <a
                  href={`https://wa.me/${info.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline w-full justify-center"
                >
                  <MessageCircle size={16} /> Chat now
                </a>
              </div>
            </Reveal>

            <Reveal variant="fade" delay={0.15}>
              <div className="border border-stone/10 rounded-lg p-6 bg-white">
                <h3 className="font-semibold text-stone mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-ember" /> Office hours
                </h3>
                <p className="text-sm text-muted">{info.hours}</p>
              </div>
            </Reveal>

            <Reveal variant="fade" delay={0.2}>
              <div className="border border-stone/10 rounded-lg overflow-hidden bg-white">
                <div className="p-4 flex items-center justify-between gap-3 border-b border-stone/8">
                  <h3 className="font-semibold text-stone text-sm">Find us</h3>
                  <a
                    href={info.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-ember hover:text-ember-deep transition-colors"
                  >
                    View on Maps <ExternalLink size={14} />
                  </a>
                </div>
                <iframe
                  title="Phoenix Adventures on Google Maps"
                  src={coordsEmbedSrc}
                  className="w-full h-52 border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </Reveal>
          </aside>
        </div>
      </main>
            <Footer />
    </div>
  );
};

export default Contact;
