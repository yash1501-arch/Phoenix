/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('adminToken');
            if (token) {
                try {
                    // Decode token to get user info
                    const payload = JSON.parse(atob(token.split('.')[1]));

                    // Verify admin role
                    if (payload.user.role === 'admin') {
                        setUser(payload.user);
                        setIsAuthenticated(true);
                    } else {
                        localStorage.removeItem('adminToken');
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                } catch (e) {
                    console.error('Invalid token', e);
                    localStorage.removeItem('adminToken');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            // Using axios instance 'api' which handles base URL
            const response = await api.post('/auth/login', { email, password });
            const { token } = response.data;

            // Verify admin role
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.user.role !== 'admin') {
                return {
                    success: false,
                    message: 'Access Denied: Admin privileges required.'
                };
            }

            localStorage.setItem('adminToken', token);
            setUser(payload.user);
            setIsAuthenticated(true);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed. Please check credentials.'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        setUser(null);
        setIsAuthenticated(false);
        // We let the router handle redirection based on isAuthenticated state
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
