import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Users } from 'lucide-react';
import { newsletterAdminAPI } from '../utils/api';

const Newsletter = () => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await newsletterAdminAPI.getAll();
                setSubscribers(res.data?.data || []);
            } catch {
                toast.error('Failed to load subscribers');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = subscribers.filter((s) => filter === 'all' || s.status === filter);
    const activeCount = subscribers.filter((s) => s.status === 'subscribed').length;

    return (
        <div className="messages-page">
            <div className="page-header">
                <p className="page-subtitle" style={{ marginTop: 0 }}>
                    Newsletter subscribers
                    <span className="badge badge-yellow" style={{ marginLeft: '0.5rem' }}>{activeCount} active</span>
                </p>
            </div>

            <div className="tab-bar message-filters" role="tablist">
                {['all', 'subscribed', 'unsubscribed'].map((f) => (
                    <button
                        key={f}
                        type="button"
                        role="tab"
                        aria-selected={filter === f}
                        onClick={() => setFilter(f)}
                        className={`tab-btn ${filter === f ? 'is-active' : ''}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-state"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <Users size={32} />
                    <p>No subscribers found</p>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Subscribed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((sub) => (
                                <tr key={sub._id}>
                                    <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Mail size={14} />
                                            {sub.email}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${sub.status === 'subscribed' ? 'active' : 'cancelled'}`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td>{sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Newsletter;
