import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { EASE } from '../components/ui/Motion';
import { IMG_RAIGAD_FORT } from '../data/indiaImages';

const AUTH_IMAGE =
  IMG_RAIGAD_FORT(1600);

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, verify2faLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();
  const returnTo = location.state?.from || '/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(formData.email, formData.password);
    if (result.success) navigate(returnTo);
    else if (result.requires2fa) {
      setChallengeToken(result.challengeToken);
      setError('');
    } else setError(result.error || 'Login failed. Please try again.');
    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await verify2faLogin(challengeToken, otp);
    if (result.success) navigate(returnTo);
    else setError(result.error || 'Invalid authentication code');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-mist flex flex-col">
      <Seo title="Sign In" description="Access your Phoenix Adventures account." noindex />
      <Navbar />

      <main id="main-content" className="flex-1 flex flex-col lg:flex-row pt-16 md:pt-[4.5rem] lg:min-h-[calc(100svh)]">
        {/* Atmosphere panel */}
        <div className="relative h-52 sm:h-64 lg:h-auto lg:w-[46%] lg:min-h-[calc(100svh-4.5rem)] overflow-hidden">
          <motion.img
            src={AUTH_IMAGE}
            alt="Trekkers on a Sahyadri ridge trail at golden hour"
            className="absolute inset-0 h-full w-full object-cover"
            initial={reduced ? false : { scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: EASE }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 lg:bg-gradient-to-r lg:from-black/60 lg:via-black/30 lg:to-black/10" />
          <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-8 lg:p-12 lg:pb-16">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
            >
              <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-cream tracking-tight">
                Phoenix Adventures
              </p>
              <p className="mt-2 max-w-sm text-sm sm:text-base text-cream/85 leading-relaxed">
                Discover the great outdoors with our adventure tribe.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ember-bright">
                Est. 22 March 2023 · Sahyadri trails
              </p>
            </motion.div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 sm:py-14 lg:px-14 xl:px-20">
          <motion.div
            initial={reduced ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="mx-auto w-full max-w-md"
          >
            <Link
              to="/"
              className="mb-8 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-muted hover:text-stone transition-colors"
            >
              <ArrowLeft size={16} aria-hidden /> Back home
            </Link>

            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-stone tracking-tight">
              {challengeToken ? 'Two-factor verification' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-muted leading-relaxed">
              {challengeToken
                ? 'Enter the 6-digit authenticator code, or a recovery code (XXXX-XXXX).'
                : 'Sign in to manage your wishlist and profile.'}
            </p>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {challengeToken ? (
            <form onSubmit={handleOtpSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="otp">Authenticator or recovery code</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  autoComplete="one-time-code"
                  required
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20))
                  }
                  className="input"
                  placeholder="000000 or ABCD-EFGH"
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading || otp.replace(/-/g, '').length < 6} className="btn btn-primary w-full">
                {loading ? 'Verifying…' : 'Verify & sign in'}
              </button>
              <button
                type="button"
                className="text-sm font-semibold text-muted hover:text-stone"
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
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <label htmlFor="password" className="!mb-0">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="inline-flex min-h-[44px] items-center text-sm font-semibold text-ember-deep hover:text-ember transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted hover:text-stone transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream border-t-transparent" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
            )}

            <p className="mt-8 text-center text-sm text-muted">
              New to the tribe?{' '}
              <Link
                to="/register"
                state={location.state}
                className="font-semibold text-stone hover:text-ember transition-colors"
              >
                Create an account
              </Link>
            </p>

            <p className="mt-6 text-center text-xs text-muted">
              By continuing you agree to our{' '}
              <Link to="/terms" className="underline hover:text-stone">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline hover:text-stone">
                Privacy Policy
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </main>

            <Footer />
    </div>
  );
};

export default Login;
