import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import Seo from '../components/Seo';

const ResetPassword = () => {
    const [params] = useSearchParams();
    const token = params.get('token') || '';
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);

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

    return (
        <>
            <Seo title="Reset Password" />
            <Navbar />
            <main id="main-content" className="min-h-screen bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF8E5] pt-28 pb-16">
                <div className="container">
                    <div className="mx-auto max-w-md rounded-3xl border border-[#D4AF37]/30 bg-white p-8 shadow-professional-lg">
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-white">
                            <ShieldCheck size={26} />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Set new password</h1>
                        <p className="mt-2 text-sm text-gray-500">Choose a strong password to keep your account safe.</p>
                        <form onSubmit={onSubmit} className="mt-6 space-y-5">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">New password</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={show ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-11 text-sm focus:border-[#D4AF37] focus:outline-none"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShow(!show)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                        aria-label="Toggle visibility"
                                    >
                                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Confirm password</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={show ? 'text' : 'password'}
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 text-sm focus:border-[#D4AF37] focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-60">
                                {loading ? 'Updating…' : 'Update Password'}
                            </button>
                            <Link to="/login" className="block text-center text-sm font-semibold text-gray-600 hover:text-[#D4AF37]">
                                Back to login
                            </Link>
                        </form>
                    </div>
                </div>
            </main>
    <MobileTabBarSpacer />
    <Footer />
        </>
    );
};

export default ResetPassword;
