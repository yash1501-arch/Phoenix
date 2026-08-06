import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { EASE, IconMotion } from '../components/ui/Motion';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const reduced = useReducedMotion();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    const tid = toast.loading('Updating password…');
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password updated!', { id: tid });
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed', { id: tid });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-mist">
        <Seo title="Reset Password" />
        <Navbar />
        <main className="pt-28 pb-16 container max-w-md mx-auto text-center">
          <h1 className="font-display text-2xl font-semibold text-stone">Invalid reset link</h1>
          <p className="mt-2 text-sm text-muted">This page needs a token from your email. Request a new link.</p>
          <Link to="/forgot-password" className="btn btn-primary mt-6 inline-flex">Request new link</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist">
      <Seo title="Reset Password" />
      <Navbar />
      <main id="main-content" className="pt-28 pb-16">
        <div className="container">
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="mx-auto max-w-md rounded-lg border border-stone/10 bg-white p-8 shadow-card"
          >
            <IconMotion className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-stone text-ember">
              <ShieldCheck size={24} />
            </IconMotion>
            <h1 className="font-display text-3xl font-semibold text-stone">Set new password</h1>
            <p className="mt-2 text-sm text-muted">Choose a strong password to keep your account safe.</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-stone">New password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="new-password"
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-11 pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-stone"
                    aria-label="Toggle visibility"
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-stone">Confirm password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="confirm-password"
                    type={show ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="input pl-11"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-60">
                {loading ? 'Updating…' : 'Update Password'}
              </button>
              <Link to="/login" className="block text-center text-sm font-semibold text-muted hover:text-ember transition-colors">
                Back to login
              </Link>
            </form>
          </motion.div>
        </div>
      </main>
            <Footer />
    </div>
  );
};

export default ResetPassword;
