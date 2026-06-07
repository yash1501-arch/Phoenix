import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import Seo from '../components/Seo';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }
        setLoading(true);
        const tid = toast.loading('Sending reset link…');
        try {
            await api.post('/auth/forgot-password', { email });
            toast.success('Reset link sent!', { id: tid });
            setSent(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Unable to send reset link', { id: tid });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Seo title="Forgot Password" description="Reset your Phoenix Adventures password securely." />
            <Navbar />
            <main id="main-content" className="min-h-screen bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF8E5] pt-28 pb-16">
                <div className="container">
                    <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#D4AF37]">
                        <ArrowLeft size={16} /> Back to login
                    </Link>
                    <div className="mx-auto max-w-md rounded-3xl border border-[#D4AF37]/30 bg-white p-8 shadow-professional-lg">
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-white">
                            <Shield size={26} />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Forgot password?</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Enter the email tied to your account and we'll send you a secure reset link.
                        </p>

                        {sent ? (
                            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
                                    <div>
                                        <p className="font-semibold">Check your inbox.</p>
                                        <p className="mt-1">If an account exists for <strong>{email}</strong>, we've sent password reset instructions.</p>
                                    </div>
                                </div>
                                <Link to="/login" className="btn btn-primary mt-5 w-full">
                                    Return to Login
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={onSubmit} className="mt-6 space-y-5">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 text-sm focus:border-[#D4AF37] focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-60">
                                    {loading ? 'Sending…' : 'Send Reset Link'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
    <MobileTabBarSpacer />
    <Footer />
        </>
    );
};

export default ForgotPassword;
