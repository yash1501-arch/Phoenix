import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const StarPicker = ({ value, onChange }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
            <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className="rounded p-1 transition-transform hover:scale-110"
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
                <Star
                    size={28}
                    className={n <= value ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'}
                />
            </button>
        ))}
    </div>
);

const ReviewForm = ({ adventureId, bookingId, onClose, onSubmitted }) => {
    const { user, isAuthenticated } = useAuth();
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isAuthenticated) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Please log in to leave a review.
            </div>
        );
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return toast.error('Please share your experience');
        setSubmitting(true);
        const tid = toast.loading('Submitting…');
        try {
            await api.post('/reviews', {
                user_id: user.id,
                adventure_id: adventureId,
                booking_id: bookingId,
                rating,
                title: title.trim(),
                comment: comment.trim(),
            });
            toast.success('Review submitted for moderation!', { id: tid });
            onSubmitted?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit', { id: tid });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#FFFDF8] to-white p-5"
        >
            <div>
                <p className="mb-2 text-sm font-bold text-gray-700">Your rating</p>
                <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700">Title (optional)</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={80}
                    placeholder="Summarise your experience"
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#D4AF37] focus:outline-none"
                />
            </div>
            <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700">Your review</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    required
                    maxLength={1000}
                    placeholder="What did you love? What could be better?"
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#D4AF37] focus:outline-none"
                />
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-bold text-gray-600 hover:border-gray-300">
                    Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] py-2.5 text-sm font-bold text-white disabled:opacity-60">
                    <Send size={14} /> {submitting ? 'Submitting…' : 'Submit review'}
                </button>
            </div>
        </motion.form>
    );
};

const ReviewList = ({ reviews, summary }) => {
    if (!reviews.length) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <p className="text-sm font-semibold text-gray-700">No reviews yet</p>
                <p className="mt-1 text-xs text-gray-500">Be the first to share your experience on this adventure.</p>
            </div>
        );
    }
    return (
        <div className="space-y-4">
            {summary && (
                <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#FFFDF8] to-white p-5">
                    <div className="text-center">
                        <p className="text-4xl font-extrabold text-[#B8860B]">{summary.average || '—'}</p>
                        <div className="mt-1 flex justify-center text-[#D4AF37]">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <Star key={n} size={14} className={n <= Math.round(summary.average) ? 'fill-current' : 'text-gray-300'} />
                            ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{summary.count} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-[180px]">
                        {[5, 4, 3, 2, 1].map((n) => {
                            const count = summary.breakdown?.[n] || 0;
                            const pct = summary.count > 0 ? (count / summary.count) * 100 : 0;
                            return (
                                <div key={n} className="flex items-center gap-2 text-xs">
                                    <span className="w-4 text-gray-500">{n}</span>
                                    <Star size={11} className="fill-[#D4AF37] text-[#D4AF37]" />
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                                        <div className="h-full bg-[#D4AF37]" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="w-8 text-right text-gray-500">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            <div className="space-y-3">
                {reviews.map((r) => (
                    <article key={r._id || r.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-sm font-bold text-white">
                                    {(r.user_name || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{r.user_name || 'Anonymous'}</p>
                                    <p className="text-[11px] text-gray-500">{new Date(r.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                                </div>
                            </div>
                            <div className="flex text-[#D4AF37]">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <Star key={n} size={14} className={n <= r.rating ? 'fill-current' : 'text-gray-300'} />
                                ))}
                            </div>
                        </div>
                        {r.title && <p className="mt-3 text-sm font-bold text-gray-900">{r.title}</p>}
                        {r.comment && <p className="mt-1 text-sm leading-relaxed text-gray-600">{r.comment}</p>}
                    </article>
                ))}
            </div>
        </div>
    );
};

const Reviews = ({ adventureId, bookingId }) => {
    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const load = () => {
        api.get(`/reviews/adventure/${adventureId}`).then((r) => setReviews(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {});
        api.get(`/reviews/summary/${adventureId}`).then((r) => setSummary(r.data?.data || null)).catch(() => {});
    };

    useEffect(() => {
        load();
    }, [adventureId]);

    return (
        <section>
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900">Reviews & Ratings</h2>
                <button
                    onClick={() => setShowForm((s) => !s)}
                    className="rounded-xl border-2 border-[#D4AF37] px-4 py-2 text-sm font-bold text-[#B8860B] hover:bg-[#D4AF37] hover:text-white"
                >
                    {showForm ? 'Close' : 'Write a review'}
                </button>
            </div>
            <AnimatePresence>
                {showForm && (
                    <div className="mb-5">
                        <ReviewForm
                            adventureId={adventureId}
                            bookingId={bookingId}
                            onClose={() => setShowForm(false)}
                            onSubmitted={load}
                        />
                    </div>
                )}
            </AnimatePresence>
            <ReviewList reviews={reviews} summary={summary} />
        </section>
    );
};

export default Reviews;
