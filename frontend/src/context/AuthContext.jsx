/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) return { user: null, token: null, login: () => {}, register: () => {}, logout: () => {}, loading: false, isAuthenticated: false };
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in on mount
        if (token) {
            try {
                // Better base64 decoding for JWTs
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const payload = JSON.parse(jsonPayload);
                if (payload && payload.user && payload.user.id) {
                    setUser(payload.user);
                } else {
                    console.error('Invalid or legacy token structure');
                    logout();
                    return; // Prevent setting loading to false if we are redirecting
                }
            } catch (error) {
                console.error('Invalid token:', error);
                logout();
                return;
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('token', data.token);
            setToken(data.token);

            // Decode token to set user
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            setUser(payload.user);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (name, email, password) => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            localStorage.setItem('token', data.token);
            setToken(data.token);

            // Decode token to set user
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            setUser(payload.user);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        navigate('/');
    };

    const updateUserContext = (updatedData) => {
        setUser(prev => ({ ...prev, ...updatedData }));
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        updateUserContext,
        isAuthenticated: !!token,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
