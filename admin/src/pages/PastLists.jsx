import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, Eye, Search } from 'lucide-react';
import { adventuresAPI, bookingsAdminAPI } from '../utils/api';
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

const PastLists = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyKey, setBusyKey] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await adventuresAPI.getAll();
                const adventures = Array.isArray(res.data?.data) ? res.data.data : [];
                const today = todayInIndia();
                const lists = await Promise.all(adventures.map(async (adv) => {
                    const id = adv._id || adv.id;
                    const roster = await bookingsAdminAPI.getRoster(id);
                    const dates = roster.data?.data?.dates || [];
                    return dates
                        .filter((row) => row.date < today && Number(row.confirmed_bookings) > 0)
                        .map((row) => ({
                            adventureId: id,
                            title: adv.title || 'Adventure',
                            location: adv.location || '',
                            ...row,
                        }));
                }));
                if (!cancelled) {
                    const flat = lists.flat().sort((a, b) => String(b.date).localeCompare(String(a.date)));
                    setRows(flat);
                }
            } catch (error) {
                if (!cancelled) toast.error(error.response?.data?.message || 'Could not load past lists');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter((row) => {
            const when = formatDate(row.date).toLowerCase();
            return (
                String(row.title || '').toLowerCase().includes(term)
                || String(row.location || '').toLowerCase().includes(term)
                || String(row.date || '').includes(term)
                || when.includes(term)
            );
        });
    }, [rows, search]);

    const download = async (row) => {
        const key = `${row.adventureId}-${row.date}`;
        setBusyKey(key);
        try {
            const res = await bookingsAdminAPI.downloadRoster(row.adventureId, row.date);
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const slug = String(row.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            a.href = url;
            a.download = `past-${slug || 'adventure'}-${row.date}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success('Past list downloaded');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not download the sheet');
        } finally {
            setBusyKey('');
        }
    };

    return (
        <div className="adventures-page">
            <div className="page-header">
                <div>
                    <p className="page-subtitle" style={{ marginTop: 0 }}>
                        Finished departures only. Current events stay on Adventures.
                    </p>
                </div>
                <div className="page-actions">
                    <Link to="/adventures" className="btn-secondary">Current events</Link>
                </div>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <Search className="search-icon" size={18} />
                    <input
                        type="search"
                        className="search-input"
                        placeholder="Search adventure, place, or date"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search past lists"
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading past departures…</p>
                </div>
            ) : rows.length === 0 ? (
                <div className="empty-state">
                    <h3>No past participant lists</h3>
                    <p>When a departure date has passed, its guest list shows up here.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <h3>No matches</h3>
                    <p>Nothing in the past lists matches “{search.trim()}”.</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Adventure</th>
                                <th>Date</th>
                                <th>Bookings</th>
                                <th>People</th>
                                <th className="th-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row) => {
                                const key = `${row.adventureId}-${row.date}`;
                                return (
                                    <tr key={key}>
                                        <td data-label="Adventure">
                                            <span className="cell-name">{row.title}</span>
                                            {row.location ? <span className="cell-meta">{row.location}</span> : null}
                                        </td>
                                        <td data-label="Date">{formatDate(row.date)}</td>
                                        <td data-label="Bookings">{row.confirmed_bookings || 0}</td>
                                        <td data-label="People">{row.confirmed_seats || 0}</td>
                                        <td className="td-actions" data-label="Actions">
                                            <div className="row-actions">
                                                <Link
                                                    className="btn-icon"
                                                    title="View this past list"
                                                    aria-label={`View ${row.title} on ${formatDate(row.date)}`}
                                                    to={`/adventures/${row.adventureId}/participants?scope=past&date=${row.date}`}
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="btn-icon"
                                                    title="Download this past list"
                                                    aria-label={`Download ${row.title} on ${formatDate(row.date)}`}
                                                    onClick={() => download(row)}
                                                    disabled={busyKey === key}
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="table-footer">
                        <span className="table-count">{filtered.length} past departure{filtered.length === 1 ? '' : 's'}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PastLists;
