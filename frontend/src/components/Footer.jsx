import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, MapPin, Phone, Mail, ChevronUp, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Footer = () => {
    const { theme, toggle } = useTheme();

    const quick = [
        { label: 'Home', to: '/' },
        { label: 'Adventures', to: '/adventures' },
        { label: 'Treks', to: '/treks' },
        { label: 'Camping', to: '/camping' },
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

    return (
        <footer className="relative overflow-hidden bg-gradient-to-br from-black via-[#0b0b0b] to-black pt-16 pb-8 text-white sm:pt-20 md:pt-24">
            <div aria-hidden className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
            <div className="container">
                <div className="grid grid-cols-1 gap-10 mb-12 sm:grid-cols-2 lg:grid-cols-4 md:gap-12 md:mb-16">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link to="/" className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F0E68C] font-bold text-white shadow-lg">
                                P
                            </div>
                            <span className="text-xl font-bold tracking-tight">
                                PHOENIX <span className="text-[#D4AF37]">ADVENTURES</span>
                            </span>
                        </Link>
                        <p className="mb-6 max-w-sm text-sm leading-relaxed text-gray-400">
                            The premier destination for adventure seekers in India. Join our community and experience the wild like never before.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="https://www.instagram.com/phoenix_adventures__/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-white/10 backdrop-blur-sm transition-all hover:bg-gradient-to-r hover:from-[#D4AF37] hover:to-[#F0E68C]"
                            >
                                <Instagram size={20} />
                            </a>
                            <a
                                href="https://wa.me/919999999999"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="WhatsApp"
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-white/10 backdrop-blur-sm transition-all hover:bg-[#D4AF37]"
                            >
                                <MessageCircle size={20} />
                            </a>
                            <a
                                href="https://maps.app.goo.gl/A3ZQYPCJWLCtgyB58"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Location"
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-white/10 backdrop-blur-sm transition-all hover:bg-[#D4AF37]"
                            >
                                <MapPin size={20} />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-6 text-lg font-bold text-white">Quick Links</h4>
                        <ul className="space-y-3">
                            {quick.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.to}
                                        className="inline-block text-sm text-gray-400 transition-all duration-300 hover:translate-x-1 hover:text-[#D4AF37]"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-6 text-lg font-bold text-white">Support</h4>
                        <ul className="space-y-3">
                            {support.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.to}
                                        className="inline-block text-sm text-gray-400 transition-all duration-300 hover:translate-x-1 hover:text-[#D4AF37]"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-6 text-lg font-bold text-white">Contact Us</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="mt-1 shrink-0 text-[#D4AF37]">
                                    <MapPin size={18} />
                                </div>
                                <div className="text-sm text-gray-400">
                                    Explore the Wild Office,
                                    <br />
                                    Near Sahyadri Range, MH
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1 shrink-0 text-[#D4AF37]">
                                    <Phone size={18} />
                                </div>
                                <a href="tel:+919876543210" className="text-sm text-gray-400 transition-colors hover:text-[#D4AF37]">
                                    +91 98765 43210
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1 shrink-0 text-[#D4AF37]">
                                    <Mail size={18} />
                                </div>
                                <a href="mailto:hello@phoenixadventures.in" className="text-sm text-gray-400 transition-colors hover:text-[#D4AF37]">
                                    hello@phoenixadventures.in
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
                    <p className="text-xs text-center text-gray-400 sm:text-left">
                        © 2026 Phoenix Adventures. All Rights Reserved. Built for the Wild.
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggle}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-white/10 backdrop-blur-sm transition-all hover:bg-[#D4AF37]"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            aria-label="Scroll to top"
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-white/10 backdrop-blur-sm transition-all hover:bg-[#D4AF37]"
                        >
                            <ChevronUp size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Spacer so the mobile tab bar doesn't overlap page content
export const MobileTabBarSpacer = () => <div className="md:hidden h-16" aria-hidden="true" />;

export default Footer;
