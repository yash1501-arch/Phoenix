import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Loader, ArrowRight, Shield } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [challengeToken, setChallengeToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, verify2faLogin, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            if (result.requires2faSetup) {
                navigate('/settings');
                setLoading(false);
                return;
            }
            navigate('/');
            return;
        }

        if (result.requires2fa) {
            setChallengeToken(result.challengeToken);
            setLoading(false);
            return;
        }

        setError(result.message);
        setLoading(false);
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await verify2faLogin(challengeToken, otp);
        if (result.success) {
            navigate('/');
            return;
        }

        setError(result.message);
        setLoading(false);
    };

    const showOtpStep = Boolean(challengeToken);

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <span className="login-logo-mark-wrap">
                        <img src="/logo-mark.png" alt="Phoenix Adventures" className="login-logo-mark" />
                    </span>
                    <span className="login-logo-text">Phoenix Admin</span>
                </div>

                <div className="login-header">
                    <h1 className="login-title">{showOtpStep ? 'Two-factor verification' : 'Welcome Back'}</h1>
                    <p className="login-subtitle">
                        {showOtpStep
                            ? 'Enter the 6-digit authenticator code, or a one-time recovery code (XXXX-XXXX)'
                            : 'Sign in to manage your adventures'}
                    </p>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {showOtpStep ? (
                    <form onSubmit={handleOtpSubmit} className="login-form">
                        <div className="form-group">
                            <label>Authenticator or recovery code</label>
                            <input
                                type="text"
                                autoComplete="one-time-code"
                                value={otp}
                                onChange={(e) =>
                                    setOtp(
                                        e.target.value
                                            .toUpperCase()
                                            .replace(/[^A-Z0-9-]/g, '')
                                            .slice(0, 20)
                                    )
                                }
                                className="form-input otp-input"
                                placeholder="000000 or ABCD-EFGH"
                                required
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary login-btn"
                            disabled={loading || otp.replace(/-/g, '').length < 6}
                        >
                            {loading ? (
                                <>
                                    <Loader className="spinning" size={20} />
                                    Verifying…
                                </>
                            ) : (
                                <>
                                    <Shield size={20} />
                                    Verify & Sign In
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            className="login-back"
                            onClick={() => {
                                setChallengeToken('');
                                setOtp('');
                                setError('');
                            }}
                        >
                            ← Back to password
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handlePasswordSubmit} className="login-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                placeholder="admin@phoenix.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary login-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader className="spinning" size={20} />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
