import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Copy, Check, Upload, Clock, IndianRupee, QrCode, ExternalLink, ArrowLeft,
    X, ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { bookingsAPI, publicSettingsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { canUserCancelBooking } from '../utils/bookingCancel';
import {
    MERCHANT_PAYEE_NAME,
    MERCHANT_UPI_ID,
    UPI_QR_SRC,
    merchantUpiLink,
    verifyMerchantQr,
} from '../utils/merchantUpi';

/** Full-screen QR viewer with zoom — easier to scan from a desktop monitor */
const QrZoomModal = ({ src, payeeName = 'PHEONIX ADVENTURES LLP', onClose }) => {
    const [zoom, setZoom] = useState(1.4);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const dragStart = React.useRef(null);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
            if (e.key === '-') setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const clampZoom = (z) => Math.min(4, Math.max(1, +z.toFixed(2)));

    const onWheel = (e) => {
        e.preventDefault();
        setZoom((z) => clampZoom(z + (e.deltaY < 0 ? 0.15 : -0.15)));
    };

    const onPointerDown = (e) => {
        if (zoom <= 1) return;
        setDragging(true);
        dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (!dragging || !dragStart.current) return;
        setOffset({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y,
        });
    };

    const onPointerUp = () => {
        setDragging(false);
        dragStart.current = null;
    };

    const resetView = () => {
        setZoom(1.4);
        setOffset({ x: 0, y: 0 });
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-panel/90 backdrop-blur-sm flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-label="Zoom UPI QR code"
                onClick={onClose}
            >
                <div className="flex items-center justify-between px-4 py-3 text-cream shrink-0" onClick={(e) => e.stopPropagation()}>
                    <p className="text-sm font-semibold">Scan this QR — pinch/scroll or use + / −</p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="p-2 rounded-lg bg-mist/10 hover:bg-mist/20 transition"
                            aria-label="Zoom out"
                            onClick={() => setZoom((z) => clampZoom(z - 0.25))}
                        >
                            <ZoomOut size={18} />
                        </button>
                        <span className="text-xs w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                        <button
                            type="button"
                            className="p-2 rounded-lg bg-mist/10 hover:bg-mist/20 transition"
                            aria-label="Zoom in"
                            onClick={() => setZoom((z) => clampZoom(z + 0.25))}
                        >
                            <ZoomIn size={18} />
                        </button>
                        <button
                            type="button"
                            className="px-3 py-2 rounded-lg bg-mist/10 hover:bg-mist/20 text-xs font-semibold transition"
                            onClick={resetView}
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            className="p-2 rounded-lg bg-mist/10 hover:bg-mist/20 transition"
                            aria-label="Close"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div
                    className="flex-1 overflow-hidden flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                    onWheel={onWheel}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    <motion.img
                        src={src}
                        alt={`${payeeName} UPI QR — enlarge to scan`}
                        draggable={false}
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                            transformOrigin: 'center center',
                            maxHeight: 'min(85vh, 720px)',
                            maxWidth: 'min(92vw, 720px)',
                        }}
                        className="select-none rounded-xl bg-mist-subtle shadow-overlay object-contain"
                    />
                </div>

                <p className="text-center text-cream/70 text-xs pb-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                    Hold your phone camera up to the screen · Esc to close
                </p>
            </motion.div>
        </AnimatePresence>
    );
};

