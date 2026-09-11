import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Plus, Search, Edit, Trash2,
    MapPin, Clock, Users as UsersIcon,
    Mountain, Download, Filter, ChevronDown, FileText
} from 'lucide-react';
import { adventuresAPI, getImageUrl } from '../utils/api';
import { exportRows } from '../utils/csv';
import { downloadItineraryPdf } from '../utils/downloadItineraryPdf';
import { useAuth } from '../context/AuthContext';
import './Adventures.css';

const catColors = {
    trek: 'badge-orange',
    camping: 'badge-green',
    tour: 'badge-blue',
    general: 'badge-purple',
};

const Adventures = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [adventures, setAdventures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        fetchAdventures();
    }, [filterStatus, filterDifficulty, filterCategory]);

    const fetchAdventures = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterStatus !== 'all') params.status = filterStatus;
            if (filterDifficulty !== 'all') params.difficulty = filterDifficulty;
            if (filterCategory !== 'all') params.category = filterCategory;

            const response = await adventuresAPI.getAll(params);
            const data = response.data;
            setAdventures(Array.isArray(data) ? data : (data?.data || []));
        } catch (error) {
            console.error('Error fetching adventures:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this adventure?')) return;
        try {
            await adventuresAPI.delete(id);
            toast.success('Adventure deleted');
            fetchAdventures();
        } catch (error) {
            toast.error('Failed to delete adventure');
        }
    };

    const handleDownloadItinerary = async (adv) => {
        const tid = toast.loading('Preparing itinerary PDF…');
        try {
            await downloadItineraryPdf(adv._id || adv.id, adv.title);
            toast.success('Itinerary PDF downloaded', { id: tid });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Could not download itinerary PDF', { id: tid });
        }
    };

    const onExport = () => {
        const cols = [
            { label: 'ID', key: '_id' },
            { label: 'Title', key: 'title' },
            { label: 'Category', key: 'category' },
            { label: 'Location', key: 'location' },
            { label: 'Price', key: 'price' },
            { label: 'Duration', key: 'duration' },
            { label: 'Difficulty', key: 'difficulty' },
            { label: 'Status', key: 'status' },
            { label: 'Max Participants', key: 'max_participants' },
            { label: 'Created', key: 'created_at' },
        ];
        exportRows(filteredAdventures, cols, 'adventures');
        toast.success(`Exported ${filteredAdventures.length} adventures`);
    };

    const filteredAdventures = adventures.filter(adventure => {
        const term = searchTerm.toLowerCase();
        return (
            (adventure.title || '').toLowerCase().includes(term) ||
            (adventure.location || '').toLowerCase().includes(term)
        );
    });

    return (
        <div className="adventures-page">
            <div className="page-header">
                <div>
                    <p className="page-subtitle" style={{ marginTop: 0 }}>Manage trek packages, dates, and brochure content</p>
                </div>
                <div className="page-actions">
                    <button onClick={onExport} className="btn-secondary" disabled={filteredAdventures.length === 0}>
                        <Download size={16} /> Export
                    </button>
                    {isAdmin && (
                    <Link to="/adventures/add" className="btn-primary">
                        <Plus size={18} />
                        Add Adventure
                    </Link>
                    )}
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search by title or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-select-group">
                    <Filter size={16} />
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="all">All Categories</option>
                        <option value="trek">Trek</option>
                        <option value="camping">Camping</option>
                        <option value="tour">Tour</option>
                        <option value="general">General</option>
                    </select>
                </div>

                <div className="filter-select-group">
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>

                <div className="filter-select-group">
                    <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
                        <option value="all">All Difficulty</option>
                        <option value="Easy">Easy</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Challenging">Challenging</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading adventures...</p>
                </div>
            ) : filteredAdventures.length === 0 ? (
                <div className="empty-state">
                    <Mountain size={56} />
                    <h3>No adventures found</h3>
                    <p>{searchTerm ? 'Try a different search term' : 'Start by adding your first adventure package'}</p>
                    {!searchTerm && (
                        <Link to="/adventures/add" className="btn-primary">
                            <Plus size={18} />
                            Add Adventure
                        </Link>
                    )}
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="th-img">Adventure</th>
                                <th>Category</th>
                                <th>Location</th>
                                <th>Difficulty</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th className="th-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdventures.map((adv) => (
                                <tr key={adv._id}>
                                    <td className="td-title" data-label="Adventure">
                                        <div className="cell-title">
                                            <div className="cell-img">
                                                <img
                                                    src={getImageUrl(adv.image_url) || 'https://via.placeholder.com/48x36'}
                                                    alt={adv.title}
                                                />
                                            </div>
                                            <div className="cell-title-text">
                                                <span className="cell-name">{adv.title}</span>
                                                <span className="cell-meta">
                                                    <Clock size={12} />
                                                    {adv.duration || '—'} · <UsersIcon size={12} />
                                                    {adv.max_participants || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Category">
                                        {adv.category ? (
                                            <span className={`badge ${catColors[adv.category] || 'badge-orange'}`}>
                                                {adv.category}
                                            </span>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                    <td data-label="Location">
                                        <span className="cell-location">
                                            <MapPin size={14} />
                                            {adv.location || '—'}
                                        </span>
                                    </td>
                                    <td data-label="Difficulty">
                                        {adv.difficulty ? (
                                            <span className={`badge ${adv.difficulty === 'Easy' ? 'badge-green' : adv.difficulty === 'Moderate' ? 'badge-yellow' : 'badge-red'}`}>
                                                {adv.difficulty}
                                            </span>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                    <td className="td-price" data-label="Price">
                                        ₹{adv.price?.toLocaleString() || '—'}
                                    </td>
                                    <td data-label="Status">
                                        <span className={`badge ${adv.status === 'active' ? 'badge-green' : adv.status === 'inactive' ? 'badge-red' : 'badge-yellow'}`}>
                                            {adv.status || 'draft'}
                                        </span>
                                    </td>
                                    <td className="td-actions" data-label="Actions">
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadItinerary(adv)}
                                            className="btn-icon"
                                            title="Download itinerary PDF"
                                        >
                                            <FileText size={16} />
                                        </button>
                                        {isAdmin && (
                                        <Link to={`/adventures/edit/${adv._id}`} className="btn-icon" title="Edit">
                                            <Edit size={16} />
                                        </Link>
                                        )}
                                        {isAdmin && (
                                        <button onClick={() => handleDelete(adv._id)} className="btn-icon danger" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="table-footer">
                        <span className="table-count">{filteredAdventures.length} adventure{filteredAdventures.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Adventures;
