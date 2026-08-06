import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Mountain,
    Plus,
    Star,
    Settings,
    Compass,
    MapPin,
    Clock,
    ArrowRight,
    Sparkles,
    PenLine,
    Inbox,
    TrendingUp,
    Eye,
    CreditCard
} from 'lucide-react';
import { adventuresAPI, blogAdminAPI, contactAdminAPI, reviewsAPI, paymentsAdminAPI } from '../utils/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import './Dashboard.css';

const quickActions = [
    { to: '/adventures/add', icon: Plus, label: 'New Adventure', desc: 'Create a new adventure package', color: 'gold' },
    { to: '/blog/new', icon: PenLine, label: 'Write a Story', desc: 'Publish to the Trail Journal', color: 'emerald' },
    { to: '/reviews', icon: Star, label: 'Reviews', desc: 'Moderate customer reviews', color: 'blue' },
    { to: '/messages', icon: Inbox, label: 'Messages', desc: 'Contact form enquiries', color: 'purple' },
    { to: '/payments', icon: CreditCard, label: 'Payments', desc: 'Verify UPI payments', color: 'gold' },
];

const Dashboard = () => {
    const [recent, setRecent] = useState([]);
    const [stats, setStats] = useState({ adventures: 0, active: 0, posts: 0, published: 0, newMessages: 0, pendingPayments: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [advRes, postsRes, msgsRes, paymentsRes] = await Promise.allSettled([
                    adventuresAPI.getAll({}),
                    blogAdminAPI.getAll(),
                    contactAdminAPI.getAll(),
                    paymentsAdminAPI.getPending(),
                ]);

                const adventures = advRes.status === 'fulfilled' ? (advRes.value.data?.data || advRes.value.data || []) : [];
                const posts = postsRes.status === 'fulfilled' ? (postsRes.value.data?.data || []) : [];
                const messages = msgsRes.status === 'fulfilled' ? (msgsRes.value.data?.data || []) : [];
                const pendingPayments = paymentsRes.status === 'fulfilled' ? (paymentsRes.value.data?.data || []).length : 0;

                setRecent(adventures.slice(0, 5));
                setStats({
                    adventures: adventures.length,
                    active: adventures.filter((a) => a.status === 'active').length,
                    posts: posts.length,
                    published: posts.filter((p) => p.published).length,
                    newMessages: messages.filter((m) => m.status === 'new').length,
                    pendingPayments,
                });
            } catch (error) {
                toast.error('Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Manage your adventure content</p>
                </div>
                <Link to="/adventures/add" className="btn-primary">
                    <Plus size={18} />
                    New Adventure
                </Link>
            </div>

            {/* Stats row */}
            {!loading && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                    style={{ marginBottom: 28 }}
                >
                    {[
                        { label: 'Active adventures', value: stats.active, sub: `${stats.adventures} total`, to: '/adventures' },
                        { label: 'Published stories', value: stats.published, sub: `${stats.posts} total`, to: '/blog' },
                        { label: 'New messages', value: stats.newMessages, sub: 'awaiting reply', to: '/messages', highlight: stats.newMessages > 0 },
                        { label: 'Pending payments', value: stats.pendingPayments, sub: 'need verification', to: '/payments', highlight: stats.pendingPayments > 0 },
                    ].map((s) => (
                        <Link
                            key={s.label}
                            to={s.to}
                            className="bg-white rounded-xl border p-5 hover:shadow-[var(--shadow-md)] transition-shadow"
                            style={{ borderColor: s.highlight ? 'var(--primary)' : 'var(--border-color)' }}
                        >
                            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: s.highlight ? 'var(--primary-dark)' : 'var(--text-main)' }}>
                                {s.value}
                            </p>
                            <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-main)' }}>{s.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>{s.sub}</p>
                        </Link>
                    ))}
                </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
                className="quick-actions-grid"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {quickActions.map((action) => (
                    <motion.div key={action.to} variants={item}>
                        <Link to={action.to} className={`quick-action-card ${action.color}`}>
                            <div className="quick-action-icon">
                                <action.icon size={24} />
                            </div>
                            <div className="quick-action-content">
                                <h3>{action.label}</h3>
                                <p>{action.desc}</p>
                            </div>
                            <ArrowRight size={18} className="quick-action-arrow" />
                        </Link>
                    </motion.div>
                ))}
            </motion.div>

            {/* Recent Adventures */}
            <div className="recent-section">
                <div className="recent-header">
                    <h2>
                        <Sparkles size={20} />
                        Recent Adventures
                    </h2>
                    <Link to="/adventures" className="view-all">
                        View All <ArrowRight size={14} />
                    </Link>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                    </div>
                ) : recent.length === 0 ? (
                    <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                        <Compass size={48} />
                        <h3>No adventures yet</h3>
                        <p>Create your first adventure package to get started</p>
                        <Link to="/adventures/add" className="btn-primary" style={{ marginTop: '0.5rem' }}>
                            <Plus size={18} />
                            Add Adventure
                        </Link>
                    </div>
                ) : (
                    <div className="recent-list">
                        {recent.map((adv) => (
                            <Link
                                key={adv._id}
                                to={`/adventures/edit/${adv._id}`}
                                className="recent-row"
                            >
                                <div className="recent-img">
                                    <img
                                        src={adv.image_url || 'https://via.placeholder.com/60x60'}
                                        alt={adv.title}
                                    />
                                </div>
                                <div className="recent-info">
                                    <span className="recent-title">{adv.title}</span>
                                    <span className="recent-meta">
                                        <MapPin size={12} />
                                        {adv.location || 'No location'}
                                        {adv.duration && (
                                            <>
                                                <span className="dot">·</span>
                                                <Clock size={12} />
                                                {adv.duration}
                                            </>
                                        )}
                                    </span>
                                </div>
                                <div className="recent-badges">
                                    {adv.category && (
                                        <span className="badge badge-orange">{adv.category}</span>
                                    )}
                                    <span className={`badge ${adv.status === 'active' ? 'badge-green' : adv.status === 'inactive' ? 'badge-red' : 'badge-yellow'}`}>
                                        {adv.status || 'draft'}
                                    </span>
                                </div>
                                <ArrowRight size={16} className="recent-arrow" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
