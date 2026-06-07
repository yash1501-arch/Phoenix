import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import {
    User, Mail, Calendar, MapPin, Award, LogOut,
    ChevronRight, Clock, CreditCard, Settings, Compass, LayoutDashboard, Users,
    Heart, ShoppingCart, CalendarCheck, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import { bookingsAPI, usersAPI, getImageUrl } from '../utils/api';
import { motion } from 'framer-motion';
import './UserDashboard.css';

const UserDashboard = () => {
    const { user, logout, updateUserContext } = useAuth();
    const { items: wishlistItems, count: wishlistCount } = useWishlist();
    const { cartItems } = useCart();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchBookings();
        }
    }, [user]);

    const fetchBookings = async () => {
        try {
            const response = await bookingsAPI.getUserBookings(user.id);
            setBookings(response.data.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Derived State
    const upcomingTrips = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
    const pastTrips = bookings.filter(b => b.status === 'completed');

    // Calculate Stats
    const totalSpent = bookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

    const adventurePoints = Math.floor(totalSpent / 100);

    const stats = [
        { label: 'Total Trips', value: bookings.length.toString(), icon: Compass, color: 'bg-blue-50 text-blue-600' },
        { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: CreditCard, color: 'bg-green-50 text-green-600' },
        { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Jan 2026', icon: Calendar, color: 'bg-purple-50 text-purple-600' },
        { label: 'Adventure Points', value: adventurePoints.toString(), icon: Award, color: 'bg-orange-50 text-orange-600' },
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
            label: 'Cart',
            count: cartItems.length,
            icon: ShoppingCart,
            to: '/cart',
            gradient: 'from-amber-500 via-orange-500 to-yellow-500',
        },
        {
            label: 'My Bookings',
            count: bookings.length,
            icon: CalendarCheck,
            to: '/dashboard',
            gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
        },
    ];

    const avatarUrl = getImageUrl(user?.avatar_url);

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
                            className="flex items-center gap-2 text-orange-300 font-bold uppercase tracking-wider mb-4"
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
                            Your adventure portfolio. Track your bookings, manage payments, and discover your next journey.
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
                            <Link
                                to={q.to}
                                className="group block relative overflow-hidden rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
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
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* Upcoming Trips */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-gray-900">Upcoming Adventures</h2>
                                <Link to="/adventures" className="text-primary font-semibold hover:text-orange-600 transition-colors flex items-center gap-1">
                                    Browse New <ChevronRight size={18} />
                                </Link>
                            </div>

                            {loading ? (
                                <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-500">Loading your journey...</p>
                                </div>
                            ) : upcomingTrips.length > 0 ? (
                                <div className="space-y-6">
                                    {upcomingTrips.map((booking) => (
                                        <div key={booking._id || booking.id} className="booking-card flex flex-col sm:flex-row">
                                            <div className="w-full sm:w-48 h-48 sm:h-auto relative overflow-hidden">
                                                <img
                                                    src={getImageUrl(booking.adventures?.image_url) || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                                                    alt={booking.adventures?.title}
                                                    className="booking-image"
                                                />
                                                <div className="absolute top-2 left-2">
                                                    <span className={`status-badge ${booking.status}`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col justify-center">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">{booking.adventures?.title}</h3>

                                                <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={16} className="text-primary" />
                                                        {new Date(booking.booking_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={16} className="text-primary" />
                                                        {booking.adventures?.location}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users size={16} className="text-primary" />
                                                        {booking.participants} People
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={16} className="text-primary" />
                                                        {booking.adventures?.duration}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                                                    <span className="font-bold text-gray-900">
                                                        Total: ₹{booking.total_amount?.toLocaleString()}
                                                    </span>
                                                    <Link to="/dashboard" className="text-primary font-bold hover:text-orange-700 transition-colors text-sm uppercase tracking-wide">
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
                                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Compass size={32} className="text-primary" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">No upcoming trips</h3>
                                    <p className="text-gray-500 mb-6">Looks like you haven't booked your next adventure yet.</p>
                                    <Link to="/adventures" className="btn btn-primary px-8 py-3 rounded-xl shadow-lg shadow-orange-200">
                                        Find an Adventure
                                    </Link>
                                </div>
                            )}
                        </motion.section>

                        {/* Past Trips (Compact) */}
                        {pastTrips.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <h2 className="text-xl font-bold text-gray-900 mb-6 mt-4">Past Memories</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {pastTrips.map((booking) => (
                                        <div key={booking._id || booking.id} className="bg-white rounded-2xl p-4 border border-gray-200 hover:shadow-md transition-all flex gap-4 items-center">
                                            <img
                                                src={getImageUrl(booking.adventures?.image_url)}
                                                alt="Trip"
                                                className="w-16 h-16 rounded-xl object-cover"
                                            />
                                            <div>
                                                <h4 className="font-bold text-gray-900 line-clamp-1">{booking.adventures?.title}</h4>
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {new Date(booking.booking_date).toLocaleDateString()}
                                                </p>
                                                <div className="flex text-yellow-400 text-xs">★★★★★</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        )}
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
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={user?.name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-[#D4AF37] mx-auto mb-4"
                                />
                            ) : (
                                <div className="profile-avatar">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            <h3 className="text-xl font-black text-gray-900 mb-1">{user?.name || 'Explorer'}</h3>
                            <p className="text-primary font-medium text-sm mb-6 bg-orange-50 inline-block px-3 py-1 rounded-full">
                                {bookings.length <= 1 ? 'Novice Explorer' : bookings.length <= 5 ? 'Seasoned Adventurer' : 'Elite Traveler'}
                            </p>

                            <div className="space-y-4 text-left">
                                <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl">
                                    <Mail size={18} className="text-gray-400" />
                                    <span className="text-gray-600 truncate">{user?.email}</span>
                                </div>
                                {user?.phone && (
                                    <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl">
                                        <User size={18} className="text-gray-400" />
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
                            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
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
                                <Link to="/contact" className="action-link">
                                    <div className="flex items-center gap-3">
                                        <CreditCard size={20} className="text-gray-400" />
                                        <span className="font-medium text-gray-700">Contact & Support</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
    <MobileTabBarSpacer />
    <Footer />
        </div>
    );
};

export default UserDashboard;
