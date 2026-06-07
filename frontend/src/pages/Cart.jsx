import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Trash2, AlertCircle, ShoppingCart, Loader, PartyPopper, Calendar, Users, Briefcase } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { bookingsAPI, getImageUrl } from '../utils/api';
import { loadRazorpayScript, getRazorpayKeyId } from '../utils/razorpay';

const Cart = () => {
    const { user, isAuthenticated } = useAuth();
    const { cartItems, removeFromCart, clearCart, cartTotal } = useCart();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { returnUrl: '/cart' } });
            return;
        }

        if (cartItems.length === 0) return;

        setLoading(true);
        setError('');

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
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

            const results = [];
            for (const item of cartItems) {
                const bookingRes = await bookingsAPI.create({
                    user_id: user.id,
                    adventure_id: item.adventure._id,
                    booking_date: item.date,
                    participants: Number(item.participants),
                    total_amount: item.totalAmount,
                    advance_paid: item.amountToPay,
                    status: 'pending',
                    id_type: item.idType,
                    id_number: item.idNumber,
                });

                const bookingId = bookingRes.data?.data?.id;
                if (!bookingId) {
                    results.push({ title: item.adventure.title, status: 'failed', reason: 'Could not create booking' });
                    continue;
                }

                const orderRes = await fetch(`${baseUrl}/api/payments/create-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ bookingId }),
                });

                const order = await orderRes.json();
                if (!order.id) {
                    results.push({ title: item.adventure.title, status: 'failed', reason: order.message || 'Could not start payment' });
                    continue;
                }

                const paymentResult = await new Promise((resolve) => {
                    const rzp = new window.Razorpay({
                        key: razorpayKey,
                        amount: order.amount,
                        currency: order.currency || 'INR',
                        name: 'Phoenix Adventures',
                        description: item.adventure.title,
                        order_id: order.id,
                        prefill: { name: user.name, email: user.email },
                        theme: { color: '#D4AF37' },
                        handler: async (response) => {
                            try {
                                const verifyRes = await fetch(`${baseUrl}/api/payments/verify-payment`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
                                        bookingId,
                                    }),
                                });
                                const verifyData = await verifyRes.json();
                                if (verifyData.success) resolve({ status: 'paid' });
                                else resolve({ status: 'failed', reason: verifyData.message || 'Verification failed' });
                            } catch {
                                resolve({ status: 'failed', reason: 'Verification request failed' });
                            }
                        },
                        modal: {
                            ondismiss: () => resolve({ status: 'cancelled' }),
                        },
                    });
                    rzp.open();
                });

                if (paymentResult.status === 'paid') {
                    results.push({ title: item.adventure.title, status: 'paid' });
                } else {
                    results.push({ title: item.adventure.title, status: 'failed', reason: paymentResult.reason || 'Payment not completed' });
                }
            }

            const paidItems = results.filter((r) => r.status === 'paid');
            const failedItems = results.filter((r) => r.status !== 'paid');

            if (paidItems.length > 0) {
                clearCart();
            }

            if (failedItems.length === 0) {
                setSuccess(true);
                toast.success('All bookings confirmed!');
            } else if (paidItems.length > 0) {
                setSuccess(true);
                toast.success(`${paidItems.length} booking(s) confirmed. ${failedItems.length} failed.`);
            } else {
                setError(failedItems.map((f) => `${f.title}: ${f.reason || 'failed'}`).join('; '));
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Checkout failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 pt-24 text-center">
                <Navbar />
                <motion.div
                    className="bg-white rounded-3xl p-10 shadow-2xl max-w-md w-full"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <PartyPopper size={36} className="text-green-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">All Bookings Confirmed!</h2>
                    <p className="text-gray-500 mb-6">
                        Payment successful for all items. We've sent confirmation emails with all the details. See you on the adventure!
                    </p>
                    <Link to="/dashboard" className="block w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-bold text-center hover:shadow-lg transition-all">
                        View My Trips
                    </Link>
                </motion.div>
                <div className="flex-grow"></div>
    <MobileTabBarSpacer />
    <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            
            <main id="main-content" className="flex-grow w-full px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-6">
                        <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center shrink-0">
                            <ShoppingCart size={32} className="text-[#D4AF37]" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Your Cart</h1>
                    </div>

                    {error && (
                        <div className="mb-6 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-4 border border-red-100 shadow-sm">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    {!isAuthenticated && cartItems.length > 0 && (
                        <div className="mb-8 flex items-start gap-4 text-amber-800 bg-amber-50/50 rounded-2xl p-6 border border-amber-200/50 shadow-sm">
                            <AlertCircle size={24} className="shrink-0 mt-1" />
                            <div>
                                <p className="font-black text-lg mb-1">You are not logged in.</p>
                                <p className="text-sm font-medium opacity-80">Please <Link to="/login" className="underline font-bold hover:text-amber-900">login or register</Link> to checkout your adventures securely.</p>
                            </div>
                        </div>
                    )}

                    {cartItems.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-sm p-16 md:p-24 text-center border border-gray-100 max-w-3xl mx-auto">
                            <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Briefcase size={56} className="text-gray-300" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-3">Your Cart is Empty</h2>
                            <p className="text-gray-500 mb-10 text-lg max-w-lg mx-auto leading-relaxed">Looks like you haven't added any thrilling adventures to your cart yet. Let's find your next journey!</p>
                            <Link to="/adventures" className="inline-flex py-4 px-10 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-black hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all text-lg">
                                Explore Adventures
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                            {/* Items List */}
                            <div className="lg:col-span-8 space-y-6">
                                <AnimatePresence>
                                    {cartItems.map((item, index) => (
                                        <motion.div
                                            key={`${item.adventure._id}-${index}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-white rounded-3xl p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 relative group hover:shadow-md transition-shadow"
                                        >
                                            <div className="w-full sm:w-48 lg:w-56 h-56 sm:h-auto min-h-[160px] rounded-2xl overflow-hidden shrink-0 relative">
                                                <img 
                                                    src={getImageUrl(item.adventure.image_url)} 
                                                    alt={item.adventure.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            
                                            <div className="flex-grow flex flex-col justify-between py-1">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2 gap-4">
                                                        <h3 className="font-black text-xl md:text-2xl text-gray-900 leading-tight">{item.adventure.title}</h3>
                                                        <button 
                                                            onClick={() => removeFromCart(index)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 p-2.5 rounded-xl shrink-0"
                                                            title="Remove Item"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-gray-500 mt-4 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                                        <span className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-[#D4AF37]">
                                                                <Calendar size={14} />
                                                            </div>
                                                            {item.date}
                                                        </span>
                                                        <span className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-[#D4AF37]">
                                                                <Users size={14} />
                                                            </div>
                                                            {item.participants} Person{item.participants > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-6 pt-5 border-t border-gray-100 flex justify-between items-end">
                                                    <div>
                                                        <span className="text-xs uppercase font-black tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg border border-[#D4AF37]/20">
                                                            Full Payment
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">To Pay</p>
                                                        <p className="text-2xl md:text-3xl font-black text-gray-900">₹{item.amountToPay.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Cart Summary */}
                            <div className="lg:col-span-4">
                                <div className="bg-white rounded-3xl p-8 border-2 border-[#D4AF37]/20 shadow-xl sticky top-32">
                                    <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4">Order Summary</h3>
                                    
                                    <div className="space-y-5 mb-8">
                                        <div className="flex justify-between text-base text-gray-600 font-medium">
                                            <span>Subtotal ({cartItems.length} items)</span>
                                            <span className="font-bold text-gray-900">₹{cartTotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-base text-gray-600 font-medium">
                                            <span>Convenience Fee</span>
                                            <span className="text-green-600 font-black tracking-wide uppercase text-sm bg-green-50 px-2 py-0.5 rounded-md border border-green-100">Free</span>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-6 border-t-2 border-dashed border-gray-200 mb-8 flex flex-col gap-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-lg font-bold text-gray-900">Total</span>
                                            <span className="text-4xl font-black text-[#D4AF37]">₹{cartTotal.toLocaleString()}</span>
                                        </div>
                                        <p className="text-right text-xs text-gray-400 font-medium">Includes all taxes</p>
                                    </div>

                                    <button
                                        onClick={handleCheckout}
                                        disabled={loading || cartItems.length === 0}
                                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-black text-lg hover:shadow-2xl hover:shadow-[#D4AF37]/40 transition-all disabled:opacity-60 disabled:hover:shadow-none flex items-center justify-center gap-3 active:scale-[0.98]"
                                    >
                                        {loading ? <><Loader size={20} className="animate-spin" /> Processing order...</> : 'Secure Checkout'}
                                    </button>
                                    
                                    <div className="mt-5 text-center flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
                                        <Briefcase size={14} className="text-gray-300" /> Secure and encrypted checkout
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
    <MobileTabBarSpacer />
    <Footer />
        </div>
    );
};

export default Cart;
