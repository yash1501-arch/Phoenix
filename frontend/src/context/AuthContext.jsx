/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        return {
            user: null,
            token: null,
            login: () => {},
            register: () => {},
            logout: () => {},
            loading: false,
            isAuthenticated: false,
        };
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const hydrateSession = useCallback(async () => {
        try {
            const res = await authAPI.me();
            const body = res.data || {};
            // Prefer nested user, but keep full profile fields from /me root (id, avatar, phone, …)
            const nested = body.user || {};
            const sessionUser = {
                ...body,
                ...nested,
                id: nested.id || body.id || body._id,
                name: nested.name || body.name,
                email: nested.email || body.email,
                role: nested.role || body.role,
            };
            delete sessionUser.user;
            delete sessionUser.requires2faSetup;
            delete sessionUser.password;
            if (sessionUser?.id) {
                setUser(sessionUser);
                return true;
            }
        } catch {
            setUser(null);
        }
        return false;
    }, []);

    useEffect(() => {
        localStorage.removeItem('token');
        hydrateSession().finally(() => setLoading(false));
    }, [hydrateSession]);

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/adventures', '/about', '/contact', '/blog', '/gallery', '/faq', '/safety', '/terms', '/privacy', '/refund'];
            const currentPath = window.location.pathname;
            const isPublicPath = publicPaths.some((p) => currentPath === p || currentPath.startsWith('/adventure/') || currentPath.startsWith('/treks') || currentPath.startsWith('/camping') || currentPath.startsWith('/tours') || currentPath.startsWith('/search'));
            if (!isPublicPath) {
                navigate('/login');
            }
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [navigate]);

    const login = async (email, password) => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (data.requires2fa) {
                return {
                    success: false,
                    requires2fa: true,
                    challengeToken: data.challengeToken,
                };
            }

            if (data.user?.role === 'admin' || data.user?.role === 'clerk') {
                try { await authAPI.logout(); } catch { /* ignore */ }
                return {
                    success: false,
                    error: 'Staff accounts must use the admin panel to sign in.',
                };
            }

            if (data.user?.id) {
                setUser(data.user);
            } else {
                await hydrateSession();
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const verify2faLogin = async (challengeToken, code) => {
        try {
            const response = await authAPI.verify2faLogin(challengeToken, code);
            const sessionUser = response.data?.user;
            if (sessionUser?.role === 'admin' || sessionUser?.role === 'clerk') {
                try { await authAPI.logout(); } catch { /* ignore */ }
                return {
                    success: false,
                    error: 'Staff accounts must use the admin panel to sign in.',
                };
            }
            if (sessionUser?.id) {
                setUser(sessionUser);
            } else {
                await hydrateSession();
            }
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Invalid authentication code',
            };
        }
    };

    const register = async (name, email, password) => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            if (data.user?.id) {
                setUser(data.user);
            } else {
                await hydrateSession();
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch {
            // Clear local state even if cookie clear fails
        }
        setUser(null);
        navigate('/');
    };

    const updateUserContext = (updatedData) => {
        setUser((prev) => ({ ...prev, ...updatedData }));
    };

    const value = {
        user,
        token: user ? 'session' : null,
        login,
        verify2faLogin,
        register,
        logout,
        updateUserContext,
        isAuthenticated: !!user,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