const BookingPayment = () => {
    const { bookingId } = useParams();
    const [searchParams] = useSearchParams();
    const payBalance = searchParams.get('kind') === 'balance';
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [qrOpen, setQrOpen] = useState(false);
    const [qrTrusted, setQrTrusted] = useState(null);
    const [data, setData] = useState(null);
    const [remaining, setRemaining] = useState(null);
    const [form, setForm] = useState({
        payer_name: '',
        upi_reference: '',
        amount_paid: '',
        payer_upi_id: '',
        screenshot: null,
    });
    const [preview, setPreview] = useState(null);
    const [cancellationWindowDays, setCancellationWindowDays] = useState(14);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        publicSettingsAPI.getAll().then((all) => {
            const days = parseInt(all.cancellation_window_days, 10);
            if (Number.isFinite(days) && days >= 0) setCancellationWindowDays(days);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        let alive = true;
        verifyMerchantQr(UPI_QR_SRC)
            .then((ok) => {
                if (alive) setQrTrusted(ok);
            })
            .catch(() => {
                if (alive) setQrTrusted(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const load = useCallback(async () => {
        try {
            const res = await bookingsAPI.getPaymentDetails(bookingId, payBalance ? { kind: 'balance' } : undefined);
            const payload = res.data.data;
            setData(payload);
            const due = payload.pay_balance
                ? payload.upi_amount ?? payload.booking?.balance_due
                : payload.booking?.amount;
            setForm((f) => ({
                ...f,
                payer_name: f.payer_name || payload.booking?.customer_name || user?.name || '',
                amount_paid: String(due ?? ''),
            }));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load payment details');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    }, [bookingId, navigate, user?.name, payBalance]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!data?.booking?.seat_hold_expires_at) return undefined;
        const tick = () => {
            const ms = new Date(data.booking.seat_hold_expires_at).getTime() - Date.now();
            setRemaining(Math.max(0, Math.floor(ms / 1000)));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [data?.booking?.seat_hold_expires_at]);

    const booking = data?.booking;
    const adventure = data?.adventure;
    const payment = data?.payment;
    const upi = data?.upi || {};
    const upiId = MERCHANT_UPI_ID;
    const payeeName = MERCHANT_PAYEE_NAME;
    const holdMinutes = upi.hold_minutes || 15;
    const upiAppLink = merchantUpiLink({
        amount: data?.pay_balance
            ? Number(data.upi_amount ?? data?.booking?.balance_due ?? 0)
            : Number(data?.booking?.amount || 0),
        note: data?.pay_balance
            ? `${data?.booking?.booking_code}-BAL`
            : (data?.booking?.booking_code || ''),
    });
    const status = booking?.booking_status;
    const payAmount = data?.pay_balance
        ? Number(data.upi_amount ?? booking?.balance_due ?? 0)
        : Number(booking?.amount || 0);
    const isTour = String(adventure?.category || '').toLowerCase() === 'tour';
    const alreadySubmitted = payBalance
        ? booking?.balance_status === 'submitted' || Number(booking?.balance_due || 0) <= 0
        : status === 'payment_submitted' || (status === 'confirmed' && !payBalance);
    const showCancel = !payBalance && canUserCancelBooking(booking, cancellationWindowDays);

    const handleCancelBooking = async () => {
        if (!window.confirm('Cancel this booking and release your seats?')) return;
        setCancelling(true);
        try {
            await bookingsAPI.cancel(bookingId);
            toast.success('Booking cancelled');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not cancel booking');
        } finally {
            setCancelling(false);
        }
    };

    const copyUpi = async () => {
        if (!upiId) {
            toast.error('UPI ID not available');
            return;
        }
        try {
            await navigator.clipboard.writeText(upiId);
            setCopied(true);
            toast.success('UPI ID copied');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Could not copy');
        }
    };

    const onFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Upload an image screenshot');
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            toast.error('Screenshot must be under 8MB');
            return;
        }
        setForm((f) => ({ ...f, screenshot: file }));
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.screenshot) {
            toast.error('Upload your payment screenshot');
            return;
        }
        if (!form.upi_reference.trim()) {
            toast.error('Enter UTR / UPI reference ID');
            return;
        }
        if (!form.payer_name.trim()) {
            toast.error('Enter the name used for payment');
            return;
        }
        setSubmitting(true);
        try {
            await bookingsAPI.submitPayment({
                booking_id: bookingId,
                upi_reference: form.upi_reference.trim(),
                payer_name: form.payer_name.trim(),
                payer_upi_id: form.payer_upi_id.trim() || undefined,
                amount_paid: form.amount_paid,
                payment_kind: payBalance ? 'balance' : undefined,
                screenshot: form.screenshot,
            });
            toast.success(payBalance
                ? 'Balance submitted. Admin will verify the remaining UPI transfer.'
                : 'Submitted! Admin will verify and confirm your booking.');
            await load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit payment');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-mist flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-ember border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-mist">
            <Navbar />
            <div className="container max-w-3xl pt-24 pb-16 px-4">
                <Link to={`/adventure/${booking?.adventure_id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ember mb-6">
                    <ArrowLeft size={14} /> Back to adventure
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-mist-subtle rounded-xl border border-stone/10 shadow-card overflow-hidden mb-6"
                >
                    <div className="bg-panel text-cream px-6 py-5 flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <img
                                src="/logo-mark.png?v=6"
                                alt=""
                                width={48}
                                height={48}
                                className="block w-12 h-12 shrink-0 select-none"
                            />
                            <div>
                                <p className="meta !text-cream/50 mb-1">Booking ID</p>
                                <h1 className="font-display text-2xl font-semibold tracking-wide">{booking?.booking_code}</h1>
                                <p className="text-cream/80 mt-1">{adventure?.title}</p>
                            </div>
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                            status === 'confirmed' ? 'bg-moss/30 text-cream'
                                : status === 'payment_submitted' ? 'bg-sky/30 text-cream'
                                    : 'bg-ember/30 text-cream'
                        }`}>
                            {status === 'confirmed' ? 'Confirmed'
                                : status === 'payment_submitted' ? 'Under review'
                                    : 'Awaiting payment'}
                        </span>
                    </div>

                    <div className="p-6 grid sm:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-muted mb-0.5">Date</p>
                            <p className="font-semibold text-stone">{booking?.adventure_date}</p>
                        </div>
                        <div>
                            <p className="text-muted mb-0.5">Seats</p>
                            <p className="font-semibold text-stone">{booking?.number_of_seats}</p>
                        </div>
                        <div>
                            <p className="text-muted mb-0.5">
                                {payBalance ? 'Pay remaining balance'
                                    : booking?.payment_type === 'advance' ? 'Pay now (advance)'
                                    : isTour ? 'Amount (tour)'
                                    : 'Amount (full UPI)'}
                            </p>
                            <p className="font-display text-2xl font-semibold text-stone inline-flex items-center gap-0.5">
                                <IndianRupee size={18} />
                                {Number(payAmount || 0).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    {(booking?.payment_type === 'advance' || (booking?.total_amount != null && booking.total_amount !== booking.amount)) && (
                        <div className="px-6 pb-4 grid sm:grid-cols-2 gap-3 text-sm">
                            <div className="bg-mist-subtle rounded-lg p-3 border border-stone/10">
                                <p className="text-muted mb-0.5">Trip total</p>
                                <p className="font-semibold text-stone">
                                    ₹{Number(booking?.total_amount ?? booking?.amount ?? 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="bg-mist-subtle rounded-lg p-3 border border-stone/10">
                                <p className="text-muted mb-0.5">Balance before departure</p>
                                <p className="font-semibold text-stone">
                                    ₹{Number(booking?.balance_due ?? 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    )}

                    {booking?.selected_options?.length > 0 && (
                        <div className="px-6 pb-4 text-sm">
                            <p className="text-muted mb-1.5">Selected options</p>
                            <ul className="space-y-1">
                                {booking.selected_options.map((o, i) => (
                                    <li key={i} className="text-stone flex justify-between gap-2">
                                        <span>{o.label}</span>
                                        <span className="text-muted shrink-0">
                                            {o.extra_per_person > 0
                                                ? `+₹${Number(o.extra_per_person).toLocaleString('en-IN')}/person`
                                                : 'Included'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {(booking?.emergency_contact || (booking?.participants?.length > 0) || booking?.pickup_point || (booking?.additional_travelers?.length > 0)) && (
                        <div className="px-6 pb-6 space-y-3 text-sm border-t border-stone/10 pt-4">
                            {booking?.emergency_contact && (
                                <div>
                                    <p className="text-muted mb-0.5">Emergency contact</p>
                                    <p className="font-semibold text-stone">{booking.emergency_contact}</p>
                                </div>
                            )}
                            {(booking?.participants?.length > 0 ? booking.participants : null)?.map((p, i) => (
                                <div key={i} className="bg-mist-subtle rounded-lg p-3 border border-stone/10">
                                    <p className="font-semibold text-stone mb-1">
                                        {i === 0 ? 'Primary participant' : `Participant ${i + 1}`}
                                    </p>
                                    <p className="text-stone">{p.name} · {p.phone}</p>
                                    <p className="text-muted text-xs mt-1">
                                        Pickup: {p.pickup_point} · Meal: {String(p.meal_preference || '').replace(/_/g, '-')}
                                    </p>
                                </div>
                            ))}
                            {!booking?.participants?.length && booking?.pickup_point && (
                                <div>
                                    <p className="text-muted mb-0.5">Pickup point</p>
                                    <p className="font-semibold text-stone">{booking.pickup_point}</p>
                                </div>
                            )}
                            {!booking?.participants?.length && booking?.additional_travelers?.length > 0 && (
                                <div>
                                    <p className="text-muted mb-1">Additional travelers</p>
                                    <ul className="space-y-1">
                                        {booking.additional_travelers.map((t, i) => (
                                            <li key={i} className="text-stone">
                                                {t.name} · {t.phone} · {t.meal_preference?.replace('_', '-')}
                                                {t.pickup_point ? ` · ${t.pickup_point}` : ''}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'pending_payment' && remaining != null && (
                        <div className="mx-6 mb-6 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg px-4 py-3">
                            <Clock size={16} className="shrink-0" />
                            Seats held for <strong>{formatTime(remaining)}</strong> — complete payment within {holdMinutes} minutes before timer runs out.
                        </div>
                    )}
                </motion.div>

                {!alreadySubmitted && status !== 'expired' && status !== 'rejected' && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="bg-mist-subtle rounded-xl border border-stone/10 shadow-card p-6 mb-6"
                        >
                            <h2 className="font-display text-xl text-stone font-semibold mb-2 flex items-center gap-2">
                                <QrCode size={20} className="text-ember" /> Pay via UPI
                            </h2>
                            <p className="text-sm text-muted mb-5">
                                Pay exactly <strong className="text-stone">₹{Number(payAmount || 0).toLocaleString('en-IN')}</strong>
                                {payBalance ? ' remaining balance' : booking?.payment_type === 'advance' ? ' advance' : isTour ? ' (tour)' : ' (full trek amount)'} to{' '}
                                <strong className="text-stone">{payeeName}</strong>.
                                Use booking ID <strong className="text-stone">{booking?.booking_code}</strong> in the payment remark.
                                {booking?.payment_type === 'advance' && Number(booking?.balance_due) > 0 ? (
                                    <> Balance of ₹{Number(booking.balance_due).toLocaleString('en-IN')} is due before departure.</>
                                ) : null}
                            </p>

                            <div className="grid md:grid-cols-2 gap-6 items-start">
                                <div className="flex flex-col items-center">
                                    {qrTrusted === null ? (
                                        <div className="w-full max-w-[260px] aspect-square rounded-lg border border-stone/10 bg-mist flex items-center justify-center text-xs text-muted">
                                            Checking merchant QR…
                                        </div>
                                    ) : qrTrusted ? (
                                        <button
                                            type="button"
                                            onClick={() => setQrOpen(true)}
                                            className="group relative w-full max-w-[260px] rounded-lg border border-stone/10 bg-mist-subtle overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
                                            aria-label="Open QR code fullscreen to scan"
                                        >
                                            <img
                                                src={UPI_QR_SRC}
                                                alt={`${payeeName} UPI QR`}
                                                className="w-full block transition group-hover:scale-[1.02]"
                                            />
                                            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-panel/75 text-cream text-xs font-semibold py-2 opacity-0 group-hover:opacity-100 transition">
                                                <Maximize2 size={14} /> Click to enlarge &amp; zoom
                                            </span>
                                        </button>
                                    ) : (
                                        <div className="w-full max-w-[260px] rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                                            QR image could not be verified. Pay only to <strong className="font-mono">{upiId}</strong> using Copy or Open UPI App. Do not scan a QR from a screenshot or chat.
                                        </div>
                                    )}
                                    <p className="text-xs text-muted mt-2 text-center">
                                        Official merchant QR — checked against a fixed hash. Payee is always {payeeName}.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="meta mb-1.5 block">UPI ID</label>
                                        <div className="flex gap-2">
                                            <input
                                                readOnly
                                                className="input flex-1 font-mono text-sm"
                                                value={upiId}
                                            />
                                            <button type="button" onClick={copyUpi} className="btn btn-outline !px-3" aria-label="Copy UPI ID">
                                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted mt-1.5">UPI — {payeeName}{upiId ? ` · ${upiId}` : ''}</p>
                                    </div>

                                    <a href={upiAppLink} className="btn btn-primary w-full inline-flex items-center justify-center gap-2">
                                        <ExternalLink size={16} /> Open UPI App
                                    </a>

                                    <div className="text-xs text-muted space-y-1 bg-mist-subtle rounded-lg p-3 border border-stone/10">
                                        <p className="font-semibold text-stone mb-1">Payment instructions</p>
                                        <p>1. Pay exactly <strong>₹{Number(payAmount || 0).toLocaleString('en-IN')}</strong>{payBalance ? ' remaining balance' : booking?.payment_type === 'advance' ? ' advance' : ''} to <strong>{upiId || payeeName}</strong></p>
                                        <p>2. Put <strong>{booking?.booking_code}</strong> in the remark / note</p>
                                        <p>3. Screenshot the success screen</p>
                                        <p>4. Submit details below for manual verification (no Razorpay fees)</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.form
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-mist-subtle rounded-xl border border-stone/10 shadow-card p-6 space-y-4"
                        >
                            <h2 className="font-display text-xl text-stone font-semibold">Submit Payment Details</h2>
                            <p className="text-sm text-muted">
                                After paying, enter your UTR/reference number, name on the payment, amount, and upload the screenshot.
                                Admin confirms booking after bank verification.
                            </p>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="meta mb-1.5 block">Name on payment *</label>
                                    <input
                                        required
                                        className="input w-full"
                                        value={form.payer_name}
                                        onChange={(e) => setForm({ ...form, payer_name: e.target.value })}
                                        placeholder="As shown on UPI receipt"
                                    />
                                </div>
                                <div>
                                    <label className="meta mb-1.5 block">Amount paid (₹) *</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        className="input w-full"
                                        value={form.amount_paid}
                                        onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="meta mb-1.5 block">UTR / UPI reference ID *</label>
                                <input
                                    required
                                    className="input w-full font-mono"
                                    value={form.upi_reference}
                                    onChange={(e) => setForm({ ...form, upi_reference: e.target.value })}
                                    placeholder="e.g. 412345678901"
                                />
                            </div>

                            <div>
                                <label className="meta mb-1.5 block">Your UPI ID (optional)</label>
                                <input
                                    className="input w-full font-mono"
                                    value={form.payer_upi_id}
                                    onChange={(e) => setForm({ ...form, payer_upi_id: e.target.value })}
                                    placeholder="name@upi"
                                />
                            </div>

                            <div>
                                <label className="meta mb-1.5 block">Payment screenshot *</label>
                                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone/20 rounded-lg p-6 cursor-pointer hover:border-ember/50 transition bg-mist-subtle">
                                    <Upload size={22} className="text-ember" />
                                    <span className="text-sm text-muted">
                                        {form.screenshot ? form.screenshot.name : 'Click to upload screenshot'}
                                    </span>
                                    <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                                </label>
                                {preview && (
                                    <img src={preview} alt="Payment screenshot preview" className="mt-3 max-h-48 rounded-lg border border-stone/10" />
                                )}
                            </div>

                            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                                {submitting ? 'Submitting…' : 'Submit for verification'}
                            </button>
                            {showCancel && (
                                <button
                                    type="button"
                                    disabled={cancelling}
                                    onClick={handleCancelBooking}
                                    className="btn btn-outline w-full border-red-200 text-red-700 hover:bg-red-50"
                                >
                                    {cancelling ? 'Cancelling…' : 'Cancel booking'}
                                </button>
                            )}
                        </motion.form>
                    </>
                )}

                {status === 'payment_submitted' && (
                    <div className="bg-sky/10 border border-sky/30 rounded-xl p-6 text-center">
                        <p className="font-semibold text-stone mb-1">Payment under review</p>
                        <p className="text-sm text-muted">
                            We received your details{payment?.upi_reference ? ` (UTR: ${payment.upi_reference})` : ''}.
                            Admin will confirm once the amount appears in our bank statement.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                            <Link to="/dashboard" className="btn btn-outline inline-flex">Go to dashboard</Link>
                            {showCancel && (
                                <button
                                    type="button"
                                    disabled={cancelling}
                                    onClick={handleCancelBooking}
                                    className="btn btn-outline border-red-200 text-red-700 hover:bg-red-50"
                                >
                                    {cancelling ? 'Cancelling…' : 'Cancel booking'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {status === 'confirmed' && (
                    <div className="bg-moss/10 border border-moss/30 rounded-xl p-6 text-center">
                        <p className="font-semibold text-stone mb-1">Booking confirmed!</p>
                        <p className="text-sm text-muted">Your seats are locked. See you on the trail.</p>
                        <Link to="/dashboard" className="btn btn-primary mt-4 inline-flex">My trips</Link>
                    </div>
                )}

                {(status === 'expired' || status === 'rejected') && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="font-semibold text-stone mb-1">
                            {status === 'expired' ? 'Hold expired' : 'Payment rejected'}
                        </p>
                        <p className="text-sm text-muted mb-4">
                            {payment?.rejection_reason || 'Please create a new booking and try again.'}
                        </p>
                        <Link to={`/adventure/${booking?.adventure_id}`} className="btn btn-primary inline-flex">Book again</Link>
                    </div>
                )}
            </div>
            {qrOpen && qrTrusted === true && (
                <QrZoomModal src={UPI_QR_SRC} payeeName={payeeName} onClose={() => setQrOpen(false)} />
            )}
                        <Footer />
        </div>
    );
};

export default BookingPayment;
