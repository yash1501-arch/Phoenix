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
import ThemeToggle from './ui/ThemeToggle';
import LanguageToggle from './ui/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

const dropdownItems = [
  { name: 'Treks And Adventures', href: '/treks', hint: 'Sahyadri fort day-hikes' },
  { name: 'Camping And Outdoor Fun', href: '/camping', hint: 'Overnight outdoors' },
];

const navLinks = [
  { name: 'Tours', href: '/tours' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

const linkClass = (active) =>
  `inline-flex items-center gap-1 px-3 py-2 text-[13px] font-semibold tracking-wide rounded-md transition-colors ${
    active ? 'text-ember' : 'text-stone/80 hover:text-ember hover:bg-stone/[0.04]'
  }`;

const iconBtn =
  'inline-flex items-center justify-center w-10 h-10 rounded-md text-stone/75 hover:text-ember hover:bg-stone/[0.05] transition-colors';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isAuthenticated, user } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { t } = useLanguage();
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
  const exploreItems = [
    { name: t.nav.treks, href: '/treks', hint: t.nav.treksHint },
    { name: t.nav.camping, href: '/camping', hint: t.nav.campingHint },
  ];
  const links = [
    { name: t.nav.tours, href: '/tours' },
    { name: t.nav.gallery, href: '/gallery' },
    { name: t.nav.about, href: '/about' },
    { name: t.nav.contact, href: '/contact' },
  ];

  return (
    <>
      <nav
        className="fixed top-0 inset-x-0 z-50 bg-mist/95 backdrop-blur-md border-b border-stone/10"
        aria-label="Primary"
      >
        <div className="container">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 md:h-[4.25rem]">
            {/* Left — logo */}
            <div className="justify-self-start shrink-0">
              <BrandLogo size={36} />
            </div>

            {/* Center — links */}
            <div className="hidden lg:flex items-center justify-center gap-0.5">
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onMouseEnter={() => setDropdownOpen(true)}
                  aria-expanded={dropdownOpen}
                  className={linkClass(isInDropdown)}
                >
                  {t.nav.explore}
                  <ChevronDown
                    size={14}
                    strokeWidth={2.25}
                    className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      onMouseLeave={() => setDropdownOpen(false)}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 bg-mist-subtle border border-stone/10 shadow-lift rounded-lg overflow-hidden"
                    >
                      {exploreItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex flex-col px-4 py-3 transition-colors ${
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

              {links.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`${linkClass(isActive(link.href))} relative`}
                >
                  {link.name}
                  {isActive(link.href) && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-1 left-3 right-3 h-0.5 bg-ember rounded-full"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Right — utilities + CTA (desktop) / menu (mobile) */}
            <div className="col-start-3 justify-self-end">
              <div className="hidden lg:flex items-center gap-1">
                <LanguageToggle />
                <ThemeToggle className="!p-0 w-10 h-10" />
                <Link to="/wishlist" className={`relative ${iconBtn}`} aria-label="Wishlist">
                  <Heart size={18} strokeWidth={2.25} className={wishlistCount > 0 ? 'fill-ember/20 text-ember' : ''} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-ember text-cream text-[9px] flex items-center justify-center font-bold leading-none">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <span className="mx-1.5 h-5 w-px bg-stone/15" aria-hidden />

                {isAuthenticated ? (
                  <AccountMenu />
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 h-10 px-3 text-[13px] font-semibold text-stone/80 hover:text-ember rounded-md hover:bg-stone/[0.04] transition-colors"
                  >
                    <LogIn size={15} strokeWidth={2.25} />
                    {t.nav.login}
                  </Link>
                )}

                <Link
                  to="/adventures"
                  className="ml-1.5 inline-flex items-center justify-center h-10 px-4 rounded-md bg-ember text-cream text-[13px] font-bold hover:bg-ember-bright transition-colors whitespace-nowrap"
                >
                  {t.nav.bookNow}
                </Link>
              </div>

              <div className="flex lg:hidden items-center gap-0.5">
                <LanguageToggle className="mr-1" />
                <ThemeToggle className="!p-0 w-10 h-10" />
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={iconBtn}
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                >
                  {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>
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
            <div className="absolute inset-0 bg-panel/70" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 right-0 w-full max-w-sm bg-panel flex flex-col"
            >
              <div className="flex items-center justify-between px-6 h-16 border-b border-cream/10">
                <span className="font-display text-lg text-cream font-semibold">{t.nav.menu}</span>
                <button type="button" onClick={() => setMenuOpen(false)} className="p-2 text-cream/70" aria-label="Close">
                  <X size={22} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-6 py-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cream/50 mb-2">{t.nav.explore}</p>
                <ul className="space-y-1 mb-4">
                  {exploreItems.map((link, i) => (
                    <motion.li
                      key={link.name}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                    >
                      <Link
                        to={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center justify-between py-3.5 font-display text-xl font-medium border-b border-cream/10 ${
                          isActive(link.href) ? 'text-ember' : 'text-cream'
                        }`}
                      >
                        <span>
                          {link.name}
                          {link.hint && <span className="block text-xs font-sans font-normal text-cream/50 mt-0.5">{link.hint}</span>}
                        </span>
                        <ChevronRight size={18} className="text-cream/35 shrink-0" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
                <ul className="space-y-1">
                  {links.map((link, i) => (
                    <motion.li
                      key={link.name}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.04 }}
                    >
                      <Link
                        to={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center justify-between py-4 font-display text-2xl font-medium border-b border-cream/10 ${
                          isActive(link.href) ? 'text-ember' : 'text-cream'
                        }`}
                      >
                        {link.name}
                        <ChevronRight size={18} className="text-cream/35" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-8 space-y-3">
                  <Link to="/adventures" onClick={() => setMenuOpen(false)} className="btn btn-primary w-full">
                    {t.nav.bookATrek}
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
                        <span className="text-[11px] font-normal opacity-70">{t.nav.myTrips}</span>
                      </span>
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="btn btn-outline w-full"
                    >
                      <LogIn size={16} />
                      {t.nav.signIn}
                    </Link>
                  )}
                </div>
              </nav>

              <div className="px-6 py-5 border-t border-cream/10 flex gap-3">
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
                    className="w-11 h-11 flex items-center justify-center border border-cream/15 text-cream/60 hover:text-ember hover:border-ember rounded-md transition-colors"
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
