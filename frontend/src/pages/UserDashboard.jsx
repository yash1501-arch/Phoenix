import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import {
    Mail, Calendar, Award, LogOut, Phone,
    ChevronRight, Settings, Compass, LayoutDashboard,
    Heart, ArrowRight, MessageCircle, MapPin, IndianRupee, Clock, FileDown, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { publicSettingsAPI, getImageUrl, bookingsAPI } from '../utils/api';
import { canUserCancelBooking } from '../utils/bookingCancel';
import { motion } from 'framer-motion';
import UserAvatar from '../components/ui/UserAvatar';
import './UserDashboard.css';
import { IMG_FALLBACK } from '../data/indiaImages';

const UserDashboard = () => {
    const { user, logout, updateUserContext } = useAuth();
    const STATUS_BADGE = {
        pending_payment: { label: 'Pay Now', cls: 'bg-amber-100 text-amber-800' },
        payment_submitted: { label: 'Under Review', cls: 'bg-blue-100 text-blue-800' },
        confirmed: { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-800' },
        rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-800' },
        expired: { label: 'Expired', cls: 'bg-gray-100 text-gray-600' },
        cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600' },
    };
    const { items: wishlistItems, count: wishlistCount } = useWishlist();
    const [whatsappNumber, setWhatsappNumber] = useState('919372506447');
    const [bookings, setBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [cancellationWindowDays, setCancellationWindowDays] = useState(14);
    const [cancellingId, setCancellingId] = useState(null);
    const [pdfBusyId, setPdfBusyId] = useState(null);

    const handleDownloadItinerary = async (bookingId) => {
        setPdfBusyId(bookingId);
        try {
            const res = await bookingsAPI.downloadItinerary(bookingId);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Phoenix-Itinerary.pdf';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not download itinerary');
        } finally {
            setPdfBusyId(null);
        }
    };

    useEffect(() => {
        publicSettingsAPI.getAll().then((all) => {
            if (all.whatsapp) setWhatsappNumber(String(all.whatsapp).replace(/\D/g, '') || '919372506447');
            const days = parseInt(all.cancellation_window_days, 10);
            if (Number.isFinite(days) && days >= 0) setCancellationWindowDays(days);
        }).catch(() => {});
    }, []);

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Cancel this booking? Refunds follow our refund policy.')) return;
        setCancellingId(bookingId);
        try {
            await bookingsAPI.cancel(bookingId);
            toast.success('Booking cancelled');
            setBookings((prev) =>
                prev.map((b) => {
                    const id = b._id || b.id;
                    return id === bookingId ? { ...b, booking_status: 'cancelled' } : b;
                }),
            );
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not cancel booking');
        } finally {
            setCancellingId(null);
        }
    };

    useEffect(() => {
        let cancelled = false;
        if (!user?.id && !user?._id) {
            setBookings([]);
            setBookingsLoading(false);
            return undefined;
        }
        const userId = user.id || user._id;
        setBookingsLoading(true);
        bookingsAPI.getUserBookings(userId)
            .then((res) => {
                if (cancelled) return;
                const all = res.data?.data || [];
                const visible = all.filter((b) =>
                    ['confirmed', 'cancelled', 'pending_payment', 'payment_submitted', 'payment_failed'].includes(b.booking_status)
                );
                setBookings(visible);
            })
            .catch((err) => {
                if (!cancelled) {
                    setBookings([]);
                    toast.error(err.response?.data?.message || 'Could not load your bookings');
                }
            })
            .finally(() => {
                if (!cancelled) setBookingsLoading(false);
            });
        return () => { cancelled = true; };
    }, [user?.id, user?._id]);

    const confirmedCount = bookings.filter((b) => b.booking_status === 'confirmed').length;
    const actionCount = bookings.filter((b) =>
        ['pending_payment', 'payment_submitted', 'payment_failed'].includes(b.booking_status)
    ).length;

    const stats = [
        { label: 'My Trips', value: confirmedCount.toString(), icon: Award, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Action needed', value: actionCount.toString(), icon: Clock, color: 'bg-amber-50 text-amber-700' },
        { label: 'Wishlist', value: wishlistCount.toString(), icon: Heart, color: 'bg-pink-50 text-pink-600' },
        { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Jan 2026', icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    ];

    const quickActions = [
        {
            label: 'My Wishlist',
            count: wishlistCount,
            icon: Heart,
            to: '/wishlist',
            gradient: 'from-pink-500 via-rose-500 to-red-500',
        },
        {
            label: 'Contact Us',
            count: '',
            icon: MessageCircle,
            to: '#',
            gradient: 'from-green-500 via-emerald-500 to-teal-500',
            onClick: () => window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi! I want to know more about your adventures.')}`, '_blank'),
        },
    ];

    return (
        <div className="user-dashboard-wrapper">
            <Navbar />

            {/* Cinematic Hero */}
            <div className="dashboard-hero">
                <div className="container mx-auto px-4 dashboard-hero-content">
                    <div className="max-w-4xl pt-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-ember font-bold uppercase tracking-wider mb-4"
                        >
                            <LayoutDashboard size={18} />
                            <span>User Dashboard</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="welcome-text"
                        >
                            Welcome back, {user?.name?.split(' ')[0] || 'Adventurer'}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-300 text-lg max-w-xl"
                        >
                            Your adventure hub. Book trips via UPI and track verification here.
                        </motion.p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4">
                {/* Stats Grid (Floating) */}
                <div className="stats-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + (index * 0.1) }}
                            className="premium-stat-card flex items-center"
                        >
                            <div className={`stat-icon-wrapper ${stat.color}`}>
                                <stat.icon size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                    {quickActions.map((q, i) => (
                        <motion.div
                            key={q.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 + (i * 0.08) }}
                        >
                            {q.onClick ? (
                                <button
                                    onClick={q.onClick}
                                    className="group block w-full text-left relative overflow-hidden rounded-2xl p-5 bg-mist-subtle border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${q.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                                    <div className="relative flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${q.gradient} text-white flex items-center justify-center shadow-sm`}>
                                            <q.icon size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-500">{q.label}</p>
                                            <p className="text-2xl font-black text-gray-900">{q.count || '24/7'}</p>
                                        </div>
                                        <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-700 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>
                            ) : (
                                <Link
                                    to={q.to}
                                    className="group block relative overflow-hidden rounded-2xl p-5 bg-mist-subtle border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${q.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                                    <div className="relative flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${q.gradient} text-white flex items-center justify-center shadow-sm`}>
                                            <q.icon size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-500">{q.label}</p>
                                            <p className="text-2xl font-black text-gray-900">{q.count}</p>
                                        </div>
                                        <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-700 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            )}
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* My Bookings */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-gray-900">My Bookings</h2>
                                <Link to="/adventures" className="text-primary font-semibold hover:text-orange-600 transition-colors flex items-center gap-1">
                                    Book New <ChevronRight size={18} />
                                </Link>
                            </div>

                            {bookingsLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-10 h-10 border-4 border-[#c9a961] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : bookings.length > 0 ? (
                                <div className="space-y-4">
                                    {bookings.map((booking) => {
                                        const badge = STATUS_BADGE[booking.booking_status] || STATUS_BADGE.pending_payment;
                                        const adv = booking.adventure || {};
                                        const bookingId = booking._id || booking.id;
                                        return (
                                            <div key={bookingId} className="booking-card bg-mist-subtle rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                                    <img
                                                        src={getImageUrl(adv.image_url) || IMG_FALLBACK}
                                                        alt={adv.title}
                                                        className="w-full sm:w-20 h-20 rounded-xl object-cover"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-gray-900">{adv.title || 'Adventure'}</h3>
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-mono mb-2">{booking.booking_code}</p>
                                                        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                                            <span className="flex items-center gap-1"><Calendar size={12} /> {booking.adventure_date}</span>
                                                            {adv.location && (
                                                                <span className="flex items-center gap-1"><MapPin size={12} /> {adv.location}</span>
                                                            )}
                                                            <span className="flex items-center gap-1"><IndianRupee size={12} /> {Number(booking.amount || 0).toLocaleString('en-IN')}
                                                                {booking.payment_type === 'advance' ? ' advance' : ''}
                                                            </span>
                                                            {Number(booking.balance_due) > 0 && booking.booking_status === 'confirmed' && (
                                                                <span className="text-amber-700 font-semibold">Balance ₹{Number(booking.balance_due).toLocaleString('en-IN')}</span>
                                                            )}
                                                            {booking.number_of_seats > 0 && (
                                                                <span>{booking.number_of_seats} seat{booking.number_of_seats !== 1 ? 's' : ''}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {['pending_payment', 'payment_submitted', 'payment_failed'].includes(booking.booking_status) ? (
                                                        <Link
                                                            to={`/booking/${bookingId}/payment`}
                                                            className="shrink-0 px-4 py-2 bg-[#c9a961] text-white text-sm font-bold rounded-xl hover:bg-[#b8954f] transition"
                                                        >
                                                            {booking.booking_status === 'payment_submitted' ? 'Under Review' : 'Pay Now'}
                                                        </Link>
                                                    ) : booking.booking_status === 'confirmed' ? (
                                                        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                                                            {(adv._id || adv.id) && (
                                                                <Link
                                                                    to={`/adventure/${adv._id || adv.id}`}
                                                                    className="px-4 py-2 border border-stone/20 text-stone text-sm font-bold rounded-xl hover:bg-mist-subtle transition text-center"
                                                                >
                                                                    View trip
                                                                </Link>
                                                            )}
                                                            <button
                                                                type="button"
                                                                disabled={pdfBusyId === bookingId}
                                                                onClick={() => handleDownloadItinerary(bookingId)}
                                                                className="px-4 py-2 border border-stone/20 text-stone text-sm font-bold rounded-xl hover:bg-mist-subtle transition disabled:opacity-50 inline-flex items-center justify-center gap-1"
                                                            >
                                                                <FileDown size={14} />
                                                                {pdfBusyId === bookingId ? 'Preparing…' : 'Itinerary PDF'}
                                                            </button>
                                                            {Number(booking.balance_due) > 0 && booking.balance_status !== 'submitted' && (
                                                                <Link
                                                                    to={`/booking/${bookingId}/payment?kind=balance`}
                                                                    className="px-4 py-2 bg-[#c9a961] text-white text-sm font-bold rounded-xl hover:bg-[#b8954f] transition text-center"
                                                                >
                                                                    Pay remaining
                                                                </Link>
                                                            )}
                                                            {booking.balance_status === 'submitted' && (
                                                                <span className="px-4 py-2 text-sm font-bold text-blue-800 bg-blue-50 rounded-xl text-center">Balance under review</span>
                                                            )}
                                                            {new Date(`${booking.adventure_date}T00:00:00Z`) < new Date() && (adv._id || adv.id) && (
                                                                <Link
                                                                    to={`/adventure/${adv._id || adv.id}?booking=${bookingId}#reviews`}
                                                                    className="px-4 py-2 border border-ember/30 text-ember text-sm font-bold rounded-xl hover:bg-ember/5 transition text-center inline-flex items-center justify-center gap-1"
                                                                >
                                                                    <Star size={14} /> Review trip
                                                                </Link>
                                                            )}
                                                            {canUserCancelBooking(booking, cancellationWindowDays) && (
                                                                <button
                                                                    type="button"
                                                                    disabled={cancellingId === bookingId}
                                                                    onClick={() => handleCancelBooking(bookingId)}
                                                                    className="px-4 py-2 border border-red-200 text-red-700 text-sm font-bold rounded-xl hover:bg-red-50 transition disabled:opacity-50"
                                                                >
                                                                    {cancellingId === bookingId ? 'Cancelling…' : 'Cancel booking'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-mist-subtle rounded-3xl border border-dashed border-gray-300">
                                    <Compass size={32} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 mb-4">No bookings yet. Start your adventure!</p>
                                    <Link to="/adventures" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c9a961] text-white font-bold rounded-xl hover:bg-[#b8954f] transition">
                                        Browse Adventures <ArrowRight size={16} />
                                    </Link>
                                </div>
                            )}
                        </motion.section>

                        {/* WhatsApp Inquiry Section */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200">
                                        <MessageCircle size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900">Need Help?</h2>
                                        <p className="text-gray-600">Questions about your booking? Chat with us on WhatsApp anytime.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Link to="/adventures"
                                        className="flex items-center gap-3 p-4 bg-mist-subtle rounded-2xl border border-green-200 hover:shadow-md transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                            <Compass size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">Browse Adventures</p>
                                            <p className="text-xs text-gray-500">Find your next trip</p>
                                        </div>
                                        <ChevronRight size={18} className="ml-auto text-gray-300 group-hover:text-orange-600" />
                                    </Link>

                                    <button
                                        onClick={() => window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi! I want to know more about your adventures.')}`, '_blank')}
                                        className="flex items-center gap-3 p-4 bg-mist-subtle rounded-2xl border border-green-200 hover:shadow-md transition-all group text-left"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                                            <MessageCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">Chat on WhatsApp</p>
                                            <p className="text-xs text-gray-500">We reply within minutes</p>
                                        </div>
                                        <ChevronRight size={18} className="ml-auto text-gray-300 group-hover:text-green-600" />
                                    </button>
                                </div>
                            </div>
                        </motion.section>

                        {/* Wishlist Preview */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-gray-900">Your Wishlist</h2>
                                <Link to="/wishlist" className="text-primary font-semibold hover:text-orange-600 transition-colors flex items-center gap-1">
                                    View All <ChevronRight size={18} />
                                </Link>
                            </div>

                            {wishlistItems.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {wishlistItems.slice(0, 4).map((item) => {
                                        const adventure = item.adventure || {};
                                        const advId = adventure._id || item.adventure_id;
                                        return (
                                            <Link
                                                key={item._id || advId}
                                                to={`/adventure/${advId}`}
                                                className="flex items-center gap-3 p-3 bg-mist-subtle rounded-2xl border border-gray-100 hover:shadow-md transition-all group"
                                            >
                                                <img
                                                    src={getImageUrl(adventure.image_url) || IMG_FALLBACK}
                                                    alt={adventure.title || 'Adventure'}
                                                    className="w-14 h-14 rounded-xl object-cover"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">{adventure.title || 'Adventure'}</p>
                                                    <p className="text-xs text-gray-500">{adventure.location || ''}</p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-mist-subtle rounded-3xl border border-dashed border-gray-300">
                                    <Heart size={32} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Your wishlist is empty. Start exploring!</p>
                                </div>
                            )}
                        </motion.section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="profile-card"
                        >
                            <div className="flex justify-center mb-4">
                                <UserAvatar user={user} size="xl" ring />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-1">{user?.name || 'Explorer'}</h3>
                            <p className="text-primary font-medium text-sm mb-6 bg-orange-50 inline-block px-3 py-1 rounded-full">
                                Adventure Enthusiast
                            </p>

                            <div className="space-y-4 text-left">
                                <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl">
                                    <Mail size={18} className="text-gray-400" />
                                    <span className="text-gray-600 truncate">{user?.email}</span>
                                </div>
                                {user?.phone && (
                                    <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl">
                                        <Phone size={18} className="text-gray-400" />
                                        <span className="text-gray-600">{user.phone}</span>
                                    </div>
                                )}
                                <Link
                                    to="/profile"
                                    className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <Settings size={18} /> Edit Profile
                                </Link>
                                <button
                                    onClick={logout}
                                    className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogOut size={18} /> Sign Out
                                </button>
                            </div>
                        </motion.div>

                        {/* Quick Links */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-mist-subtle rounded-3xl p-6 border border-gray-100 shadow-sm"
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">Quick Navigation</h3>
                            <div className="space-y-2">
                                <Link to="/adventures" className="action-link">
                                    <div className="flex items-center gap-3">
                                        <Compass size={20} className="text-gray-400" />
                                        <span className="font-medium text-gray-700">Explore New</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </Link>
                                <Link to="/adventures" className="action-link">
                                    <div className="flex items-center gap-3">
                                        <LayoutDashboard size={20} className="text-gray-400" />
                                        <span className="font-medium text-gray-700">All Adventures</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </Link>
                                <button onClick={() => window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi! I need help with my account.')}`, '_blank')} className="action-link w-full text-left">
                                    <div className="flex items-center gap-3">
                                        <MessageCircle size={20} className="text-gray-400" />
                                        <span className="font-medium text-gray-700">Contact on WhatsApp</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        <Footer />
        </div>
    );
};

export default UserDashboard;
