import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, RefreshCw, ExternalLink, IndianRupee } from 'lucide-react';
import { paymentsAdminAPI, bookingsAdminAPI } from '../utils/api';

const Payments = () => {
    const [pending, setPending] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('pending');
    const [rejectReason, setRejectReason] = useState('');
    const [rejectId, setRejectId] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const [pendingRes, allRes] = await Promise.all([
                paymentsAdminAPI.getPending(),
                bookingsAdminAPI.getAll({}),
            ]);
            setPending(pendingRes.data?.data || []);
            setAllBookings(allRes.data?.data || []);
        } catch {
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const verify = async (bookingId) => {
        setBusyId(bookingId);
        try {
            await paymentsAdminAPI.verify(bookingId);
            toast.success('Payment verified — booking confirmed');
            await load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verify failed');
        } finally {
            setBusyId(null);
        }
    };

    const reject = async (bookingId) => {
        if (!rejectReason.trim()) {
            toast.error('Enter a rejection reason');
            return;
        }
        setBusyId(bookingId);
        try {
            await paymentsAdminAPI.reject(bookingId, rejectReason.trim());
            toast.success('Payment rejected');
            setRejectId(null);
            setRejectReason('');
            await load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reject failed');
        } finally {
            setBusyId(null);
        }
    };

    const list = tab === 'pending' ? pending : allBookings;

    return (
        <div className="payments-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                    <h1 className="page-title">Payments & Bookings</h1>
                    <p className="page-subtitle">Verify UPI transfers manually — match bank statement, then confirm</p>
                </div>
                <button type="button" className="btn-secondary" onClick={load} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="flex gap-2 mb-6">
                <button
                    type="button"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'pending' ? 'bg-[var(--primary)] text-white' : 'bg-white border'}`}
                    onClick={() => setTab('pending')}
                >
                    Pending ({pending.length})
                </button>
                <button
                    type="button"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'all' ? 'bg-[var(--primary)] text-white' : 'bg-white border'}`}
                    onClick={() => setTab('all')}
                >
                    All bookings
                </button>
            </div>

            {loading ? (
                <div className="loading-state"><div className="spinner" /></div>
            ) : list.length === 0 ? (
                <div className="bg-white rounded-xl border p-10 text-center text-[var(--text-light)]">
                    {tab === 'pending' ? 'No payments waiting for verification.' : 'No bookings yet.'}
                </div>
            ) : (
                <div className="space-y-4">
                    {list.map((row) => {
                        const booking = row.booking || row;
                        const payment = row.payment || row.payment_record;
                        const adventure = row.adventure;
                        const bookingId = booking._id || booking.id;
                        const isPending = booking.booking_status === 'payment_submitted'
                            || payment?.payment_status === 'submitted_by_customer';

                        return (
                            <div key={bookingId} className="bg-white rounded-xl border p-5">
                                <div className="flex flex-wrap justify-between gap-3 mb-3">
                                    <div>
                                        <p className="font-mono text-sm font-bold">{booking.booking_code}</p>
                                        <p className="text-lg font-semibold" style={{ color: 'var(--text-main)' }}>
                                            {adventure?.title || 'Adventure'}
                                        </p>
                                        <p className="text-sm text-[var(--text-light)]">
                                            {booking.customer_name || booking.customer_email} · {booking.adventure_date} · {booking.number_of_seats} seat(s)
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold inline-flex items-center gap-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                                            <IndianRupee size={18} />
                                            {Number(booking.amount || 0).toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-xs uppercase font-semibold mt-1">{booking.booking_status?.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>

                                {payment && (
                                    <div className="grid sm:grid-cols-2 gap-3 bg-[var(--bg-secondary,#f8f6f1)] rounded-lg p-4 mb-3 text-sm">
                                        <p><strong>UTR:</strong> <span className="font-mono">{payment.upi_reference || '—'}</span></p>
                                        <p><strong>Payer:</strong> {payment.payer_name || '—'}</p>
                                        {payment.payer_upi_id && <p><strong>Payer UPI:</strong> {payment.payer_upi_id}</p>}
                                        {payment.screenshot_url && (
                                            <p>
                                                <a href={payment.screenshot_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--primary-dark)] font-semibold">
                                                    View screenshot <ExternalLink size={14} />
                                                </a>
                                            </p>
                                        )}
                                        {payment.rejection_reason && (
                                            <p className="sm:col-span-2 text-red-600"><strong>Rejected:</strong> {payment.rejection_reason}</p>
                                        )}
                                    </div>
                                )}

                                {isPending && tab === 'pending' && (
                                    <div className="flex flex-wrap gap-2 items-start">
                                        <button
                                            type="button"
                                            className="btn-primary inline-flex items-center gap-1.5"
                                            disabled={busyId === bookingId}
                                            onClick={() => verify(bookingId)}
                                        >
                                            <CheckCircle size={16} /> Confirm payment
                                        </button>
                                        {rejectId === bookingId ? (
                                            <div className="flex flex-wrap gap-2 flex-1 min-w-[220px]">
                                                <input
                                                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                                    placeholder="Rejection reason"
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold"
                                                    disabled={busyId === bookingId}
                                                    onClick={() => reject(bookingId)}
                                                >
                                                    Reject
                                                </button>
                                                <button type="button" className="px-3 py-2 text-sm" onClick={() => setRejectId(null)}>Cancel</button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-semibold text-red-700"
                                                onClick={() => setRejectId(bookingId)}
                                            >
                                                <XCircle size={16} /> Reject
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Payments;
