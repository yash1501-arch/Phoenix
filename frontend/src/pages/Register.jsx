import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { EASE } from '../components/ui/Motion';
import { IMG_LOHAGAD } from '../data/indiaImages';

const AUTH_IMAGE =
  IMG_LOHAGAD(1600);

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();
  const returnTo = location.state?.from || '/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    const result = await register(formData.name, formData.email, formData.password);
    if (result.success) navigate(returnTo);
    else setError(result.error || 'Registration failed. Please try again.');
    setLoading(false);
  };

  const passwordRequirements = [
    { met: formData.password.length >= 6, text: 'At least 6 characters' },
    {
      met: formData.password === formData.confirmPassword && formData.password.length > 0,
      text: 'Passwords match',
    },
  ];

  return (
    <div className="min-h-screen bg-mist flex flex-col">
      <Seo title="Create Account" description="Join Phoenix Adventures to book treks and manage your trips." />
      <Navbar />

      <main id="main-content" className="flex-1 flex flex-col lg:flex-row pt-16 md:pt-[4.5rem] lg:min-h-[calc(100svh)]">
        {/* Atmosphere panel */}
        <div className="relative h-52 sm:h-64 lg:h-auto lg:w-[46%] lg:min-h-[calc(100svh-4.5rem)] overflow-hidden order-1">
          <motion.img
            src={AUTH_IMAGE}
            alt="Sunlit mountain ridges above the clouds — trail atmosphere"
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
        <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 sm:py-14 lg:px-14 xl:px-20 order-2">
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
              Join the tribe
            </h1>
            <p className="mt-2 text-muted leading-relaxed">
              Create an account to save wishlist trips and manage your profile.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Your name"
                />
              </div>

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
                <label htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
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

              <div>
                <label htmlFor="confirmPassword">Confirm password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted hover:text-stone transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {formData.password && (
                <div className="space-y-2 rounded-md bg-mist-subtle px-4 py-3">
                  {passwordRequirements.map((req) => (
                    <div key={req.text} className="flex items-center gap-2.5 text-sm">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          req.met ? 'bg-panel text-cream' : 'bg-panel/15 text-cream'
                        }`}
                      >
                        <Check size={12} aria-hidden />
                      </div>
                      <span className={req.met ? 'text-stone font-medium' : 'text-muted'}>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream border-t-transparent" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
              Already have an account?{' '}
              <Link
                to="/login"
                state={location.state}
                className="font-semibold text-stone hover:text-ember transition-colors"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-6 text-center text-xs text-muted">
              By creating an account you agree to our{' '}
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

export default Register;
