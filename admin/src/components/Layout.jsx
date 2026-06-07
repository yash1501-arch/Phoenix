import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Mountain,
    Calendar,
    Users,
    Menu,
    X,
    LogOut,
    Settings,
    Star,
    Activity
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const { logout, user } = useAuth();
    const location = useLocation();

    // Close sidebar on mobile when route changes
    React.useEffect(() => {
        if (window.innerWidth <= 768) {
            setSidebarOpen(false);
        }
    }, [location]);

    // Handle screen resize
    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/adventures', icon: Mountain, label: 'Adventures' },
        { path: '/bookings', icon: Calendar, label: 'Bookings' },
        { path: '/users', icon: Users, label: 'Users' },
        { path: '/reviews', icon: Star, label: 'Reviews' },
        { path: '/audit', icon: Activity, label: 'Audit Log' },
        { path: '/settings', icon: Settings, label: 'Settings' }
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="admin-layout">
            {/* Mobile Overlay */}
            {sidebarOpen && window.innerWidth <= 768 && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <Mountain className="logo-icon" />
                        {(sidebarOpen || window.innerWidth <= 768) && <span className="logo-text">Phoenix Admin</span>}
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        className="mobile-close-btn"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <item.icon className="nav-icon" />
                            {(sidebarOpen || window.innerWidth <= 768) && <span className="nav-label">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item logout" onClick={logout}>
                        <LogOut className="nav-icon" />
                        {(sidebarOpen || window.innerWidth <= 768) && <span className="nav-label">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                {/* Header */}
                <header className="header">
                    <button
                        className="menu-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <Menu />
                    </button>

                    <div className="header-right">
                        <div className="admin-profile">
                            <div className="admin-avatar">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <span className="admin-name hidden md:block">
                                {user?.name || 'Admin'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
