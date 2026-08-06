import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { X, Calendar, Users, Phone, IndianRupee } from 'lucide-react';
import { bookingsAPI, publicSettingsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const todayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const BookingModal = ({ adventure, onClose }) => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [holdMinutes, setHoldMinutes] = useState(15);

    useEffect(() => {
        publicSettingsAPI.getAll().then((all) => {
            const mins = parseInt(all.seat_hold_minutes, 10);
            if (Number.isFinite(mins) && mins > 0) setHoldMinutes(mins);
        }).catch(() => {});
    }, []);

    const tripPrice = Number(adventure.price) || 0;
    const dates = (() => {
        try {
            const raw = typeof adventure.available_dates === 'string'
                ? JSON.parse(adventure.available_dates || '[]')
                : (adventure.available_dates || []);
            return Array.isArray(raw) ? raw.filter(Boolean) : [];
        } catch {
            return [];
        }
    })();
    const hasPresetDates = dates.length > 0;

    const [form, setForm] = useState({
        adventure_date: dates[0] || todayISO(),
        number_of_seats: 1,
        customer_phone: user?.phone || '',
    });

    const totalAmount = tripPrice * form.number_of_seats;
    const maxSeats = adventure.max_participants || 10;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please log in to book');
            navigate('/login', { state: { from: `/adventure/${adventure._id}` } });
            return;
        }
        if (!form.adventure_date) {
            toast.error('Please select a departure date');
            return;
        }
        if (tripPrice <= 0) {
            toast.error('This adventure has no price set');
            return;
        }
        if (!form.customer_phone || String(form.customer_phone).replace(/\D/g, '').length < 10) {
            toast.error('WhatsApp number is required for booking confirmation');
            return;
        }
        setLoading(true);
        try {
            const res = await bookingsAPI.createManual({
                adventure_id: adventure._id || adventure.id,
                adventure_date: form.adventure_date,
                number_of_seats: form.number_of_seats,
                customer_phone: form.customer_phone.trim(),
            });
            const bookingId = res.data.data.id;
            toast.success('Seats held — complete UPI payment next');
            onClose();
            navigate(`/booking/${bookingId}/payment`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d) => {
        const [y, m, day] = d.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
        });
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-stone/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    className="bg-mist w-full max-w-md rounded-lg shadow-lift overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-stone text-mist px-6 py-5 flex items-start justify-between">
                        <div>
                            <p className="meta !text-mist/50 mb-1">Book Adventure</p>
                            <h2 className="font-display text-xl font-semibold">{adventure.title}</h2>
                        </div>
                        <button type="button" onClick={onClose} className="text-mist/60 hover:text-mist transition p-1" aria-label="Close">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="meta flex items-center gap-1.5 mb-2">
                                <Calendar size={14} /> Departure Date
                            </label>
                            {hasPresetDates ? (
                                <select
                                    required
                                    className="input w-full"
                                    value={form.adventure_date}
                                    onChange={(e) => setForm({ ...form, adventure_date: e.target.value })}
                                >
                                    {dates.map((d) => (
                                        <option key={d} value={d}>{formatDate(d)}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="date"
                                    required
                                    min={todayISO()}
                                    className="input w-full"
                                    value={form.adventure_date}
                                    onChange={(e) => setForm({ ...form, adventure_date: e.target.value })}
                                />
                            )}
                        </div>

                        <div>
                            <label className="meta flex items-center gap-1.5 mb-2">
                                <Users size={14} /> Number of People
                            </label>
                            <select
                                className="input w-full"
                                value={form.number_of_seats}
                                onChange={(e) => setForm({ ...form, number_of_seats: Number(e.target.value) })}
                            >
                                {Array.from({ length: Math.min(maxSeats, 20) }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="meta flex items-center gap-1.5 mb-2">
                                <Phone size={14} /> WhatsApp number
                            </label>
                            <input
                                type="tel"
                                required
                                className="input w-full"
                                placeholder="+91 98765 43210"
                                value={form.customer_phone}
                                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                            />
                            <p className="text-xs text-muted mt-1.5">
                                We’ll send your booking confirmation on WhatsApp.
                            </p>
                        </div>

                        <div className="bg-mist-subtle rounded-lg p-4 border border-stone/10">
                            <div className="flex justify-between text-sm text-muted mb-1">
                                <span>Price per person</span>
                                <span>₹{tripPrice.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted mb-2">
                                <span>× {form.number_of_seats} {form.number_of_seats === 1 ? 'person' : 'people'}</span>
                                <span />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-stone inline-flex items-center gap-1">
                                    <IndianRupee size={16} /> Total to pay
                                </span>
                                <span className="font-display text-2xl text-stone font-semibold">
                                    ₹{totalAmount.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <p className="text-xs text-muted mt-2">
                                Pay via UPI on the next screen. Seats held for {holdMinutes} minutes. No gateway fees.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !form.adventure_date || tripPrice <= 0}
                            className="btn btn-primary w-full"
                        >
                            {loading ? 'Creating booking…' : 'Proceed to Payment'}
                        </button>

                        {!isAuthenticated && (
                            <p className="text-xs text-center text-muted">
                                You&apos;ll need to{' '}
                                <button type="button" onClick={() => navigate('/login')} className="text-ember font-semibold underline">
                                    log in
                                </button>{' '}
                                to continue
                            </p>
                        )}
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BookingModal;
