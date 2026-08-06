import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Mountain,
    Menu,
    X,
    LogOut,
    Settings,
    Star,
    PenLine,
    Inbox,
    CreditCard
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const { logout, user } = useAuth();
    const location = useLocation();

    React.useEffect(() => {
        if (window.innerWidth <= 768) setSidebarOpen(false);
    }, [location]);

    const menuItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/adventures', icon: Mountain, label: 'Adventures' },
        { path: '/reviews', icon: Star, label: 'Reviews' },
        { path: '/blog', icon: PenLine, label: 'Blog' },
        { path: '/messages', icon: Inbox, label: 'Messages' },
        { path: '/payments', icon: CreditCard, label: 'Payments' },
        { path: '/settings', icon: Settings, label: 'Settings' }
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="admin-layout">
            {sidebarOpen && window.innerWidth <= 768 && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-mark-wrap">
                            <img src="/logo-mark.png" alt="Phoenix Adventures" className="logo-mark" />
                        </span>
                        {(sidebarOpen || window.innerWidth <= 768) && <span className="logo-text">Phoenix</span>}
                    </div>
                    <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="sidebar-label">
                    {(sidebarOpen || window.innerWidth <= 768) && <span>Main Menu</span>}
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
                            {isActive(item.path) && <span className="nav-indicator" />}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="user-avatar">{user?.name?.charAt(0) || 'A'}</div>
                        {(sidebarOpen || window.innerWidth <= 768) && (
                            <div className="user-info">
                                <span className="user-name">{user?.name || 'Admin'}</span>
                                <span className="user-role">Administrator</span>
                            </div>
                        )}
                    </div>
                    <button className="nav-item logout" onClick={logout}>
                        <LogOut className="nav-icon" />
                        {(sidebarOpen || window.innerWidth <= 768) && <span className="nav-label">Logout</span>}
                    </button>
                </div>
            </aside>

            <div className="main-content">
                <header className="header">
                    <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu size={20} />
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

                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
