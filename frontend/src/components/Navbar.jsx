import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, ChevronRight, Heart, Instagram, Facebook, Youtube, MessageCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { publicSettingsAPI } from '../utils/api';
import { Link, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import AccountMenu from './ui/AccountMenu';
import UserAvatar, { firstName } from './ui/UserAvatar';
import { IconMotion } from './ui/Motion';

// Explore = short day trips; Tours sits beside Explore for longer multi-day journeys
const dropdownItems = [
  { name: '1-Day Trek', href: '/treks', hint: 'Sahyadri fort day-hikes' },
  { name: 'Camping', href: '/camping', hint: 'Overnight outdoors' },
];

const navLinks = [
  { name: 'Tours', href: '/tours' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isAuthenticated, user } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const [whatsappNumber, setWhatsappNumber] = useState('919372506447');
  const [socials, setSocials] = useState({
    instagram: 'https://www.instagram.com/phoenix_adventures__/',
    facebook: 'https://www.facebook.com/profile.php?id=61564975211438',
    youtube: 'https://www.youtube.com/@PhoenixAdventures-In',
  });
  const location = useLocation();

  useEffect(() => {
    publicSettingsAPI.getAll().then((all) => {
      if (all.whatsapp) setWhatsappNumber(String(all.whatsapp).replace(/\D/g, '') || '919372506447');
      setSocials((prev) => ({
        instagram: all.instagram_url || prev.instagram,
        facebook: all.facebook_url || prev.facebook,
        youtube: all.youtube_url || prev.youtube,
      }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isActive = (href) => location.pathname === href;
  const isInDropdown = dropdownItems.some((item) => isActive(item.href));

  return (
    <>
      <nav
        className="fixed top-0 inset-x-0 z-50 bg-mist shadow-smoke"
        style={{
          backgroundColor: '#faf7f1',
          borderBottom: '1px solid rgba(47,74,61,0.14)',
        }}
        aria-label="Primary"
      >
        <div className="container">
          <div className="flex items-center justify-between h-16 md:h-[4.5rem]">
            <BrandLogo size={40} />

            <div className="hidden lg:flex items-center gap-7">
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onMouseEnter={() => setDropdownOpen(true)}
                  aria-expanded={dropdownOpen}
                  className={`inline-flex items-center gap-1 text-sm font-semibold transition-colors ${
                    isInDropdown ? 'text-ember' : 'text-stone hover:text-ember'
                  }`}
                >
                  Explore
                  <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      onMouseLeave={() => setDropdownOpen(false)}
                      className="absolute top-full left-0 mt-3 w-56 bg-white border border-stone/10 shadow-lift rounded-md overflow-hidden"
                    >
                      {dropdownItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex flex-col px-4 py-3.5 transition-colors ${
                            isActive(item.href)
                              ? 'bg-ember/10 text-ember'
                              : 'text-stone/85 hover:bg-mist hover:text-stone'
                          }`}
                        >
                          <span className="text-sm font-semibold">{item.name}</span>
                          {item.hint && (
                            <span className={`text-[11px] mt-0.5 ${isActive(item.href) ? 'text-ember/70' : 'text-stone/45'}`}>
                              {item.hint}
                            </span>
                          )}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-sm font-semibold relative transition-colors ${
                    isActive(link.href) ? 'text-ember' : 'text-stone hover:text-ember'
                  }`}
                >
                  {link.name}
                  {isActive(link.href) && (
                    <motion.span layoutId="nav-underline" className="absolute -bottom-2 left-0 right-0 h-0.5 bg-ember rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Link
                to="/wishlist"
                className="relative p-2 text-stone/80 hover:text-ember transition-colors"
                aria-label="Wishlist"
              >
                <IconMotion hoverRotate={-6} hoverScale={1.12}>
                  <Heart size={18} className={wishlistCount > 0 ? 'fill-ember/15 text-ember' : ''} />
                </IconMotion>
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-ember text-white text-[10px] flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <AccountMenu />
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone hover:text-ember transition-colors"
                >
                  <IconMotion hoverRotate={0} hoverScale={1.1}>
                    <LogIn size={16} />
                  </IconMotion>
                  Login
                </Link>
              )}
              <Link to="/adventures" className="btn btn-primary !py-2.5 !px-5 !text-sm">
                Book now
              </Link>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2.5 text-stone hover:text-ember transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute inset-0 bg-stone/70" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 right-0 w-full max-w-sm bg-stone flex flex-col"
            >
              <div className="flex items-center justify-between px-6 h-16 border-b border-mist/10">
                <span className="font-display text-lg text-mist font-semibold">Menu</span>
                <button onClick={() => setMenuOpen(false)} className="p-2 text-mist/70" aria-label="Close">
                  <X size={22} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-6 py-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-mist/40 mb-2">Explore</p>
                <ul className="space-y-1 mb-4">
                  {dropdownItems.map((link, i) => (
                    <motion.li
                      key={link.name}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                    >
                      <Link
                        to={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center justify-between py-3.5 font-display text-xl font-medium border-b border-mist/10 ${
                          isActive(link.href) ? 'text-ember' : 'text-mist'
                        }`}
                      >
                        <span>
                          {link.name}
                          {link.hint && <span className="block text-xs font-sans font-normal text-mist/40 mt-0.5">{link.hint}</span>}
                        </span>
                        <ChevronRight size={18} className="text-mist/30 shrink-0" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
                <ul className="space-y-1">
                  {navLinks.map((link, i) => (
                    <motion.li
                      key={link.name}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.04 }}
                    >
                      <Link
                        to={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center justify-between py-4 font-display text-2xl font-medium border-b border-mist/10 ${
                          isActive(link.href) ? 'text-ember' : 'text-mist'
                        }`}
                      >
                        {link.name}
                        <ChevronRight size={18} className="text-mist/30" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-8 space-y-3">
                  <Link to="/adventures" onClick={() => setMenuOpen(false)} className="btn btn-primary w-full">
                    Book a trek
                  </Link>
                  {isAuthenticated ? (
                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="btn btn-outline w-full !justify-start gap-3"
                    >
                      <UserAvatar user={user} size="sm" ring={false} animated={false} />
                      <span className="flex flex-col items-start leading-tight">
                        <span className="text-sm font-semibold">{firstName(user?.name)}</span>
                        <span className="text-[11px] font-normal opacity-70">My trips & profile</span>
                      </span>
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="btn btn-outline w-full"
                    >
                      <LogIn size={16} />
                      Sign in
                    </Link>
                  )}
                </div>
              </nav>

              <div className="px-6 py-5 border-t border-mist/10 flex gap-3">
                {[
                  { href: socials.instagram, icon: Instagram, label: 'Instagram' },
                  { href: socials.facebook, icon: Facebook, label: 'Facebook' },
                  { href: socials.youtube, icon: Youtube, label: 'YouTube' },
                  { href: `https://wa.me/${whatsappNumber}`, icon: MessageCircle, label: 'WhatsApp' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-11 h-11 flex items-center justify-center border border-mist/15 text-mist/60 hover:text-ember hover:border-ember rounded-md transition-colors"
                  >
                    <s.icon size={17} />
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
