import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ScrollText } from 'lucide-react';
import { auditAdminAPI } from '../utils/api';

const AuditLog = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [actorFilter, setActorFilter] = useState('');
    const [codeFilter, setCodeFilter] = useState('');
    const [actorQuery, setActorQuery] = useState('');
    const [codeQuery, setCodeQuery] = useState('');

    const load = async () => {
        try {
            const params = {};
            if (actionFilter) params.action = actionFilter;
            if (actorQuery.trim()) params.actor = actorQuery.trim();
            if (codeQuery.trim()) params.booking_code = codeQuery.trim();
            const res = await auditAdminAPI.getAll(params);
            setEntries(res.data?.data || []);
        } catch {
            toast.error('Failed to load audit log');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actionFilter, actorQuery, codeQuery]);

    const actions = [...new Set(entries.map((e) => e.action).filter(Boolean))].sort();

    return (
        <div className="messages-page">
            <div className="page-header">
                <p className="page-subtitle" style={{ marginTop: 0 }}>
                    System audit trail — admin actions and key events
                </p>
            </div>

            <div className="settings-inline-row" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <label className="form-label" htmlFor="audit-filter">Filter by action</label>
                <select
                    id="audit-filter"
                    className="form-input"
                    value={actionFilter}
                    onChange={(e) => { setLoading(true); setActionFilter(e.target.value); }}
                    style={{ maxWidth: '280px' }}
                >
                    <option value="">All actions</option>
                    {actions.map((a) => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
                <input
                    className="form-input"
                    placeholder="Actor email"
                    value={actorFilter}
                    onChange={(e) => setActorFilter(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setLoading(true); setActorQuery(actorFilter); } }}
                    style={{ maxWidth: '200px' }}
                />
                <input
                    className="form-input"
                    placeholder="Booking code"
                    value={codeFilter}
                    onChange={(e) => setCodeFilter(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setLoading(true); setCodeQuery(codeFilter); } }}
                    style={{ maxWidth: '180px' }}
                />
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setLoading(true); setActorQuery(actorFilter); setCodeQuery(codeFilter); }}
                >
                    Apply
                </button>
            </div>

            {loading ? (
                <div className="loading-state"><div className="spinner" /></div>
            ) : entries.length === 0 ? (
                <div className="empty-state">
                    <ScrollText size={32} />
                    <p>No audit entries found</p>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Action</th>
                                <th>Actor</th>
                                <th>Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr key={entry._id}>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        {entry.created_at ? new Date(entry.created_at).toLocaleString() : '—'}
                                    </td>
                                    <td><code>{entry.action}</code></td>
                                    <td>{entry.actor_email || entry.actor_id || '—'}</td>
                                    <td>
                                        {entry.target_type && entry.target_id
                                            ? `${entry.target_type}:${entry.target_id}`
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AuditLog;
