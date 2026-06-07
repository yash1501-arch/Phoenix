import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp,
    Mountain,
    Calendar,
    DollarSign,
    Users,
    Plus
} from 'lucide-react';
import { adventuresAPI } from '../utils/api';
import { motion } from 'framer-motion';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalAdventures: 0,
        activeAdventures: 0,
        totalBookings: 0,
        pendingBookings: 0,
        totalRevenue: 0,
        recentBookings: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await adventuresAPI.getStats();
            // Handle both { data: { totalAdventures, ... } } and flat result
            const result = response.data?.data || response.data;
            if (result && typeof result === 'object') {
                setStats(prev => ({ ...prev, ...result }));
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Total Adventures',
            value: stats.totalAdventures,
            icon: <Mountain className="stat-icon" />,
            color: 'blue',
            link: '/adventures'
        },
        {
            label: 'Active Adventures',
            value: stats.activeAdventures,
            icon: <TrendingUp className="stat-icon" />,
            color: 'green',
            link: '/adventures'
        },
        {
            label: 'Total Bookings',
            value: stats.totalBookings,
            icon: <Calendar className="stat-icon" />,
            color: 'purple',
            link: '/bookings'
        },
        {
            label: 'Total Revenue',
            value: `₹${(stats.totalRevenue / 1000).toFixed(1)}K`,
            icon: <DollarSign className="stat-icon" />,
            color: 'yellow',
            link: '/bookings'
        }
    ];

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
                </div>
                <Link to="/adventures/add" className="btn-primary">
                    <Plus size={20} />
                    Add Adventure
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link to={stat.link} className={`stat-card ${stat.color}`}>
                            <div className="stat-icon-wrapper">
                                {stat.icon}
                            </div>
                            <div className="stat-content">
                                <p className="stat-label">{stat.label}</p>
                                <h3 className="stat-value">{stat.value}</h3>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Recent Bookings */}
            {stats.recentBookings && stats.recentBookings.length > 0 && (
                <div className="recent-section">
                    <div className="section-header">
                        <h2 className="section-title">Recent Bookings</h2>
                        <Link to="/bookings" className="view-all-link">
                            View All
                        </Link>
                    </div>

                    <div className="bookings-table-wrapper">
                        <table className="bookings-table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Adventure</th>
                                    <th>Date</th>
                                    <th>Participants</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentBookings.map((booking, index) => {
                                    const user = booking.user || booking.profiles;
                                    return (
                                    <motion.tr
                                        key={booking.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
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
                                        <td className="adventure-name">
                                            {booking.adventures?.title}
                                        </td>
                                        <td className="booking-date">
                                            {new Date(booking.booking_date).toLocaleDateString()}
                                        </td>
                                        <td className="participants">
                                            <Users size={14} />
                                            {booking.participants}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${booking.status}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="amount">
                                            ₹{booking.total_amount?.toLocaleString()}
                                        </td>
                                    </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="actions-grid">
                    <Link to="/adventures/add" className="action-card">
                        <Mountain size={24} />
                        <span>Add New Adventure</span>
                    </Link>
                    <Link to="/adventures" className="action-card">
                        <TrendingUp size={24} />
                        <span>View Adventures</span>
                    </Link>
                    <Link to="/bookings" className="action-card">
                        <Calendar size={24} />
                        <span>Manage Bookings</span>
                    </Link>
                    <Link to="/users" className="action-card">
                        <Users size={24} />
                        <span>View Users</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
