import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Star, Trash2, CheckCircle } from 'lucide-react';
import { adventuresAPI, reviewsAPI } from '../utils/api';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [adventures, setAdventures] = useState([]);
    const [filter, setFilter] = useState({ approved: 'all', adventure: 'all' });
    const [loading, setLoading] = useState(true);

    const fetchAdventures = async () => {
        try {
            const res = await adventuresAPI.getAll({ limit: 200 });
            const data = res.data?.data || res.data || [];
            setAdventures(Array.isArray(data) ? data : []);
        } catch { /* ignore */ }
    };

    const fetchAllReviews = async () => {
        try {
            const list = adventures.length > 0 ? adventures : await adventuresAPI.getAll({ limit: 200 }).then((r) => r.data?.data || []);
            // Parallelize per-adventure requests (no more sequential N+1)
            const results = await Promise.allSettled(
                list.map((adv) =>
                    reviewsAPI.getForAdventure(adv.id || adv._id, { approved_only: false, limit: 100 })
                        .then((res) => ({ adv, data: Array.isArray(res.data?.data) ? res.data.data : [] }))
                )
            );
            const all = [];
            for (const r of results) {
                if (r.status === 'fulfilled') {
                    const { adv, data } = r.value;
                    data.forEach((rev) => all.push({ ...rev, adventureTitle: adv.title }));
                }
            }
            all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setReviews(all);
        } catch {
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdventures();
    }, []);

    useEffect(() => {
        if (adventures.length > 0) fetchAllReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adventures.length]);

    const onApprove = async (id) => {
        const tid = toast.loading('Approving…');
        try {
            await reviewsAPI.approve(id);
            setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, approved: true } : r)));
            toast.success('Review approved', { id: tid });
        } catch {
            toast.error('Failed to approve', { id: tid });
        }
    };

    const onDelete = async (id) => {
        if (!window.confirm('Delete this review?')) return;
        const tid = toast.loading('Deleting…');
        try {
            await reviewsAPI.delete(id);
            setReviews((prev) => prev.filter((r) => r._id !== id));
            toast.success('Deleted', { id: tid });
        } catch {
            toast.error('Failed to delete', { id: tid });
        }
    };

    const filtered = reviews.filter((r) => {
        if (filter.approved === 'yes' && !r.approved) return false;
        if (filter.approved === 'no' && r.approved) return false;
        // Normalize IDs for comparison (handle both string and ObjectId-style)
        if (filter.adventure !== 'all' && String(r.adventure_id) !== String(filter.adventure)) return false;
        return true;
    });

    return (
        <div className="adventures-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reviews</h1>
                    <p className="page-subtitle">Moderate user reviews</p>
                </div>
            </div>

            <div className="filters-section" style={{ marginBottom: 16 }}>
                <select value={filter.approved} onChange={(e) => setFilter((f) => ({ ...f, approved: e.target.value }))} className="filter-select">
                    <option value="all">All reviews</option>
                    <option value="yes">Approved only</option>
                    <option value="no">Pending only</option>
                </select>
                <select value={filter.adventure} onChange={(e) => setFilter((f) => ({ ...f, adventure: e.target.value }))} className="filter-select">
                    <option value="all">All adventures</option>
                    {adventures.map((a) => (
                        <option key={a.id || a._id} value={a.id || a._id}>{a.title}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="loading-state" style={{ height: '40vh' }}><div className="spinner"></div></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <Star size={48} />
                    <h3>No reviews yet</h3>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((r) => (
                        <div key={r._id} className="bg-white rounded-2xl border border-gray-200 p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-gray-900">{r.user_name || 'Anonymous'}</p>
                                        <span className={`status-badge ${r.approved ? 'confirmed' : 'pending'}`}>
                                            {r.approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">
                                        {r.adventureTitle} · {new Date(r.created_at).toLocaleDateString()}
                                    </p>
                                    <div className="flex text-[#D4AF37] mb-2">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <Star key={n} size={14} className={n <= r.rating ? 'fill-current' : 'text-gray-300'} />
                                        ))}
                                    </div>
                                    {r.title && <p className="font-bold text-gray-900 mb-1">{r.title}</p>}
                                    {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
                                </div>
                                <div className="flex gap-2">
                                    {!r.approved && (
                                        <button onClick={() => onApprove(r._id)} className="action-btn confirm" title="Approve">
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => onDelete(r._id)} className="action-btn cancel" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reviews;
