import React, { useState, useEffect, useRef } from 'react';
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
    Eye,
    TrendingUp,
    TrendingDown,
    Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, adventuresAPI, blogAdminAPI, contactAdminAPI, paymentsAdminAPI, getImageUrl } from '../utils/api';
import toast from 'react-hot-toast';
import './Dashboard.css';

const QUICK_LINKS = [
    { to: '/adventures/add', icon: Plus, label: 'New adventure' },
    { to: '/payments', icon: CreditCard, label: 'Verify payments' },
    { to: '/messages', icon: Inbox, label: 'Messages' },
    { to: '/blog/new', icon: PenLine, label: 'New story' },
    { to: '/reviews', icon: Star, label: 'Reviews' },
];

const MONTH_OPTIONS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

function currentIstYearMonth() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
    }).formatToParts(new Date());
    const year = Number(parts.find((p) => p.type === 'year')?.value);
    const month = Number(parts.find((p) => p.type === 'month')?.value);
    return { year, month };
}

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

function formatShortDay(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        });
    } catch {
        return dateStr.slice(5);
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

function ChangePill({ value }) {
    const n = Number(value) || 0;
    if (n === 0) return <span className="change-pill is-flat">0%</span>;
    const up = n > 0;
    return (
        <span className={`change-pill ${up ? 'is-up' : 'is-down'}`}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {up ? '+' : ''}{n}%
        </span>
    );
}

function MiniBars({ series, valueKey = 'pageviews', color = 'var(--ember)' }) {
    const values = (series || []).map((d) => Number(d[valueKey]) || 0);
    const max = Math.max(...values, 1);
    return (
        <div className="mini-bars" role="img" aria-label="Trend chart">
            {(series || []).map((d) => {
                const v = Number(d[valueKey]) || 0;
                const h = Math.max(4, Math.round((v / max) * 100));
                return (
                    <div key={d.date} className="mini-bar-col" title={`${formatShortDay(d.date)}: ${v}`}>
                        <div className="mini-bar" style={{ height: `${h}%`, background: color }} />
                        <span className="mini-bar-label">{formatShortDay(d.date).split(' ')[0]}</span>
                    </div>
                );
            })}
        </div>
    );
}

const Dashboard = () => {
    const { requires2faSetup, user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const initialPeriod = currentIstYearMonth();
    const [periodYear, setPeriodYear] = useState(initialPeriod.year);
    const [periodMonth, setPeriodMonth] = useState(initialPeriod.month);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [periodLoading, setPeriodLoading] = useState(false);
    const hasLoadedRef = useRef(false);

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
                period: { year: periodYear, month: periodMonth, label: '', is_current: true },
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
                revenue: { week: 0, month: 0, pending: 0, prev_month: 0, all_time: 0 },
                growth: {},
                visits: { today: {}, yesterday: {}, week: {}, month: {}, series: [], top_pages: [] },
                funnel: {},
                booking_series: [],
                top_adventures: [],
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
            if (!hasLoadedRef.current) setLoading(true);
            else setPeriodLoading(true);
            try {
                const res = await dashboardAPI.getOverview({ year: periodYear, month: periodMonth });
                if (!cancelled) {
                    setData(res.data?.data || null);
                    hasLoadedRef.current = true;
                }
            } catch (err) {
                if (err.response?.status === 404) {
                    await loadLegacy();
                    hasLoadedRef.current = true;
                    return;
                }
                if (err.response?.status === 403 && err.response?.data?.requires2faSetup) {
                    return;
                }
                if (!cancelled) {
                    toast.error(err.response?.data?.message || 'Failed to load dashboard');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    setPeriodLoading(false);
                }
            }
        };

        load();
        return () => { cancelled = true; };
    }, [periodYear, periodMonth]);

    const counts = data?.counts || {};
    const revenue = data?.revenue || {};
    const growth = data?.growth || {};
    const visits = data?.visits || {};
    const funnel = data?.funnel || {};
    const bookingSeries = data?.booking_series || [];
    const topAdventures = data?.top_adventures || [];
    const queue = data?.action_queue || { payments: [], messages: [], reviews: [] };
    const departures = data?.upcoming_departures || [];
    const alerts = data?.adventure_alerts || [];
    const recentBookings = data?.recent_bookings || [];
    const recentAdventures = data?.recent_adventures || [];
    const topPages = visits.top_pages || [];
    const visitSeries = visits.series || [];

    const attentionCount =
        (counts.pending_payments || 0) +
        (counts.new_messages || 0) +
        (counts.pending_reviews || 0);

    const funnelTotal = Math.max(
        1,
        (funnel.pending_payment || 0) +
        (funnel.payment_submitted || 0) +
        (funnel.confirmed || 0) +
        (funnel.expired || 0) +
        (funnel.cancelled || 0),
    );

    const metrics = [
        {
            label: 'Revenue this month',
            value: formatInr(revenue.month),
            sub: `${formatInr(revenue.week)} this week`,
            extra: <ChangePill value={growth.revenue_change_pct} />,
            to: '/payments',
            alert: false,
        },
        {
            label: 'Site visits today',
            value: visits.today?.pageviews ?? 0,
            sub: `${visits.today?.unique_visitors ?? 0} unique · ${visits.week?.pageviews ?? 0} this week`,
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
            sub: `${growth.bookings_month ?? 0} this month · ${growth.seats_sold_month ?? 0} seats`,
            extra: <ChangePill value={growth.bookings_change_pct} />,
            to: '/payments',
            alert: false,
        },
    ];

    const period = data?.period || {};
    const periodLabel = period.label || MONTH_OPTIONS.find((m) => m.value === periodMonth)?.label + ` ${periodYear}`;
    const nowYm = currentIstYearMonth();
    const yearOptions = [];
    for (let y = nowYm.year; y >= Math.min(2023, nowYm.year); y -= 1) {
        yearOptions.push(y);
    }
    if (!yearOptions.includes(periodYear)) yearOptions.push(periodYear);
    yearOptions.sort((a, b) => b - a);

    const monthOptionsFiltered = MONTH_OPTIONS.filter((m) => {
        if (periodYear < nowYm.year) return true;
        if (periodYear > nowYm.year) return false;
        return m.value <= nowYm.month;
    });

    const PeriodFilter = (
        <div className="period-filter" aria-label="Select month and year">
            <select
                className="period-select"
                value={periodMonth}
                onChange={(e) => setPeriodMonth(Number(e.target.value))}
                aria-label="Month"
                disabled={periodLoading}
            >
                {monthOptionsFiltered.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                ))}
            </select>
            <select
                className="period-select"
                value={periodYear}
                onChange={(e) => {
                    const y = Number(e.target.value);
                    setPeriodYear(y);
                    if (y === nowYm.year && periodMonth > nowYm.month) {
                        setPeriodMonth(nowYm.month);
                    }
                }}
                aria-label="Year"
                disabled={periodLoading}
            >
                {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </div>
    );

    const hasQueue =
        queue.payments?.length > 0 ||
        queue.messages?.length > 0 ||
        queue.reviews?.length > 0;

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h2 className="dashboard-eyebrow">Business overview</h2>
                    <p className="page-subtitle">Visits, revenue, and what needs attention</p>
                </div>
                {isAdmin && (
                <Link to="/adventures/add" className="btn-primary">
                    <Plus size={16} />
                    New adventure
                </Link>
                )}
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
                                {m.extra && <span className="metric-extra">{m.extra}</span>}
                            </Link>
                        ))}
                    </div>

                    <div className="actions-strip">
                        <span className="actions-strip-label">Go to</span>
                        {(isAdmin ? QUICK_LINKS : QUICK_LINKS.filter((l) => l.to === '/payments')).map((link) => (
                            <Link key={link.to} to={link.to} className="action-chip">
                                <link.icon size={14} aria-hidden />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="insights-toolbar">
                        <div>
                            <p className="insights-toolbar-title">Traffic &amp; growth</p>
                            <p className="insights-toolbar-hint">
                                Showing {periodLabel}
                                {period.is_current ? ' (to date)' : ''}
                                {periodLoading ? ' · updating…' : ''}
                            </p>
                        </div>
                        {PeriodFilter}
                    </div>

                    <div className={`insights-grid ${periodLoading ? 'is-refreshing' : ''}`}>
                        <section className="dash-panel" aria-labelledby="visits-heading">
                            <div className="dash-panel-header">
                                <h2 id="visits-heading">
                                    <Eye size={16} aria-hidden />
                                    Site traffic
                                </h2>
                                <span className="dash-panel-hint">{periodLabel}</span>
                            </div>
                            <div className="insight-stats">
                                <div>
                                    <span className="insight-stat-value">{visits.month?.pageviews ?? 0}</span>
                                    <span className="insight-stat-label">Pageviews</span>
                                </div>
                                <div>
                                    <span className="insight-stat-value">{visits.month?.unique_visitors ?? 0}</span>
                                    <span className="insight-stat-label">Unique visitors</span>
                                </div>
                                <div>
                                    <span className="insight-stat-value">
                                        {period.is_current ? (visits.today?.pageviews ?? 0) : (visits.month?.pageviews ?? 0)}
                                    </span>
                                    <span className="insight-stat-label">
                                        {period.is_current ? 'Views today' : 'Views in month'}
                                    </span>
                                </div>
                                <div>
                                    <span className="insight-stat-value">{growth.conversion_period ?? growth.conversion_week ?? 0}%</span>
                                    <span className="insight-stat-label">Visit → booking</span>
                                </div>
                            </div>
                            {visitSeries.length > 0 ? (
                                <MiniBars series={visitSeries} valueKey="pageviews" />
                            ) : (
                                <p className="dash-panel-hint" style={{ padding: '0 1rem 1rem' }}>
                                    No traffic recorded for this month yet.
                                </p>
                            )}
                            {topPages.length > 0 && (
                                <ul className="top-pages-list">
                                    {topPages.slice(0, 5).map((p) => (
                                        <li key={p.path}>
                                            <span className="mono">{p.path}</span>
                                            <span>{p.views}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="dash-panel" aria-labelledby="growth-heading">
                            <div className="dash-panel-header">
                                <h2 id="growth-heading">
                                    <Activity size={16} aria-hidden />
                                    Business growth
                                </h2>
                                <span className="dash-panel-hint">vs previous month</span>
                            </div>
                            <div className="insight-stats">
                                <div>
                                    <span className="insight-stat-value">{formatInr(revenue.month)}</span>
                                    <span className="insight-stat-label">
                                        Revenue <ChangePill value={growth.revenue_change_pct} />
                                    </span>
                                </div>
                                <div>
                                    <span className="insight-stat-value">{growth.bookings_month ?? 0}</span>
                                    <span className="insight-stat-label">
                                        Bookings <ChangePill value={growth.bookings_change_pct} />
                                    </span>
                                </div>
                                <div>
                                    <span className="insight-stat-value">{growth.seats_sold_month ?? 0}</span>
                                    <span className="insight-stat-label">Seats sold</span>
                                </div>
                                <div>
                                    <span className="insight-stat-value">{counts.new_users_period ?? counts.new_users_week ?? 0}</span>
                                    <span className="insight-stat-label">New users</span>
                                </div>
                            </div>
                            {bookingSeries.length > 0 && (
                                <MiniBars series={bookingSeries} valueKey="count" color="var(--forest, #2F4A3D)" />
                            )}
                            <div className="funnel-row">
                                {[
                                    { key: 'pending_payment', label: 'Held' },
                                    { key: 'payment_submitted', label: 'Submitted' },
                                    { key: 'confirmed', label: 'Confirmed' },
                                    { key: 'expired', label: 'Expired' },
                                ].map((f) => (
                                    <div key={f.key} className="funnel-item">
                                        <div
                                            className="funnel-bar"
                                            style={{ height: `${Math.max(8, ((funnel[f.key] || 0) / funnelTotal) * 64)}px` }}
                                        />
                                        <span className="funnel-count">{funnel[f.key] || 0}</span>
                                        <span className="funnel-label">{f.label}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {topAdventures.length > 0 && (
                        <section className="dash-panel top-adv-panel" aria-labelledby="top-adv-heading">
                            <div className="dash-panel-header">
                                <h2 id="top-adv-heading">
                                    <TrendingUp size={16} aria-hidden />
                                    Top adventures
                                </h2>
                                <span className="dash-panel-hint">{periodLabel}</span>
                            </div>
                            <ul className="top-adv-list">
                                {topAdventures.map((a, i) => (
                                    <li key={a.id}>
                                        <Link to={`/adventures/edit/${a.id}`} className="top-adv-row">
                                            <span className="top-adv-rank">{i + 1}</span>
                                            <span className="top-adv-title">{a.title}</span>
                                            <span className="top-adv-meta">{a.bookings} bookings · {a.seats} seats</span>
                                            <span className="top-adv-rev">{formatInr(a.revenue)}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

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
                                {isAdmin && (
                                <Link to="/adventures/add" className="btn-primary">
                                    <Plus size={16} />
                                    Add adventure
                                </Link>
                                )}
                            </div>
                        ) : (
                            <ul className="recent-list">
                                {recentAdventures.map((adv) => (
                                    <li key={adv.id}>
                                        <Link to={isAdmin ? `/adventures/edit/${adv.id}` : '/adventures'} className="recent-row">
                                            <div className="recent-thumb">
                                                <img
                                                    src={getImageUrl(adv.image_url) || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=120&h=120&fit=crop'}
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
