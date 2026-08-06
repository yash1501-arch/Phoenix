import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Star,
    Compass,
    MapPin,
    Clock,
    ArrowRight,
    PenLine,
    Inbox,
    CreditCard,
    Calendar,
    Users,
    AlertTriangle,
    CheckCircle,
    Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, adventuresAPI, blogAdminAPI, contactAdminAPI, paymentsAdminAPI } from '../utils/api';
import toast from 'react-hot-toast';
import './Dashboard.css';

const QUICK_LINKS = [
    { to: '/adventures/add', icon: Plus, label: 'New adventure' },
    { to: '/payments', icon: CreditCard, label: 'Verify payments' },
    { to: '/messages', icon: Inbox, label: 'Messages' },
    { to: '/blog/new', icon: PenLine, label: 'New story' },
    { to: '/reviews', icon: Star, label: 'Reviews' },
];

const ISSUE_LABELS = {
    draft: 'Draft',
    no_confirmation_pdf: 'No confirmation PDF',
    no_upcoming_dates: 'No upcoming dates',
    no_cover_image: 'No cover image',
};

function formatInr(amount) {
    const n = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(n);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function seatFillClass(booked, max) {
    if (max <= 0) return '';
    const pct = booked / max;
    if (pct >= 1) return 'is-full';
    if (pct >= 0.75) return 'is-high';
    if (pct < 0.25) return 'is-low';
    return '';
}

const Dashboard = () => {
    const { requires2faSetup } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadLegacy = async () => {
            const [advRes, postsRes, msgsRes, paymentsRes] = await Promise.allSettled([
                adventuresAPI.getAll({}),
                blogAdminAPI.getAll(),
                contactAdminAPI.getAll(),
                paymentsAdminAPI.getPending(),
            ]);

            const adventures = advRes.status === 'fulfilled' ? (advRes.value.data?.data || advRes.value.data || []) : [];
            const posts = postsRes.status === 'fulfilled' ? (postsRes.value.data?.data || []) : [];
            const messages = msgsRes.status === 'fulfilled' ? (msgsRes.value.data?.data || []) : [];
            const pendingPayments = paymentsRes.status === 'fulfilled' ? (paymentsRes.value.data?.data || []) : [];

            if (cancelled) return;

            setData({
                counts: {
                    adventures: adventures.length,
                    active_adventures: adventures.filter((a) => a.status === 'active').length,
                    draft_adventures: adventures.filter((a) => a.status === 'draft').length,
                    blog_posts: posts.length,
                    published_posts: posts.filter((p) => p.published).length,
                    new_messages: messages.filter((m) => m.status === 'new').length,
                    pending_payments: pendingPayments.length,
                    pending_reviews: 0,
                    confirmed_bookings_week: 0,
                },
                revenue: { week: 0, month: 0, pending: 0 },
                action_queue: { payments: [], messages: [], reviews: [] },
                upcoming_departures: [],
                adventure_alerts: [],
                recent_bookings: [],
                recent_adventures: adventures.slice(0, 6).map((a) => ({
                    id: a._id || a.id,
                    title: a.title,
                    location: a.location,
                    duration: a.duration,
                    category: a.category,
                    status: a.status,
                    image_url: a.image_url,
                })),
            });
        };

        const load = async () => {
            try {
                const res = await dashboardAPI.getOverview();
                if (!cancelled) setData(res.data?.data || null);
            } catch (err) {
                if (err.response?.status === 404) {
                    await loadLegacy();
                    return;
                }
                if (err.response?.status === 403 && err.response?.data?.requires2faSetup) {
                    return;
                }
                if (!cancelled) {
                    toast.error(err.response?.data?.message || 'Failed to load dashboard');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    const counts = data?.counts || {};
    const revenue = data?.revenue || {};
    const queue = data?.action_queue || { payments: [], messages: [], reviews: [] };
    const departures = data?.upcoming_departures || [];
    const alerts = data?.adventure_alerts || [];
    const recentBookings = data?.recent_bookings || [];
    const recentAdventures = data?.recent_adventures || [];

    const attentionCount =
        (counts.pending_payments || 0) +
        (counts.new_messages || 0) +
        (counts.pending_reviews || 0);

    const metrics = [
        {
            label: 'Revenue this month',
            value: formatInr(revenue.month),
            sub: `${formatInr(revenue.week)} this week`,
            to: '/payments',
            alert: false,
        },
        {
            label: 'Pending payments',
            value: counts.pending_payments ?? 0,
            sub: formatInr(revenue.pending) + ' awaiting verify',
            to: '/payments',
            alert: (counts.pending_payments || 0) > 0,
        },
        {
            label: 'Confirmed bookings',
            value: counts.confirmed_bookings_week ?? 0,
            sub: 'this week',
            to: '/payments',
            alert: false,
        },
        {
            label: 'Active adventures',
            value: counts.active_adventures ?? 0,
            sub: `${counts.adventures ?? 0} total · ${counts.draft_adventures ?? 0} draft`,
            to: '/adventures',
            alert: (counts.draft_adventures || 0) > 0,
        },
    ];

    const hasQueue =
        queue.payments?.length > 0 ||
        queue.messages?.length > 0 ||
        queue.reviews?.length > 0;

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h2 className="dashboard-eyebrow">Overview</h2>
                    <p className="page-subtitle">What needs your attention today</p>
                </div>
                <Link to="/adventures/add" className="btn-primary">
                    <Plus size={16} />
                    New adventure
                </Link>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner" />
                    <p>Loading dashboard…</p>
                </div>
            ) : requires2faSetup && !data ? (
                <div className="empty-state">
                    <Shield size={40} strokeWidth={1.5} />
                    <h3>Enable two-factor authentication</h3>
                    <p>
                        Admin features require 2FA. Set up an authenticator app in Settings, then return here to view your dashboard.
                    </p>
                    <Link to="/settings" className="btn-primary">
                        <Shield size={16} />
                        Set up 2FA in Settings
                    </Link>
                </div>
            ) : (
                <>
                    <div className="metrics-row">
                        {metrics.map((m) => (
                            <Link
                                key={m.label}
                                to={m.to}
                                className={`metric-link ${m.alert ? 'is-alert' : ''}`}
                            >
                                <span className="metric-value">
                                    {m.value}
                                </span>
                                <span className="metric-label">{m.label}</span>
                                <span className="metric-sub">{m.sub}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="actions-strip">
                        <span className="actions-strip-label">Go to</span>
                        {QUICK_LINKS.map((link) => (
                            <Link key={link.to} to={link.to} className="action-chip">
                                <link.icon size={14} aria-hidden />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {attentionCount > 0 && (
                        <section className="attention-panel" aria-labelledby="attention-heading">
                            <div className="attention-panel-header">
                                <h2 id="attention-heading">Needs attention</h2>
                                <span className="attention-count">{attentionCount}</span>
                            </div>

                            {!hasQueue ? (
                                <p className="attention-empty">Counts are elevated — open the relevant section to review.</p>
                            ) : (
                                <ul className="attention-list">
                                    {queue.payments?.map((p) => (
                                        <li key={p.booking_id}>
                                            <Link to="/payments" className="attention-item attention-item--payment">
                                                <CreditCard size={16} aria-hidden />
                                                <div className="attention-body">
                                                    <span className="attention-title">
                                                        {p.booking_code} · {formatInr(p.amount)}
                                                    </span>
                                                    <span className="attention-meta">
                                                        {p.customer_name} — {p.adventure_title}
                                                    </span>
                                                </div>
                                                <span className="attention-cta">Verify</span>
                                            </Link>
                                        </li>
                                    ))}
                                    {queue.messages?.map((m) => (
                                        <li key={m.id}>
                                            <Link to="/messages" className="attention-item attention-item--message">
                                                <Inbox size={16} aria-hidden />
                                                <div className="attention-body">
                                                    <span className="attention-title">{m.subject}</span>
                                                    <span className="attention-meta">{m.name}</span>
                                                </div>
                                                <span className="attention-cta">Reply</span>
                                            </Link>
                                        </li>
                                    ))}
                                    {queue.reviews?.map((r) => (
                                        <li key={r.id}>
                                            <Link to="/reviews" className="attention-item attention-item--review">
                                                <Star size={16} aria-hidden />
                                                <div className="attention-body">
                                                    <span className="attention-title">
                                                        {r.user_name} · {'★'.repeat(r.rating)}
                                                    </span>
                                                    <span className="attention-meta">{r.adventure_title}</span>
                                                </div>
                                                <span className="attention-cta">Moderate</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    )}

                    <div className="dashboard-grid">
                        <section className="dash-panel" aria-labelledby="departures-heading">
                            <div className="dash-panel-header">
                                <h2 id="departures-heading">
                                    <Calendar size={16} aria-hidden />
                                    Upcoming departures
                                </h2>
                                <span className="dash-panel-hint">Next 14 days</span>
                            </div>
                            {departures.length === 0 ? (
                                <div className="dash-panel-empty">
                                    <p>No departures in the next two weeks.</p>
                                    <Link to="/adventures" className="btn-ghost">Manage adventures</Link>
                                </div>
                            ) : (
                                <ul className="departure-list">
                                    {departures.map((d) => (
                                        <li key={`${d.adventure_id}-${d.date}`}>
                                            <Link
                                                to={`/adventures/edit/${d.adventure_id}`}
                                                className={`departure-row ${seatFillClass(d.seats_booked, d.max_participants)}`}
                                            >
                                                <div className="departure-date">
                                                    <span className="departure-day">{formatDate(d.date)}</span>
                                                </div>
                                                <div className="departure-body">
                                                    <span className="departure-title">{d.title}</span>
                                                    <span className="departure-meta">
                                                        <MapPin size={11} aria-hidden />
                                                        {d.location || '—'}
                                                    </span>
                                                </div>
                                                <div className="departure-seats">
                                                    <Users size={14} aria-hidden />
                                                    <span>{d.seats_booked}/{d.max_participants}</span>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="dash-panel" aria-labelledby="bookings-heading">
                            <div className="dash-panel-header">
                                <h2 id="bookings-heading">
                                    <CreditCard size={16} aria-hidden />
                                    Recent bookings
                                </h2>
                                <Link to="/payments" className="view-all">
                                    All <ArrowRight size={12} />
                                </Link>
                            </div>
                            {recentBookings.length === 0 ? (
                                <div className="dash-panel-empty">
                                    <p>No confirmed bookings yet.</p>
                                </div>
                            ) : (
                                <ul className="booking-list">
                                    {recentBookings.map((b) => (
                                        <li key={b.id}>
                                            <div className="booking-row">
                                                <div className="booking-main">
                                                    <span className="booking-code">{b.booking_code}</span>
                                                    <span className="booking-title">{b.adventure_title}</span>
                                                    <span className="booking-meta">
                                                        {b.customer_name} · {formatDate(b.adventure_date)} · {b.seats} seat{b.seats !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="booking-side">
                                                    <span className="booking-amount">{formatInr(b.amount)}</span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>

                    {alerts.length > 0 && (
                        <section className="alerts-panel" aria-labelledby="alerts-heading">
                            <div className="alerts-panel-header">
                                <h2 id="alerts-heading">
                                    <AlertTriangle size={16} aria-hidden />
                                    Adventure checklist
                                </h2>
                                <span className="dash-panel-hint">{alerts.length} need attention</span>
                            </div>
                            <ul className="alerts-list">
                                {alerts.map((a) => (
                                    <li key={a.id}>
                                        <Link to={`/adventures/edit/${a.id}`} className="alert-row">
                                            <span className="alert-title">{a.title}</span>
                                            <span className="alert-tags">
                                                {a.issues.map((issue) => (
                                                    <span key={issue} className="badge badge-yellow">
                                                        {ISSUE_LABELS[issue] || issue}
                                                    </span>
                                                ))}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="recent-panel" aria-labelledby="recent-adventures-heading">
                        <div className="recent-panel-header">
                            <h2 id="recent-adventures-heading">Recent adventures</h2>
                            <Link to="/adventures" className="view-all">
                                All adventures <ArrowRight size={12} />
                            </Link>
                        </div>

                        {recentAdventures.length === 0 ? (
                            <div className="empty-state" style={{ border: 'none', borderRadius: 0 }}>
                                <Compass size={40} strokeWidth={1.5} />
                                <h3>No adventures yet</h3>
                                <p>Create your first trek package — upload a brochure PDF to auto-fill the form.</p>
                                <Link to="/adventures/add" className="btn-primary">
                                    <Plus size={16} />
                                    Add adventure
                                </Link>
                            </div>
                        ) : (
                            <ul className="recent-list">
                                {recentAdventures.map((adv) => (
                                    <li key={adv.id}>
                                        <Link to={`/adventures/edit/${adv.id}`} className="recent-row">
                                            <div className="recent-thumb">
                                                <img
                                                    src={adv.image_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=120&h=120&fit=crop'}
                                                    alt=""
                                                />
                                            </div>
                                            <div className="recent-body">
                                                <span className="recent-title">{adv.title}</span>
                                                <span className="recent-meta">
                                                    <MapPin size={11} aria-hidden />
                                                    {adv.location || 'No location'}
                                                    {adv.duration && (
                                                        <>
                                                            <span aria-hidden>·</span>
                                                            <Clock size={11} aria-hidden />
                                                            {adv.duration}
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="recent-badges">
                                                {adv.category && <span className="badge badge-orange">{adv.category}</span>}
                                                <span className={`badge ${adv.status === 'active' ? 'badge-green' : adv.status === 'inactive' ? 'badge-red' : 'badge-yellow'}`}>
                                                    {adv.status || 'draft'}
                                                </span>
                                            </div>
                                            <ArrowRight size={14} className="recent-arrow" aria-hidden />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {attentionCount === 0 && (
                        <div className="all-clear" role="status">
                            <CheckCircle size={18} aria-hidden />
                            <span>All caught up — no pending payments, messages, or reviews.</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
