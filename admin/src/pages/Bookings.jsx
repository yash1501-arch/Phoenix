import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
    Search,
    Filter,
    Calendar,
    Users,
    Download,
    CheckCircle,
    XCircle,
    CheckSquare,
    Square,
    Clock,
    Eye,
    MapPin
} from 'lucide-react';
import { bookingsAPI } from '../utils/api';
import { exportRows } from '../utils/csv';
import { motion } from 'framer-motion';
import './Bookings.css';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'cancelled', 'completed'];

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState(new Set());
    const [bulkUpdating, setBulkUpdating] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            const response = await bookingsAPI.getAll(params);
            setBookings(response.data.data);
            setSelected(new Set());
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        if (!window.confirm(`Are you sure you want to update status to ${newStatus}?`)) return;
        try {
            await bookingsAPI.updateStatus(id, newStatus);
            setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: newStatus } : b)));
            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleBulkStatus = async (newStatus) => {
        if (selected.size === 0) return;
        if (!window.confirm(`Update ${selected.size} bookings to "${newStatus}"?`)) return;
        setBulkUpdating(true);
        const tid = toast.loading(`Updating ${selected.size} bookings…`);
        let succeeded = 0;
        for (const id of selected) {
            try {
                await bookingsAPI.updateStatus(id, newStatus);
                succeeded++;
            } catch { /* continue */ }
        }
        setBulkUpdating(false);
        setSelected(new Set());
        toast.success(`${succeeded} of ${selected.size} updated`, { id: tid });
        fetchBookings();
    };

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === filteredBookings.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filteredBookings.map((b) => b._id)));
        }
    };

    const filteredBookings = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return bookings.filter((booking) => {
            const user = booking.user || booking.profiles;
            return (
                user?.name?.toLowerCase().includes(lower) ||
                user?.email?.toLowerCase().includes(lower) ||
                booking.adventures?.title?.toLowerCase().includes(lower) ||
                booking._id?.toLowerCase().includes(lower)
            );
        });
    }, [bookings, searchTerm]);

    const onExport = () => {
        const cols = [
            { label: 'Booking ID', key: '_id' },
            { label: 'Customer Name', value: (r) => r.user?.name || r.profiles?.name || '' },
            { label: 'Customer Email', value: (r) => r.user?.email || r.profiles?.email || '' },
            { label: 'Adventure', value: (r) => r.adventures?.title || '' },
            { label: 'Location', value: (r) => r.adventures?.location || '' },
            { label: 'Booking Date', key: 'booking_date' },
            { label: 'Participants', key: 'participants' },
            { label: 'Total Amount', key: 'total_amount' },
            { label: 'Advance Paid', key: 'advance_paid' },
            { label: 'Status', key: 'status' },
            { label: 'ID Type', key: 'id_type' },
            { label: 'Created', key: 'created_at' },
        ];
        exportRows(filteredBookings, cols, 'bookings');
        toast.success(`Exported ${filteredBookings.length} bookings`);
    };

    return (
        <div className="bookings-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Bookings</h1>
                    <p className="page-subtitle">Manage customer reservations</p>
                </div>
                <button onClick={onExport} className="btn-secondary" disabled={filteredBookings.length === 0}>
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="search-box">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search by customer, adventure, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filters">
                    <div className="filter-group">
                        <Filter size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bulk-bar"
                >
                    <span className="bulk-bar__count">{selected.size} selected</span>
                    <div className="bulk-bar__actions">
                        <button onClick={() => handleBulkStatus('confirmed')} disabled={bulkUpdating} className="bulk-btn bulk-btn--confirm">
                            <CheckCircle size={14} /> Confirm
                        </button>
                        <button onClick={() => handleBulkStatus('cancelled')} disabled={bulkUpdating} className="bulk-btn bulk-btn--cancel">
                            <XCircle size={14} /> Cancel
                        </button>
                        <button onClick={() => handleBulkStatus('completed')} disabled={bulkUpdating} className="bulk-btn bulk-btn--complete">
                            <CheckCircle size={14} /> Complete
                        </button>
                        <button onClick={() => setSelected(new Set())} className="bulk-btn">Clear</button>
                    </div>
                </motion.div>
            )}

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading bookings...</p>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="empty-state">
                    <Calendar size={48} />
                    <h3>No bookings found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            ) : (
                <div className="bookings-table-wrapper">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>
                                    <button
                                        onClick={toggleSelectAll}
                                        aria-label={selected.size === filteredBookings.length ? 'Deselect all' : 'Select all'}
                                        className="select-checkbox"
                                    >
                                        {selected.size === filteredBookings.length ? (
                                            <CheckSquare size={18} />
                                        ) : (
                                            <Square size={18} />
                                        )}
                                    </button>
                                </th>
                                <th>Booking ID</th>
                                <th>Customer</th>
                                <th>Adventure</th>
                                <th>Date & Participants</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map((booking, index) => {
                                const user = booking.user || booking.profiles;
                                return (
                                    <motion.tr
                                        key={booking._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className={selected.has(booking._id) ? 'is-selected' : ''}
                                    >
                                        <td>
                                            <button
                                                onClick={() => toggleSelect(booking._id)}
                                                aria-label="Select booking"
                                                className="select-checkbox"
                                            >
                                                {selected.has(booking._id) ? (
                                                    <CheckSquare size={18} />
                                                ) : (
                                                    <Square size={18} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="booking-id">
                                            #{(booking._id || '').slice(0, 8)}
                                        </td>
                                        <td>
                                            <div className="customer-cell">
                                                <div className="customer-avatar">
                                                    {user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="customer-name">
                                                        {user?.name || 'Unknown'}
                                                    </div>
                                                    <div className="customer-email">
                                                        {user?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="adventure-name">
                                                {booking.adventures?.title}
                                            </div>
                                            <div className="adventure-location">
                                                <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                                                {booking.adventures?.location}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="booking-date">
                                                <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                                                {new Date(booking.booking_date).toLocaleDateString()}
                                            </div>
                                            <div className="participants">
                                                <Users size={14} style={{ display: 'inline', marginRight: 4 }} />
                                                {booking.participants} People
                                            </div>
                                        </td>
                                        <td className="amount">
                                            ₹{booking.total_amount?.toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${booking.status.toLowerCase()}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                {booking.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                                            className="action-btn confirm"
                                                            title="Confirm"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                                                            className="action-btn cancel"
                                                            title="Cancel"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {booking.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking._id, 'completed')}
                                                        className="action-btn complete"
                                                        title="Mark as Completed"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                <button className="action-btn view" title="View Details">
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Bookings;
