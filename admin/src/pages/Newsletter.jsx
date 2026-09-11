import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Users } from 'lucide-react';
import { newsletterAdminAPI } from '../utils/api';

const Newsletter = () => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [subject, setSubject] = useState('New dates from Phoenix Adventures');
    const [body, setBody] = useState('<p>We just opened new departure dates. Book early — seats go fast.</p>');
    const [sending, setSending] = useState(false);

    const sendBlast = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await newsletterAdminAPI.blast({ subject, body });
            toast.success('Newsletter queued');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Send failed');
        } finally {
            setSending(false);
        }
    };

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

            <form onSubmit={sendBlast} className="panel" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Send “new dates” email</h3>
                <label className="form-label" htmlFor="nl-subject">Subject</label>
                <input id="nl-subject" className="form-input" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                <label className="form-label" htmlFor="nl-body" style={{ marginTop: '0.75rem' }}>HTML body</label>
                <textarea id="nl-body" className="form-input" rows={5} value={body} onChange={(e) => setBody(e.target.value)} required />
                <button type="submit" className="btn-primary" style={{ marginTop: '0.75rem' }} disabled={sending}>
                    {sending ? 'Queuing…' : `Email ${activeCount} subscribers`}
                </button>
            </form>

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
