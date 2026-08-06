import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, RefreshCw, ExternalLink, IndianRupee } from 'lucide-react';
import { paymentsAdminAPI, bookingsAdminAPI } from '../utils/api';
import './Payments.css';

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
            <div className="page-header">
                <div>
                    <p className="page-subtitle" style={{ marginTop: 0 }}>
                        Verify UPI transfers against your bank statement, then confirm to send the customer their trek PDF.
                    </p>
                </div>
                <button type="button" className="btn-secondary" onClick={load} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
                </button>
            </div>

            <div className="tab-bar" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'pending'}
                    className={`tab-btn ${tab === 'pending' ? 'is-active' : ''}`}
                    onClick={() => setTab('pending')}
                >
                    Pending ({pending.length})
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'all'}
                    className={`tab-btn ${tab === 'all' ? 'is-active' : ''}`}
                    onClick={() => setTab('all')}
                >
                    All bookings
                </button>
            </div>

            {loading ? (
                <div className="loading-state"><div className="spinner" /></div>
            ) : list.length === 0 ? (
                <div className="empty-state">
                    <p>{tab === 'pending' ? 'No payments waiting for verification.' : 'No bookings yet.'}</p>
                </div>
            ) : (
                <div className="payment-list">
                    {list.map((row) => {
                        const booking = row.booking || row;
                        const payment = row.payment || row.payment_record;
                        const adventure = row.adventure;
                        const bookingId = booking._id || booking.id;
                        const isPending = booking.booking_status === 'payment_submitted'
                            || payment?.payment_status === 'submitted_by_customer';

                        return (
                            <article key={bookingId} className="payment-card panel">
                                <div className="payment-card-head">
                                    <div>
                                        <p className="payment-code">{booking.booking_code}</p>
                                        <h3 className="payment-title">{adventure?.title || 'Adventure'}</h3>
                                        <p className="payment-meta">
                                            {booking.customer_name || booking.customer_email}
                                            {' · '}
                                            {booking.adventure_date}
                                            {' · '}
                                            {booking.number_of_seats} seat(s)
                                        </p>
                                    </div>
                                    <div className="payment-amount">
                                        <span className="payment-amount-value">
                                            <IndianRupee size={16} aria-hidden />
                                            {Number(booking.amount || 0).toLocaleString('en-IN')}
                                        </span>
                                        <span className={`badge ${isPending ? 'badge-yellow' : booking.booking_status === 'confirmed' ? 'badge-green' : 'badge-red'}`}>
                                            {(booking.booking_status || 'unknown').replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>

                                {payment && (
                                    <dl className="payment-details">
                                        <div><dt>UTR</dt><dd className="mono">{payment.upi_reference || '—'}</dd></div>
                                        <div><dt>Payer</dt><dd>{payment.payer_name || '—'}</dd></div>
                                        {payment.payer_upi_id && <div><dt>Payer UPI</dt><dd>{payment.payer_upi_id}</dd></div>}
                                        {payment.screenshot_url && (
                                            <div className="payment-details-wide">
                                                <dt>Screenshot</dt>
                                                <dd>
                                                    <a href={payment.screenshot_url} target="_blank" rel="noreferrer" className="payment-link">
                                                        View screenshot <ExternalLink size={13} />
                                                    </a>
                                                </dd>
                                            </div>
                                        )}
                                        {payment.rejection_reason && (
                                            <div className="payment-details-wide payment-reject-note">
                                                <dt>Rejected</dt>
                                                <dd>{payment.rejection_reason}</dd>
                                            </div>
                                        )}
                                    </dl>
                                )}

                                {isPending && tab === 'pending' && (
                                    <div className="payment-actions">
                                        <button
                                            type="button"
                                            className="btn-primary"
                                            disabled={busyId === bookingId}
                                            onClick={() => verify(bookingId)}
                                        >
                                            <CheckCircle size={16} /> Confirm payment
                                        </button>
                                        {rejectId === bookingId ? (
                                            <div className="reject-form">
                                                <input
                                                    className="form-input"
                                                    placeholder="Rejection reason"
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-danger"
                                                    disabled={busyId === bookingId}
                                                    onClick={() => reject(bookingId)}
                                                >
                                                    Reject
                                                </button>
                                                <button type="button" className="btn-ghost" onClick={() => setRejectId(null)}>Cancel</button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn-danger"
                                                onClick={() => setRejectId(bookingId)}
                                            >
                                                <XCircle size={16} /> Reject
                                            </button>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Payments;
