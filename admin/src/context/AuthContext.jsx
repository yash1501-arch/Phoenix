/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [requires2faSetup, setRequires2faSetup] = useState(false);

    const hydrateSession = useCallback(async () => {
        try {
            const response = await api.get('/auth/me');
            const sessionUser = response.data?.user || {
                id: response.data?.id || response.data?._id,
                name: response.data?.name,
                email: response.data?.email,
                role: response.data?.role,
            };

            if ((sessionUser?.role === 'admin' || sessionUser?.role === 'clerk') && sessionUser?.id) {
                setUser(sessionUser);
                setIsAuthenticated(true);
                setRequires2faSetup(Boolean(response.data?.requires2faSetup));
                return true;
            }
        } catch {
            // not logged in
        }
        setUser(null);
        setIsAuthenticated(false);
        return false;
    }, []);

    useEffect(() => {
        localStorage.removeItem('adminToken');
        hydrateSession().finally(() => setLoading(false));
    }, [hydrateSession]);

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            setIsAuthenticated(false);
            setRequires2faSetup(false);
        };
        const handle2faSetup = () => setRequires2faSetup(true);
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        window.addEventListener('auth:requires2faSetup', handle2faSetup);
        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
            window.removeEventListener('auth:requires2faSetup', handle2faSetup);
        };
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.data?.requires2fa) {
                return {
                    success: false,
                    requires2fa: true,
                    challengeToken: response.data.challengeToken,
                };
            }

            let sessionUser = response.data?.user;
            const needs2faSetup = Boolean(response.data?.requires2faSetup);

            if (!sessionUser?.id) {
                const me = await api.get('/auth/me');
                sessionUser = me.data?.user || {
                    id: me.data?.id || me.data?._id,
                    name: me.data?.name,
                    email: me.data?.email,
                    role: me.data?.role,
                };
            }

            if (sessionUser?.role !== 'admin' && sessionUser?.role !== 'clerk') {
                await api.post('/auth/logout').catch(() => {});
                return {
                    success: false,
                    message: 'Access Denied: Staff privileges required.',
                };
            }

            setUser(sessionUser);
            setIsAuthenticated(true);
            setRequires2faSetup(needs2faSetup);
            return { success: true, requires2faSetup: needs2faSetup };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
            };
        }
    };

    const verify2faLogin = async (challengeToken, code) => {
        try {
            const response = await api.post('/auth/2fa/verify-login', { challengeToken, code });
            const sessionUser = response.data?.user;
            if (!sessionUser?.id || (sessionUser.role !== 'admin' && sessionUser.role !== 'clerk')) {
                return { success: false, message: 'Access Denied: Staff privileges required.' };
            }
            setUser(sessionUser);
            setIsAuthenticated(true);
            setRequires2faSetup(false);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Invalid authentication code',
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // ignore
        }
        setUser(null);
        setIsAuthenticated(false);
        setRequires2faSetup(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, requires2faSetup, setRequires2faSetup, login, verify2faLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
