import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    Search,
    Users as UsersIcon,
    Mail,
    Calendar,
    MoreVertical,
    Shield,
    Download
} from 'lucide-react';
import { usersAPI } from '../utils/api';
import { exportRows } from '../utils/csv';
import { motion } from 'framer-motion';
import './Users.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [searchTerm]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchTerm) params.search = searchTerm;

            const response = await usersAPI.getAll(params);
            setUsers(response.data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const onExport = () => {
        const cols = [
            { label: 'User ID', key: '_id' },
            { label: 'Name', key: 'name' },
            { label: 'Email', key: 'email' },
            { label: 'Role', key: 'role' },
            { label: 'Created', key: 'created_at' },
        ];
        exportRows(users, cols, 'users');
        toast.success(`Exported ${users.length} users`);
    };

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="page-subtitle">Manage registered users</p>
                </div>
                <button onClick={onExport} className="btn-secondary" disabled={users.length === 0}>
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="search-box">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading users...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="empty-state">
                    <UsersIcon size={48} />
                    <h3>No users found</h3>
                    <p>Try adjusting your search terms</p>
                </div>
            ) : (
                <div className="users-table-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Joined Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <motion.tr
                                    key={user._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {user.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className="user-name">
                                                    {user.name || 'Unknown'}
                                                </div>
                                                <div className="user-email">
                                                    <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="role-badge">
                                            <Shield size={12} />
                                            {user.role || 'User'}
                                        </div>
                                    </td>
                                    <td className="joined-date">
                                        <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <span className="status-badge active">Active</span>
                                    </td>
                                    <td>
                                        <button className="action-btn">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Users;
