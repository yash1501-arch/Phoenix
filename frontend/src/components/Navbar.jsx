import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Instagram, MessageCircle, ChevronRight, User, ShoppingCart, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isAuthenticated } = useAuth();
    const { cartItems } = useCart();
    const { count: wishlistCount } = useWishlist();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle scrolling to section when hash is present in URL
    useEffect(() => {
        if (location.hash) {
            const element = document.querySelector(location.hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [location]);

    const navLinks = [
        { name: 'Adventures', href: '/adventures' },
        { name: 'Gallery', href: '/gallery' },
        { name: 'Contact', href: '/contact' },
        { name: 'About', href: '/about' },
        { name: 'Blog', href: '/blog' },
    ];

    return (
        <motion.nav
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-2 md:py-3' : 'py-4 md:py-6'
                }`}
        >
            <div className="container">
                <div
                    className={`transition-all duration-500 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between rounded-2xl ${isScrolled
                        ? 'bg-white/80 backdrop-blur-lg shadow-professional border border-[#D4AF37]/30'
                        : 'bg-white/80 backdrop-blur-lg border border-[#D4AF37]/30'
                        }`}
                >
                    {/* Brand Name */}
                    <Link to="/" className="flex items-center group cursor-pointer shrink-0">
                        <div className="flex flex-col justify-center">
                            <span className="text-lg sm:text-xl md:text-2xl font-black tracking-widest text-black group-hover:text-[#D4AF37] transition-colors duration-300 uppercase leading-none">
                                Phoenix
                            </span>
                            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold tracking-[0.2em] sm:tracking-[0.25em] text-[#db6612] uppercase mt-0.5 sm:mt-1 leading-none">
                                Adventures
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.href}
                                className="relative px-4 py-2 text-sm font-semibold text-black hover:text-[#D4AF37] transition-colors duration-300 group"
                                onClick={(e) => {
                                    if (link.href.includes('#')) {
                                        e.preventDefault();
                                        const targetPath = link.href.split('#')[0];
                                        const targetHash = link.href.split('#')[1];

                                        if (targetPath === '') {
                                            // We're on the home page, just scroll
                                            const element = document.getElementById(targetHash);
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        } else {
                                            // Navigate to the path and then scroll
                                            navigate(targetPath);

                                            // Wait for navigation and then scroll
                                            setTimeout(() => {
                                                const element = document.getElementById(targetHash);
                                                if (element) {
                                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }, 100);
                                        }
                                    }
                                }}
                            >
                                {link.name}
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#D4AF37] group-hover:w-3/4 transition-all duration-300" />
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Link to="/wishlist" className="relative p-2 text-black hover:text-[#D4AF37] transition-colors" aria-label="Wishlist">
                            <Heart size={20} />
                            {wishlistCount > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="btn btn-outline text-sm px-6 py-2.5 flex items-center gap-2">
                                <User size={16} />
                                Dashboard
                            </Link>
                        ) : (
                            <Link to="/login" className="btn btn-outline text-sm px-6 py-2.5">
                                Login
                            </Link>
                        )}

                        <Link to="/cart" className="relative p-2 text-black hover:text-[#D4AF37] transition-colors ml-1">
                            <ShoppingCart size={22} />
                            {cartItems?.length > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                                    {cartItems.length}
                                </span>
                            )}
                        </Link>

                        <Link to="/adventures" className="btn btn-primary text-sm px-6 py-2.5">
                            Book Now <ChevronRight size={16} />
                        </Link>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center gap-3 lg:hidden">
                        <Link to="/wishlist" className="relative p-2 text-gray-800 hover:text-[#D4AF37] transition-colors" aria-label="Wishlist">
                            <Heart size={20} />
                            {wishlistCount > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>
                        <Link to="/cart" className="relative p-2 text-gray-800 hover:text-[#D4AF37] transition-colors">
                            <ShoppingCart size={22} />
                            {cartItems?.length > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                                    {cartItems.length}
                                </span>
                            )}
                        </Link>

                        <button
                            className="text-black p-2 hover:bg-[#F0E68C]/20 rounded-lg transition-colors border border-[#D4AF37]/30"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-[#D4AF37]/30 shadow-professional-lg overflow-hidden"
                    >
                        <div className="container py-6">
                            <div className="flex flex-col gap-2">
                                {navLinks.map((link, index) => (
                                    <Link
                                        key={link.name}
                                        to={link.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="text-base font-semibold text-black hover:text-[#D4AF37] hover:bg-[#F0E68C]/10 px-4 py-3 rounded-xl transition-all border border-[#D4AF37]/20 block"
                                        onClick={(e) => {
                                            if (link.href.includes('#')) {
                                                e.preventDefault();
                                                const targetPath = link.href.split('#')[0];
                                                const targetHash = link.href.split('#')[1];

                                                if (targetPath === '') {
                                                    // We're on the home page, just scroll
                                                    const element = document.getElementById(targetHash);
                                                    if (element) {
                                                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }
                                                } else {
                                                    // Navigate to the path and then scroll
                                                    navigate(targetPath);

                                                    // Wait for navigation and then scroll
                                                    setTimeout(() => {
                                                        const element = document.getElementById(targetHash);
                                                        if (element) {
                                                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }
                                                    }, 100);
                                                }
                                            }
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        {link.name}
                                    </Link>
                                ))}

                                <div className="flex gap-3 mt-6 px-4">
                                    <a
                                        href="https://www.instagram.com/phoenix_adventures__/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 p-3 glass-card rounded-xl hover:bg-gradient-to-r hover:from-[#D4AF37] hover:to-[#F0E68C] hover:text-white transition-all flex items-center justify-center border border-[#D4AF37]/30"
                                    >
                                        <Instagram size={20} />
                                    </a>
                                    <a
                                        href="#"
                                        className="flex-1 p-3 glass-card rounded-xl hover:bg-[#D4AF37] hover:text-white transition-all flex items-center justify-center border border-[#D4AF37]/30"
                                    >
                                        <MessageCircle size={20} />
                                    </a>
                                </div>

                                <Link 
                                    to="/adventures" 
                                    className="btn btn-primary w-full mt-4 mx-4 max-w-[calc(100%-2rem)]"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Book Now <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
