import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { EASE } from '../components/ui/Motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const reduced = useReducedMotion();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    const tid = toast.loading('Sending reset link…');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      const data = res.data || {};
      toast.success('If that email exists, we sent a reset link.', { id: tid });
      setSent(true);
      // Local/dev only — backend may return link when SMTP fails
      if (data.devResetLink) {
        setDevLink(data.devResetLink);
        if (data.emailError) toast.error(data.emailError, { duration: 5000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to send reset link', { id: tid });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mist">
      <Seo title="Forgot Password" description="Reset your Phoenix Adventures password securely." noindex />
      <Navbar />
      <main id="main-content" className="pt-28 pb-16">
        <div className="container">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Link to="/login" className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-muted hover:text-stone transition-colors">
              <ArrowLeft size={16} /> Back to login
            </Link>
          </motion.div>
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
            className="mx-auto max-w-md"
          >
            <p className="font-display text-sm font-semibold text-stone tracking-tight">Phoenix Adventures</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-stone tracking-tight">Forgot password?</h1>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Enter the email tied to your account and we&apos;ll send you a secure reset link.
            </p>

            {sent ? (
              <div className="mt-6 rounded-md border border-stone/15 bg-mist-subtle p-5 text-sm text-stone">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-stone" size={20} />
                  <div>
                    <p className="font-semibold">Check your inbox.</p>
                    <p className="mt-1 text-muted">If an account exists for <strong className="text-stone">{email}</strong>, we&apos;ve sent password reset instructions. Link expires in 1 hour.</p>
                  </div>
                </div>
                {devLink && (
                  <div className="mt-4 rounded-md border border-ember/30 bg-mist-subtle p-3 text-xs break-all">
                    <p className="font-semibold text-ember mb-1">Dev fallback (email failed)</p>
                    <a href={devLink} className="text-stone underline hover:text-ember">{devLink}</a>
                  </div>
                )}
                <Link to="/login" className="btn btn-primary mt-5 w-full">
                  Return to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="forgot-email">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input pl-11"
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-60">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-muted">
              Remembered it?{' '}
              <Link to="/login" className="font-semibold text-stone hover:text-ember transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
            <Footer />
    </div>
  );
};

export default ForgotPassword;
