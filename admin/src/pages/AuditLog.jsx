import { useEffect, useState } from 'react';
import { Activity, Filter } from 'lucide-react';
import { auditAPI } from '../utils/api';
import { motion } from 'framer-motion';

const AuditLog = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        auditAPI.getAll({ limit: 200 })
            .then((res) => setEntries(Array.isArray(res.data?.data) ? res.data.data : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = entries.filter((e) =>
        !filter || (e.action || '').toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="adventures-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <Activity size={28} className="inline mr-2" />
                        Audit Log
                    </h1>
                    <p className="page-subtitle">All admin actions and system events</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-500" />
                    <input
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Filter by action…"
                        className="filter-select"
                        style={{ minWidth: 220 }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state" style={{ height: '40vh' }}><div className="spinner"></div></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <Activity size={48} />
                    <h3>No audit entries</h3>
                </div>
            ) : (
                <div className="grid gap-2">
                    {filtered.map((e, i) => (
                        <motion.div
                            key={e._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3"
                        >
                            <span className="text-xs font-mono text-gray-400">
                                {new Date(e.created_at).toLocaleString()}
                            </span>
                            <span className="text-sm font-bold text-[#B8860B]">{e.action}</span>
                            {e.actor_email && <span className="text-xs text-gray-500">by {e.actor_email}</span>}
                            {e.target_type && (
                                <span className="text-xs text-gray-700">
                                    → {e.target_type}:{e.target_id?.slice(0, 8)}
                                </span>
                            )}
                            {e.metadata && Object.keys(e.metadata).length > 0 && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                    {JSON.stringify(e.metadata).slice(0, 80)}
                                </span>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AuditLog;
