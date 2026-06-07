import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, Edit, Trash2, Eye, MapPin, Clock, Users, Mountain, Download } from 'lucide-react';
import { adventuresAPI } from '../utils/api';
import { exportRows } from '../utils/csv';
import './Adventures.css';

const Adventures = () => {
    const [adventures, setAdventures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDifficulty, setFilterDifficulty] = useState('all');

    useEffect(() => {
        fetchAdventures();
    }, [filterStatus, filterDifficulty]);

    const fetchAdventures = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterStatus !== 'all') params.status = filterStatus;
            if (filterDifficulty !== 'all') params.difficulty = filterDifficulty;

            const response = await adventuresAPI.getAll(params);
            // Convex returns data directly as array or wrapped in { data: [] }
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
            fetchAdventures();
        } catch (error) {
            console.error('Error deleting adventure:', error);
            toast.error('Failed to delete adventure');
        }
    };

    const onExport = () => {
        const cols = [
            { label: 'ID', key: '_id' },
            { label: 'Title', key: 'title' },
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

    const filteredAdventures = adventures.filter(adventure =>
        (adventure.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (adventure.location || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="adventures-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Adventures</h1>
                    <p className="page-subtitle">Manage your adventure packages</p>
                </div>
                <Link to="/adventures/add" className="btn-primary">
                    <Plus size={20} />
                    Add Adventure
                </Link>
                <button onClick={onExport} className="btn-secondary" disabled={filteredAdventures.length === 0}>
                    <Download size={16} /> Export CSV
                </button>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <Search className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search adventures..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filters">
                    <div className="filter-group">
                        <Filter size={18} />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <select
                            value={filterDifficulty}
                            onChange={(e) => setFilterDifficulty(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Difficulty</option>
                            <option value="Easy">Easy</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Challenging">Challenging</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading adventures...</p>
                </div>
            ) : filteredAdventures.length === 0 ? (
                <div className="empty-state">
                    <Mountain size={64} />
                    <h3>No adventures found</h3>
                    <p>Start by adding your first adventure package</p>
                    <Link to="/adventures/add" className="btn-primary">
                        <Plus size={20} />
                        Add Adventure
                    </Link>
                </div>
            ) : (
                <div className="adventures-grid">
                    {filteredAdventures.map((adventure) => (
                        <div key={adventure._id} className="adventure-card">
                            <div className="adventure-image">
                                <img
                                    src={adventure.image_url || 'https://via.placeholder.com/400x300'}
                                    alt={adventure.title}
                                />
                                <span className={`status-badge ${adventure.status}`}>
                                    {adventure.status}
                                </span>
                            </div>

                            <div className="adventure-content">
                                <h3 className="adventure-title">{adventure.title}</h3>

                                <div className="adventure-meta">
                                    <div className="meta-item">
                                        <MapPin size={16} />
                                        <span>{adventure.location}</span>
                                    </div>
                                    <div className="meta-item">
                                        <Clock size={16} />
                                        <span>{adventure.duration}</span>
                                    </div>
                                    <div className="meta-item">
                                        <Users size={16} />
                                        <span>{adventure.max_participants} max</span>
                                    </div>
                                </div>

                                <div className="adventure-footer">
                                    <div className="price-section">
                                        <span className="price">₹{adventure.price?.toLocaleString()}</span>
                                        <span className={`difficulty ${adventure.difficulty?.toLowerCase()}`}>
                                            {adventure.difficulty}
                                        </span>
                                    </div>

                                    <div className="action-buttons">
                                        <Link
                                            to={`/adventures/edit/${adventure._id}`}
                                            className="btn-icon"
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(adventure._id)}
                                            className="btn-icon danger"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Adventures;
