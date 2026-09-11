import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { User, Search } from 'lucide-react';
import { usersAdminAPI } from '../utils/api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

    const load = async (page = 1, searchTerm = search) => {
        setLoading(true);
        try {
            const res = await usersAdminAPI.getAll({
                page,
                limit: 20,
                search: searchTerm || undefined,
            });
            setUsers(res.data?.data || []);
            setPagination(res.data?.pagination || { page: 1, total: 0, totalPages: 1 });
        } catch {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSearch = (e) => {
        e.preventDefault();
        load(1, search);
    };

    return (
        <div className="messages-page">
            <div className="page-header">
                <p className="page-subtitle" style={{ marginTop: 0 }}>
                    Registered users — grant <strong>clerk</strong> for payments/bookings only, or <strong>admin</strong> for full access.
                </p>
            </div>

            <form onSubmit={onSearch} className="settings-inline-row" style={{ marginBottom: '1rem' }}>
                <input
                    type="search"
                    className="form-input"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1, maxWidth: '320px' }}
                />
                <button type="submit" className="btn-secondary">
                    <Search size={16} />
                    Search
                </button>
            </form>

            {loading ? (
                <div className="loading-state"><div className="spinner" /></div>
            ) : users.length === 0 ? (
                <div className="empty-state">
                    <User size={32} />
                    <p>No users found</p>
                </div>
            ) : (
                <>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id || u._id}>
                                        <td>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span className="user-initial" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                                                    {u.name?.charAt(0) || '?'}
                                                </span>
                                                {u.name}
                                            </span>
                                        </td>
                                        <td>{u.email}</td>
                                        <td>
                                            <select
                                                className="form-input"
                                                value={u.role || 'user'}
                                                onChange={async (e) => {
                                                    const role = e.target.value;
                                                    try {
                                                        await usersAdminAPI.setRole(u.id || u._id, role);
                                                        toast.success('Role updated');
                                                        load(pagination.page);
                                                    } catch (err) {
                                                        toast.error(err.response?.data?.message || 'Role update failed');
                                                    }
                                                }}
                                            >
                                                <option value="user">user</option>
                                                <option value="clerk">clerk</option>
                                                <option value="admin">admin</option>
                                            </select>
                                        </td>
                                        <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="settings-inline-row" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                disabled={pagination.page <= 1}
                                onClick={() => load(pagination.page - 1)}
                            >
                                Previous
                            </button>
                            <span className="page-subtitle" style={{ margin: 0 }}>
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                type="button"
                                className="btn-secondary"
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => load(pagination.page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Users;
