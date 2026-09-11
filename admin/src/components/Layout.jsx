import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
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
    CreditCard,
    ChevronRight,
    Mail,
    ScrollText,
    Users,
    Shield,
} from 'lucide-react';
import './Layout.css';

const NAV = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { path: '/adventures', icon: Mountain, label: 'Adventures' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/messages', icon: Inbox, label: 'Messages', adminOnly: true },
    { path: '/reviews', icon: Star, label: 'Reviews', adminOnly: true },
    { path: '/blog', icon: PenLine, label: 'Blog', adminOnly: true },
    { path: '/newsletter', icon: Mail, label: 'Newsletter', adminOnly: true },
    { path: '/users', icon: Users, label: 'Users', adminOnly: true },
    { path: '/audit', icon: ScrollText, label: 'Audit Log', adminOnly: true },
    { path: '/security', icon: Shield, label: 'Security', clerkOnly: true },
    { path: '/settings', icon: Settings, label: 'Settings', adminOnly: true },
];

const PAGE_TITLES = {
    '/': 'Dashboard',
    '/adventures': 'Adventures',
    '/adventures/add': 'New adventure',
    '/reviews': 'Reviews',
    '/blog': 'Blog',
    '/messages': 'Messages',
    '/payments': 'Payments',
    '/newsletter': 'Newsletter',
    '/users': 'Users',
    '/audit': 'Audit Log',
    '/security': 'Security',
    '/settings': 'Settings',
};

function pageTitle(pathname) {
    if (pathname.startsWith('/adventures/edit/')) return 'Edit adventure';
    if (pathname.startsWith('/blog/edit/')) return 'Edit post';
    if (pathname === '/blog/new') return 'New post';
    return PAGE_TITLES[pathname] || 'Admin';
}

const Layout = ({ children }) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [sidebarOpen, setSidebarOpen] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth > 768 : false
    );
    const { logout, user, requires2faSetup } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (isMobile) setSidebarOpen(false);
    }, [location.pathname, isMobile]);

    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        } else {
            setSidebarOpen(true);
        }
    }, [isMobile]);

    useEffect(() => {
        if (!isMobile) {
            document.body.classList.remove('admin-nav-open');
            return undefined;
        }
        document.body.classList.toggle('admin-nav-open', sidebarOpen);
        return () => document.body.classList.remove('admin-nav-open');
    }, [sidebarOpen, isMobile]);

    const isActive = (item) => {
        if (item.end) return location.pathname === '/';
        return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    };

    const title = pageTitle(location.pathname);
    const closeSidebar = () => setSidebarOpen(false);
    const isAdmin = user?.role === 'admin';
    const visibleNav = NAV.filter((item) => {
        if (item.adminOnly) return isAdmin;
        if (item.clerkOnly) return !isAdmin;
        return true;
    });

    return (
        <div className="admin-shell">
            {sidebarOpen && isMobile && (
                <button
                    type="button"
                    className="sidebar-scrim"
                    aria-label="Close menu"
                    onClick={closeSidebar}
                />
            )}

            <aside
                className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}
                aria-hidden={isMobile && !sidebarOpen}
            >
                <div className="sidebar-brand">
                    <Link to="/" className="brand-link" onClick={() => isMobile && closeSidebar()}>
                        <img src="/logo-mark.png" alt="" className="brand-mark" width={32} height={32} />
                        <span className="brand-name">Phoenix</span>
                    </Link>
                    <button
                        type="button"
                        className="sidebar-close"
                        onClick={closeSidebar}
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="sidebar-nav" aria-label="Main">
                    {visibleNav.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${isActive(item) ? 'is-active' : ''}`}
                            onClick={() => isMobile && closeSidebar()}
                        >
                            <item.icon size={18} strokeWidth={2} aria-hidden />
                            <span>{item.label}</span>
                            {isActive(item) && <ChevronRight size={14} className="nav-chevron" aria-hidden />}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-foot">
                    <div className="sidebar-user">
                        <span className="user-initial" aria-hidden>{user?.name?.charAt(0) || 'A'}</span>
                        <div className="user-meta">
                            <span className="user-name">{user?.name || 'Admin'}</span>
                            <span className="user-role">{user?.role === 'clerk' ? 'Payments clerk' : 'Administrator'}</span>
                        </div>
                    </div>
                    <button type="button" className="nav-link nav-link--logout" onClick={logout}>
                        <LogOut size={18} strokeWidth={2} aria-hidden />
                        <span>Sign out</span>
                    </button>
                </div>
            </aside>

            <div className="admin-main">
                <header className="admin-topbar">
                    <button
                        type="button"
                        className="menu-btn"
                        onClick={() => setSidebarOpen((o) => !o)}
                        aria-expanded={sidebarOpen}
                        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
                    >
                        <Menu size={20} />
                    </button>
                    <div className="topbar-title">
                        <h1 className="topbar-heading">{title}</h1>
                    </div>
                </header>

                <main className="admin-content">
                    {requires2faSetup && location.pathname !== '/settings' && (
                        <div className="error-message" style={{ marginBottom: '1rem' }}>
                            Enable two-factor authentication in Settings to access admin features.
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
