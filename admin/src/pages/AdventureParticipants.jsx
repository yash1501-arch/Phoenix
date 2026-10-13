import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Download } from 'lucide-react';
import { bookingsAdminAPI } from '../utils/api';
import './Adventures.css';

function todayInIndia() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = String(iso).split('-').map(Number);
    if (!y || !m || !d) return iso;
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

const COLUMNS = [
    ['#', 'serial'],
    ['Name', 'name'],
    ['Contact no', 'contact_no'],
    ['Emergency contact no', 'emergency_contact_no'],
    ['Pickup stop', 'pickup_stop'],
    ['Payment', 'payment'],
    ['Meal preference', 'meal_preference'],
    ['Booked by', 'booked_by'],
];

const AdventureParticipants = () => {
    const { id } = useParams();
    const [meta, setMeta] = useState(null);
    const [dates, setDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [rows, setRows] = useState([]);
    const [bookingCount, setBookingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const today = todayInIndia();

    const load = async (date) => {
        setLoading(true);
        try {
            const res = await bookingsAdminAPI.getRoster(id, date);
            const data = res.data?.data || {};
            setMeta(data.adventure || null);
            setDates(Array.isArray(data.dates) ? data.dates : []);
            setRows(Array.isArray(data.rows) ? data.rows : []);
            setBookingCount(Number(data.booking_count) || 0);
            if (date) setSelectedDate(date);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not load participants');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load('');
    }, [id]);

    const { upcoming, past } = useMemo(() => {
        const upcomingRows = [];
        const pastRows = [];
        [...dates].sort((a, b) => String(a.date).localeCompare(String(b.date))).forEach((row) => {
            if (row.date < today) pastRows.push(row);
            else upcomingRows.push(row);
        });
        pastRows.reverse();
        return { upcoming: upcomingRows, past: pastRows };
    }, [dates, today]);

    const download = async () => {
        if (!selectedDate) {
            toast.error('Choose a departure date first');
            return;
        }
        setExporting(true);
        try {
            const res = await bookingsAdminAPI.downloadRoster(id, selectedDate);
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const slug = String(meta?.title || 'adventure').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            a.href = url;
            a.download = `participants-${slug || 'adventure'}-${selectedDate}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success('Booking sheet downloaded');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not download the sheet');
        } finally {
            setExporting(false);
        }
    };

    const renderChips = (list) => (
        <div className="date-chips">
            {list.map((row) => (
                <button
                    key={row.date}
                    type="button"
                    className={`date-chip${selectedDate === row.date ? ' active' : ''}`}
                    onClick={() => load(row.date)}
                >
                    {formatDate(row.date)} · {row.confirmed_bookings || 0} {Number(row.confirmed_bookings) === 1 ? 'booking' : 'bookings'}
                </button>
            ))}
        </div>
    );

    return (
        <div className="adventures-page">
            <div className="page-header">
                <div>
                    <Link to="/adventures" className="btn-secondary" style={{ marginBottom: '0.75rem' }}>
                        <ArrowLeft size={16} /> Adventures
                    </Link>
                    <p className="page-subtitle" style={{ marginTop: 0 }}>
                        {meta?.title || 'Adventure'}
                        {meta?.location ? ` · ${meta.location}` : ''}
                    </p>
                </div>
                <div className="page-actions">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={download}
                        disabled={!selectedDate || exporting}
                    >
                        <Download size={16} /> {exporting ? 'Preparing…' : 'Export bookings'}
                    </button>
                </div>
            </div>

            {loading && !meta ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading departures…</p>
                </div>
            ) : (
                <>
                    <div className="date-groups">
                        <div className="date-group">
                            <h3>Upcoming and today</h3>
                            {upcoming.length ? renderChips(upcoming) : <p className="roster-summary">No upcoming dates.</p>}
                        </div>
                        <div className="date-group">
                            <h3>Past departures</h3>
                            {past.length ? renderChips(past) : <p className="roster-summary">No past departures yet.</p>}
                        </div>
                    </div>

                    <div className="participant-toolbar">
                        <label>
                            Departure date
                            <select
                                value={selectedDate}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setSelectedDate(next);
                                    if (next) load(next);
                                }}
                            >
                                <option value="">Select a date</option>
                                {dates.map((row) => (
                                    <option key={row.date} value={row.date}>
                                        {formatDate(row.date)} ({row.confirmed_bookings || 0} {Number(row.confirmed_bookings) === 1 ? 'booking' : 'bookings'})
                                        {row.date < today ? ' — past' : ''}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {!selectedDate ? (
                        <div className="empty-state">
                            <h3>Choose a date</h3>
                            <p>Pick a departure to see who is confirmed, then export the sheet.</p>
                        </div>
                    ) : loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading participants…</p>
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="empty-state">
                            <h3>No confirmed bookings</h3>
                            <p>{formatDate(selectedDate)} has no confirmed participants yet. You can still download an empty sheet.</p>
                        </div>
                    ) : (
                        <>
                            <p className="roster-summary">
                                {formatDate(selectedDate)} · {bookingCount} booking{bookingCount === 1 ? '' : 's'} · {rows.length} participant{rows.length === 1 ? '' : 's'}
                            </p>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            {COLUMNS.map(([label]) => <th key={label}>{label}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => (
                                            <tr key={`${row.booking_code}-${row.serial}`}>
                                                {COLUMNS.map(([label, key]) => (
                                                    <td key={label} data-label={label}>{row[key] || '—'}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default AdventureParticipants;
