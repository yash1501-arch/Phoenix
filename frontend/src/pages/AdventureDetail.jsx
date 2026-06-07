import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    MapPin, Clock, Users, Star, Shield, CheckCircle, XCircle, X,
    Calendar, ChevronDown, ChevronUp, ArrowLeft, Loader,
    PartyPopper, AlertCircle, Activity, Phone, Backpack, CreditCard, IdCard
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import { adventuresAPI, bookingsAPI, getImageUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import WishlistButton from '../components/ui/WishlistButton';
import Reviews from '../components/ui/Reviews';
import Lightbox from '../components/ui/Lightbox';
import WeatherWidget from '../components/ui/WeatherWidget';
import ShareButtons from '../components/ui/ShareButtons';
import { fireConfetti } from '../utils/confetti';
import { loadRazorpayScript, getRazorpayKeyId } from '../utils/razorpay';

// ── Booking Modal ────────────────────────────────────────────────────────────
const BookingModal = ({ adventure, onClose, onSuccess }) => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [date, setDate] = useState('');
    const [participants, setParticipants] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState('form'); // 'form' | 'paying'
    const [idType, setIdType] = useState('aadhaar');
    const [idNumber, setIdNumber] = useState('');

    const totalAmount = adventure.price * participants;

    const availableDates = (() => {
        const raw = typeof adventure.available_dates === 'string'
            ? JSON.parse(adventure.available_dates || '[]')
            : (adventure.available_dates || []);
        if (!Array.isArray(raw)) return [];
        return [...raw].sort();
    })();

    const formatDateForDisplay = (iso) => {
        if (!iso) return '';
        const [y, m, d] = iso.split('-').map(Number);
        if (!y || !m || !d) return iso;
        const dt = new Date(Date.UTC(y, m - 1, d));
        return dt.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC'
        });
    };

    const handleBook = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) { navigate('/login'); return; }
        if (!date) { setError('Please select a date.'); return; }
        if (!availableDates.includes(date)) { setError('Selected date is not available.'); return; }
        if (!idNumber.trim()) { setError('Please enter your ID number.'); return; }

        setLoading(true);
        setError('');

        try {
            // 1. Create booking in pending state
            const bookingRes = await bookingsAPI.create({
                user_id: user.id,
                adventure_id: adventure._id,
                booking_date: date,
                participants: Number(participants),
                total_amount: totalAmount,
                advance_paid: totalAmount,
                status: 'pending',
                id_type: idType,
                id_number: idNumber.trim(),
            });

            // Assuming Convex create mutation returns the generated ID
            const bookingId = bookingRes.data?.data?.id;

            // 2. Try to init Razorpay payment
            const orderRes = await bookingsAPI.createOrder({ bookingId });

            const order = orderRes.data;
            if (!order || !order.id) {
                setError(order?.message || 'Could not start payment. Please try again or contact support.');
                return;
            }

            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded || !window.Razorpay) {
                setError('Razorpay SDK failed to load. Please check your connection and try again.');
                return;
            }

            let razorpayKey;
            try {
                razorpayKey = getRazorpayKeyId();
            } catch (keyErr) {
                setError(keyErr.message);
                return;
            }

            setStep('paying');
            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: order.currency || 'INR',
                name: 'Phoenix Adventures',
                description: adventure.title,
                order_id: order.id,
                prefill: { name: user.name, email: user.email },
                theme: { color: '#D4AF37' },
                handler: async (response) => {
                    try {
                        const verifyRes = await bookingsAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId: bookingId
                        });
                        if (verifyRes.data?.success) {
                            setStep('form');
                            onSuccess();
                        } else {
                            setError(verifyRes.data?.message || 'Payment verification failed. Please contact support.');
                            setStep('form');
                        }
                    // eslint-disable-next-line no-unused-vars
                    } catch (err) {
                        setError('Payment verification failed. Please contact support.');
                        setStep('form');
                    }
                },
                modal: { ondismiss: () => { setStep('form'); setError('Payment was cancelled. Please try again to confirm your booking.'); } }
            };
            new window.Razorpay(options).open();
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <motion.div
                    className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto my-auto"
                    initial={{ y: 60, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 60, opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 400 }}
                >
                    <div className="bg-gradient-to-r from-black to-[#1a1a1a] p-6 text-white relative">
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>
                        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-1">Book Your Adventure</p>
                        <h3 className="text-xl font-black leading-tight">{adventure.title}</h3>
                        <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                            <MapPin size={13} /> {adventure.location}
                        </p>
                    </div>

                    <form onSubmit={handleBook} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                <Calendar size={14} className="inline mr-1 text-[#D4AF37]" />
                                Select Date
                            </label>
                            {availableDates.length === 0 ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                                    <div>
                                        <p className="font-bold">No upcoming dates</p>
                                        <p className="text-xs mt-0.5">This adventure has no scheduled dates yet. Please check back later.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                    {availableDates.map((iso) => {
                                        const isSelected = date === iso;
                                        return (
                                            <button
                                                key={iso}
                                                type="button"
                                                onClick={() => setDate(iso)}
                                                className={`text-left px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                                    isSelected
                                                        ? 'border-[#D4AF37] bg-[#D4AF37]/8 text-[#D4AF37] ring-2 ring-[#D4AF37]/20'
                                                        : 'border-gray-200 text-gray-700 hover:border-[#D4AF37]/40 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                        isSelected ? 'border-[#D4AF37]' : 'border-gray-300'
                                                    }`}>
                                                        {isSelected && <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />}
                                                    </div>
                                                    <Calendar size={12} className="shrink-0" />
                                                    <span className="truncate">{formatDateForDisplay(iso)}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                <Users size={14} className="inline mr-1 text-[#D4AF37]" />
                                Number of People
                            </label>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setParticipants(p => Math.max(1, p - 1))}
                                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-[#D4AF37] hover:text-white font-bold text-lg transition-all flex items-center justify-center">−</button>
                                <span className="text-2xl font-black text-gray-900 w-10 text-center">{participants}</span>
                                <button type="button" onClick={() => setParticipants(p => p + 1)}
                                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-[#D4AF37] hover:text-white font-bold text-lg transition-all flex items-center justify-center">+</button>
                            </div>
                        </div>

                        <div className="bg-[#D4AF37]/8 border border-[#D4AF37]/20 rounded-2xl p-4 flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Amount</p>
                                <p className="text-sm text-gray-600">₹{adventure.price?.toLocaleString()} × {participants}</p>
                            </div>
                            <span className="font-black text-[#D4AF37] text-lg">₹{totalAmount?.toLocaleString()}</span>
                        </div>

                        {/* ID Verification */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                            <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <IdCard size={16} className="text-[#D4AF37]" /> ID Verification (Required)
                            </p>
                            <p className="text-xs text-gray-500">For safety & security, a valid government ID is mandatory for all participants.</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'aadhaar', label: 'Aadhaar Card' },
                                    { value: 'pan', label: 'PAN Card' },
                                    { value: 'driving', label: 'Driving License' },
                                    { value: 'passport', label: 'Passport' },
                                ].map(opt => (
                                    <label key={opt.value}
                                        className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                                            idType === opt.value
                                                ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <input type="radio" name="idType" value={opt.value}
                                            checked={idType === opt.value}
                                            onChange={e => setIdType(e.target.value)}
                                            className="hidden"
                                        />
                                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                            idType === opt.value ? 'border-[#D4AF37]' : 'border-gray-300'
                                        }`}>
                                            {idType === opt.value && <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />}
                                        </div>
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder={idType === 'aadhaar' ? 'Enter 12-digit Aadhaar No.' : idType === 'pan' ? 'Enter PAN No. (e.g. ABCDE1234F)' : idType === 'driving' ? 'Enter Driving License No.' : 'Enter Passport No.'}
                                value={idNumber}
                                onChange={e => setIdNumber(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all"
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-3">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        {!isAuthenticated && (
                            <div className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3 flex items-start gap-2">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                You need to <Link to="/login" className="font-bold underline">login</Link> to complete booking.
                            </div>
                        )}

                        <div className="pt-2 border-t border-gray-100">
                            <button type="submit" disabled={loading || step === 'paying' || availableDates.length === 0}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-black hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base">
                                {loading ? <><Loader size={18} className="animate-spin" /> Booking...</> : <><CreditCard size={18} /> Book Now</>}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ── Success Screen ───────────────────────────────────────────────────────────
const BookingSuccess = ({ onClose }) => (
    <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
        <motion.div
            className="bg-white rounded-3xl p-10 shadow-2xl text-center max-w-sm w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <PartyPopper size={36} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-500 mb-6">Payment successful! Your adventure is confirmed. We've sent a confirmation email with all the details.</p>
            <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600 hover:border-gray-300 transition-all">
                    Stay Here
                </button>
                <Link to="/dashboard" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-bold flex items-center justify-center gap-1 hover:shadow-lg transition-all">
                    My Trips
                </Link>
            </div>
        </motion.div>
    </motion.div>
);

// ── Itinerary Accordion ──────────────────────────────────────────────────────
const ItineraryItem = ({ day }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-white font-black text-sm flex items-center justify-center shrink-0">
                        D{day.day}
                    </span>
                    <span className="font-bold text-gray-900">{day.title}</span>
                </div>
                {open ? <ChevronUp size={18} className="text-[#D4AF37] shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <p className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                            {day.description}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Main Page ────────────────────────────────────────────────────────────────
const AdventureDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [adventure, setAdventure] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBooking, setShowBooking] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await adventuresAPI.getById(id);
                setAdventure(res.data.data);
            } catch {
                navigate('/adventures');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!adventure) return null;

    const difficultyColor = {
        Easy: 'bg-emerald-100 text-emerald-700',
        Moderate: 'bg-amber-100 text-amber-700',
        Challenging: 'bg-red-100 text-red-700',
    }[adventure.difficulty] || 'bg-gray-100 text-gray-700';

    return (
        <div id="main-content" className="min-h-screen bg-white">
            <Navbar />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >

            {/* Hero Image */}
            <div className="relative h-[55vh] md:h-[70vh] overflow-hidden">
                <img
                    src={getImageUrl(adventure.image_url) || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400'}
                    alt={adventure.title}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setLightboxIndex(0)}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-24 left-6 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl font-semibold hover:bg-white/30 transition-all text-sm"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                {/* Wishlist heart */}
                <div className="absolute top-24 right-6">
                    <WishlistButton adventure={adventure} size="lg" />
                </div>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider ${difficultyColor}`}>
                                {adventure.difficulty}
                            </span>
                            <span className="px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-green-100 text-green-700">
                                {adventure.status}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-2 sm:mb-3 leading-tight">{adventure.title}</h1>
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-white/80 sm:text-white/90 text-xs sm:text-sm">
                            <span className="flex items-center gap-1.5"><MapPin size={13} className="text-[#D4AF37] shrink-0" />{adventure.location}</span>
                            <span className="flex items-center gap-1.5"><Clock size={13} className="text-[#D4AF37] shrink-0" />{adventure.duration}</span>
                            {adventure.rating && <span className="flex items-center gap-1.5"><Star size={13} className="text-[#D4AF37] fill-current" />{adventure.rating}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* LEFT: Details */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Description */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4">About This Adventure</h2>
                        <p className="text-gray-600 leading-relaxed text-base">{adventure.description}</p>
                    </section>

                    {/* Itinerary */}
                    {adventure.itinerary && adventure.itinerary.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-black text-gray-900 mb-4">Day-by-Day Itinerary</h2>
                            <div className="space-y-3">
                                {adventure.itinerary.map(day => <ItineraryItem key={day.day} day={day} />)}
                            </div>
                        </section>
                    )}

                    {/* Gallery section */}
                    {adventure.images && (typeof adventure.images === 'string' ? JSON.parse(adventure.images) : adventure.images).length > 0 && (
                        <section>
                            <h2 className="text-2xl font-black text-gray-900 mb-4">Experience Gallery</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                {(typeof adventure.images === 'string' ? JSON.parse(adventure.images) : adventure.images).map((imgUrl, idx) => (
                                    <div key={idx} className="relative aspect-square overflow-hidden rounded-2xl group border border-gray-100 shadow-sm cursor-zoom-in" onClick={() => setLightboxIndex(idx)}>
                                        <img
                                            src={getImageUrl(imgUrl)}
                                            alt={`${adventure.title} - Gallery ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Weather widget — for outdoor adventures */}
                    <section className="flex items-center gap-2">
                        <WeatherWidget preset={(adventure.title || '').toLowerCase().includes('hampta') ? 'hampta' : (adventure.title || '').toLowerCase().includes('rajmachi') ? 'rajmachi' : (adventure.title || '').toLowerCase().includes('sandhan') ? 'sandhanavalley' : 'kalsubai'} />
                    </section>

                    {/* Included / Excluded */}
                    {(adventure.included?.length > 0 || adventure.excluded?.length > 0) && (
                        <section>
                            <h2 className="text-2xl font-black text-gray-900 mb-4">What's Included</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {adventure.included?.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                                            <CheckCircle size={16} /> Included
                                        </h3>
                                        <ul className="space-y-2">
                                            {adventure.included.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {adventure.excluded?.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                                            <XCircle size={16} /> Not Included
                                        </h3>
                                        <ul className="space-y-2">
                                            {adventure.excluded.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                    {/* Reviews */}
                    <Reviews adventureId={adventure._id} />

                    {/* Things to Carry */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-2">
                            <Backpack className="text-[#D4AF37]" /> Things to Carry
                        </h2>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {[
                                    'Trekking shoes (mandatory)',
                                    '2–3 litres of water',
                                    'Cap / Sunglasses / Sunscreen',
                                    'Light backpack',
                                    'Energy snacks',
                                    'Rainwear (if required)'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-700 font-medium font-semibold">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Share */}
                    <section className="flex items-center gap-2">
                        <span className="text-sm text-zinc-500">Share this adventure:</span>
                        <ShareButtons url={`/adventure/${adventure._id || id}`} title={adventure.title} description={`Join us on ${adventure.title} — ${adventure.location || ''}`} />
                    </section>

                    {/* Safety Note */}
                    <section>
                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-start gap-4">
                            <Shield className="text-amber-600 mt-1 shrink-0" size={24} />
                            <div>
                                <h3 className="text-amber-900 font-bold mb-1">Safety Note</h3>
                                <p className="text-amber-700 text-sm leading-relaxed">
                                    Trekking and technical activities (like rappelling) involve sections that require teamwork and discipline. These are mandatory. Please follow the trek leader’s instructions at all times.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* RIGHT: Sticky Booking Card */}
                <div>
                    <div className="sticky top-24">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-3xl border-2 border-[#D4AF37]/30 shadow-xl overflow-hidden"
                        >
                            {/* Price Banner */}
                            <div className="bg-gradient-to-r from-black via-[#1a1a1a] to-black p-6 text-white text-center">
                                <p className="text-[#D4AF37] text-xs uppercase tracking-widest font-bold mb-1">Price Per Person</p>
                                <p className="text-4xl font-black text-white">₹{adventure.price?.toLocaleString()}</p>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Quick Info */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-1.5"><Clock size={14}/> Duration</span>
                                        <span className="font-bold text-gray-900">{adventure.duration}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-1.5"><Users size={14}/> Group Size</span>
                                        <span className="font-bold text-gray-900">Up to {adventure.max_participants || 'Flexible'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-1.5"><Shield size={14}/> Difficulty</span>
                                        <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${difficultyColor}`}>{adventure.difficulty}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-1.5"><Activity size={14}/> Endurance</span>
                                        <span className="font-bold text-gray-900">{adventure.endurance_level || 'Medium'}</span>
                                    </div>
                                </div>

                                {(() => {
                                    const raw = typeof adventure.available_dates === 'string'
                                        ? JSON.parse(adventure.available_dates || '[]')
                                        : (adventure.available_dates || []);
                                    const next = Array.isArray(raw) && raw.length > 0 ? raw[0] : null;
                                    if (!next) return (
                                        <p className="text-xs text-center text-amber-700 bg-amber-50 rounded-xl py-2 px-3 font-semibold border border-amber-100">
                                            No upcoming dates scheduled
                                        </p>
                                    );
                                    const [y, m, d] = next.split('-').map(Number);
                                    const dt = new Date(Date.UTC(y, m - 1, d));
                                    const formatted = dt.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' });
                                    const total = Array.isArray(raw) ? raw.length : 0;
                                    return (
                                        <p className="text-xs text-center text-emerald-700 bg-emerald-50 rounded-xl py-2 px-3 font-semibold border border-emerald-100">
                                            Next departure: {formatted}{total > 1 ? ` (+${total - 1} more dates)` : ''}
                                        </p>
                                    );
                                })()}

                                <button
                                    onClick={() => setShowBooking(true)}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-black text-lg hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Book Now
                                </button>
                                <p className="text-center text-xs text-gray-500 font-medium">Full payment required to confirm booking</p>

                                {/* Trust badges & Contact Info */}
                                <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs uppercase font-bold text-gray-400 mb-1">Organizer Info</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                        <span className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                            <img src="/vite.svg" className="w-3.5 h-3.5" alt="Phoenix Adventures" />
                                        </span>
                                        Phoenix Adventures
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                        <Phone size={14} className="text-[#D4AF37] shrink-0" />
                                        Manthan Sawant: <a href="tel:9372506447" className="font-bold text-gray-900 hover:text-[#D4AF37] transition-colors">9372506447</a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
            </motion.div>
    <MobileTabBarSpacer />
    <Footer />

            {/* Modals */}
            {showBooking && (
                <BookingModal
                    adventure={adventure}
                    onClose={() => setShowBooking(false)}
                    onSuccess={() => {
                        setShowBooking(false);
                        setShowSuccess(true);
                        toast.success('Booking confirmed!');
                        fireConfetti();
                    }}
                />
            )}
            {showSuccess && <BookingSuccess onClose={() => setShowSuccess(false)} />}

            {/* Lightbox */}
            {lightboxIndex !== null && (() => {
                const gallery = (typeof adventure.images === 'string' ? JSON.parse(adventure.images || '[]') : (adventure.images || []));
                const all = [getImageUrl(adventure.image_url), ...gallery.map(getImageUrl)].filter(Boolean);
                return (
                    <Lightbox
                        images={all}
                        index={lightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                        onPrev={() => setLightboxIndex((i) => (i - 1 + all.length) % all.length)}
                        onNext={() => setLightboxIndex((i) => (i + 1) % all.length)}
                    />
                );
            })()}
        </div>
    );
};

export default AdventureDetail;
