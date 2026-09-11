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

    const HIDDEN_STATUSES = new Set(['expired', 'cancelled']);
    const visibleAll = allBookings.filter((row) => {
        const status = (row.booking || row).booking_status;
        return !HIDDEN_STATUSES.has(status);
    });
    const list = tab === 'pending' ? pending : visibleAll;
    const submittedUtrs = pending
        .map((row) => String(row.payment?.upi_reference || '').trim())
        .filter(Boolean);
    const duplicateUtrs = new Set(
        submittedUtrs.filter((u, i) => submittedUtrs.indexOf(u) !== i)
    );

    return (
        <div className="payments-page">
            <div className="page-header">
                <div>
                    <p className="page-subtitle" style={{ marginTop: 0 }}>
                        Verify UPI transfers against your bank statement. Treks are full payment; tours may show advance then a second balance UPI.
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
                    <span className="tab-count"> ({visibleAll.length})</span>
                </button>
            </div>

            {loading ? (
                <div className="loading-state"><div className="spinner" /></div>
            ) : list.length === 0 ? (
                <div className="empty-state">
                    <p>{tab === 'pending' ? 'No payments waiting for verification.' : 'No active bookings to show (expired holds are hidden).'}</p>
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
                                            {String(adventure?.category || 'trip').toLowerCase() === 'tour' ? 'Tour' : 'Trek'}
                                            {' · '}
                                            {(payment?.payment_kind || booking.payment_type || 'full').replace(/_/g, ' ')}
                                            {payment?.payment_kind === 'balance' ? ' (remaining balance)' : ''}
                                            {' · '}
                                            {booking.customer_name || booking.customer_email}
                                            {' · '}
                                            {booking.adventure_date}
                                            {' · '}
                                            {booking.number_of_seats} seat(s)
                                        </p>
                                        {(booking.pickup_point || booking.emergency_contact) && (
                                            <p className="payment-meta">
                                                {booking.pickup_point && <>Pickup: {booking.pickup_point}</>}
                                                {booking.pickup_point && booking.emergency_contact && ' · '}
                                                {booking.emergency_contact && <>Emergency: {booking.emergency_contact}</>}
                                            </p>
                                        )}
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
                                        <div>
                                            <dt>UTR</dt>
                                            <dd className="mono">
                                                {payment.upi_reference || '—'}
                                                {(payment.payment_status === 'duplicate' || duplicateUtrs.has(String(payment.upi_reference || '').trim())) && (
                                                    <span className="badge badge-red" style={{ marginLeft: '0.5rem' }}>Duplicate UTR</span>
                                                )}
                                            </dd>
                                        </div>
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

                                {(booking.participants?.length > 0 || booking.additional_travelers?.length > 0) && (
                                    <dl className="payment-details">
                                        <div className="payment-details-wide">
                                            <dt>Participants</dt>
                                            <dd>
                                                <ul className="traveler-list">
                                                    {(booking.participants?.length
                                                        ? booking.participants
                                                        : [
                                                            {
                                                                name: booking.customer_name,
                                                                phone: booking.customer_phone,
                                                                pickup_point: booking.pickup_point,
                                                                meal_preference: '—',
                                                            },
                                                            ...(booking.additional_travelers || []),
                                                        ]
                                                    ).map((t, i) => (
                                                        <li key={i}>
                                                            {t.name} · {t.phone}
                                                            {t.pickup_point ? ` · Pickup: ${t.pickup_point}` : ''}
                                                            {t.meal_preference && t.meal_preference !== '—'
                                                                ? ` · ${String(t.meal_preference).replace(/_/g, '-')}`
                                                                : ''}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </dd>
                                        </div>
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
