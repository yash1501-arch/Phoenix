import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, MapPin, Phone, Mail, ChevronUp, ArrowUp, Loader2, CheckCircle, MessageCircle } from 'lucide-react';
import { publicSettingsAPI, newsletterAPI } from '../utils/api';
import toast from 'react-hot-toast';
import BrandLogo from './BrandLogo';

const quick = [
  { label: 'Home', to: '/' },
  { label: 'Treks And Adventures', to: '/treks' },
  { label: 'Camping', to: '/camping' },
  { label: 'Tours', to: '/tours' },
  { label: 'Adventures', to: '/adventures' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const support = [
  { label: 'Safety Policy', to: '/safety' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Refund Policy', to: '/refund' },
  { label: 'FAQ', to: '/faq' },
];

const Footer = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('919372506447');
  const [socials, setSocials] = useState({
    instagram: 'https://www.instagram.com/phoenix_adventures__/',
    facebook: 'https://www.facebook.com/profile.php?id=61564975211438',
    youtube: 'https://www.youtube.com/@PhoenixAdventures-In',
    maps: 'https://maps.app.goo.gl/n5uUa7B6FQLKS5aZ6',
  });
  const [contact, setContact] = useState({
    email: 'pheonixadventuress@gmail.com',
    phone: '+91 93725 06447',
    phoneSecondary: '+91 77580 79726',
    address: 'Sindhudurg Building, 56/C8, Kandivali, Charkop, Sahyadri Nagar, Kandivali West, Mumbai, Maharashtra 400067, India',
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState('idle'); // idle | loading | done

  useEffect(() => {
    publicSettingsAPI.getAll().then((all) => {
      if (all.whatsapp) setWhatsappNumber(String(all.whatsapp).replace(/\D/g, '') || '919372506447');
      setSocials((prev) => ({
        instagram: all.instagram_url || prev.instagram,
        facebook: all.facebook_url || prev.facebook,
        youtube: all.youtube_url || prev.youtube,
        maps: all.google_maps_url || all.maps_url || prev.maps,
      }));
      setContact((prev) => ({
        email: all.contact_email || prev.email,
        phone: all.contact_phone || prev.phone,
        phoneSecondary: all.contact_phone_secondary || prev.phoneSecondary,
        address: all.contact_address || prev.address,
      }));
    }).catch(() => {});
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setNewsletterState('loading');
    try {
      await newsletterAPI.subscribe(email);
      setNewsletterState('done');
      toast.success("You're on the list — watch your inbox for stories from the trail.");
      setNewsletterEmail('');
    } catch {
      setNewsletterState('idle');
      toast.error('Could not subscribe right now. Please try again.');
    }
  };

  return (
  <footer className="bg-panel text-cream" style={{ borderTop: '1px solid rgba(241, 244, 242, 0.08)' }}>
    <div className="container pt-20 pb-24 md:pt-24 md:pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pb-12 md:pb-16 border-b border-cream/10">
        <div className="lg:col-span-5">
          <div className="mb-6">
            <BrandLogo size={40} inverted />
          </div>
          <p className="text-sm md:text-base text-cream/75 leading-relaxed max-w-md">
            Discover the great outdoors with our adventure tribe. Fort-led treks across the Sahyadris — safety-first, own pace, end-to-end logistics.
          </p>
        </div>

        <div className="lg:col-span-7">
          <p className="meta !text-cream/65 mb-3">Trail journal — monthly</p>
          <p className="font-display text-xl md:text-2xl text-cream leading-snug mb-6 font-medium">
            Field notes, route guides, and early-bird departures in your inbox.
          </p>
          {newsletterState === 'done' ? (
            <div className="flex items-center gap-2 px-4 py-3 border border-ember/40 bg-ember/10 text-sm text-ember rounded-md">
              <CheckCircle size={16} className="shrink-0" />
              <span>You're on the list. See you in the next dispatch.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-lg">
              <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
              <input
                id="footer-newsletter-email"
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="flex-1 px-4 py-3 bg-mist/10 border border-cream/25 text-sm text-cream placeholder:text-cream/45 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember/40 rounded-md transition"
              />
              <button
                type="submit"
                disabled={newsletterState === 'loading'}
                className="btn btn-primary shrink-0 !py-3 !px-6"
              >
                {newsletterState === 'loading' ? <Loader2 size={16} className="animate-spin" /> : 'Subscribe'}
              </button>
            </form>
          )}
          <p className="text-xs text-cream/45 mt-3">No spam. Unsubscribe anytime.</p>
        </div>
      </div>

      {/* Middle — link columns + contact */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-x-6 gap-y-12 py-12 md:py-16 border-b border-cream/10">
        <div className="col-span-2 md:col-span-1 lg:col-span-3">
          <h4 className="meta !text-cream/65 mb-5">Explore</h4>
          <ul className="space-y-3">
            {[
              { label: 'Treks And Adventures', to: '/treks' },
              { label: 'Camping', to: '/camping' },
              { label: 'Tours', to: '/tours' },
              { label: 'All adventures', to: '/adventures' },
              { label: 'Gallery', to: '/gallery' },
              { label: 'Trail journal', to: '/blog' },
            ].map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-sm text-cream/60 hover:text-ember transition">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1 lg:col-span-2">
          <h4 className="meta !text-cream/65 mb-5">Company</h4>
          <ul className="space-y-3">
            {[
              { label: 'About', to: '/about' },
              { label: 'Contact', to: '/contact' },
              { label: 'Wishlist', to: '/wishlist' },
            ].map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-sm text-cream/60 hover:text-ember transition">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1 lg:col-span-2">
          <h4 className="meta !text-cream/65 mb-5">Legal</h4>
          <ul className="space-y-3">
            {support.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-sm text-cream/60 hover:text-ember transition">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1 lg:col-span-5">
          <h4 className="meta !text-cream/65 mb-5">Contact</h4>
          <address className="not-italic space-y-3 text-sm text-cream/60">
            <p className="leading-relaxed">{contact.address}</p>
            <p>
              <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="hover:text-gold transition">{contact.phone}</a>
              <span className="mx-1.5 text-cream/30">·</span>
              <a href={`tel:${contact.phoneSecondary.replace(/\s/g, '')}`} className="hover:text-gold transition">{contact.phoneSecondary}</a>
            </p>
            <p>
              <a href={`mailto:${contact.email}`} className="hover:text-gold transition">{contact.email}</a>
            </p>
          </address>
          <div className="mt-6">
            <p className="meta !text-cream/55 mb-3">Follow</p>
            <div className="flex items-center gap-2">
              {[
                { icon: Instagram, href: socials.instagram, label: 'Instagram' },
                { icon: Facebook, href: socials.facebook, label: 'Facebook' },
                { icon: Youtube, href: socials.youtube, label: 'YouTube' },
                { icon: MessageCircle, href: `https://wa.me/${whatsappNumber}`, label: 'WhatsApp' },
                { icon: MapPin, href: socials.maps, label: 'Find us on Google Maps' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-11 h-11 border border-cream/15 flex items-center justify-center text-cream/60 hover:text-ember hover:border-ember rounded-md transition-colors"
                >
                  <s.icon size={17} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-cream/55">
        <p>&copy; {new Date().getFullYear()} Phoenix Adventures. All rights reserved.</p>
        <p>Sahyadris & Himalayas, India</p>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
