import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    Camera, User, Mail, Phone, MapPin, Lock, Save, LogOut,
    Loader, ShieldCheck, Eye, EyeOff, ArrowLeft, Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, getImageUrl } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import './UserDashboard.css';

const Profile = () => {
    const { user, updateUserContext, logout } = useAuth();
    const navigate = useNavigate();
    const avatarInputRef = useRef(null);

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        avatar_url: '',
    });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
    const [savingPw, setSavingPw] = useState(false);

    useEffect(() => {
        if (!user) return;
        setProfile({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            avatar_url: user.avatar_url || '',
        });
    }, [user]);

    if (!user) {
        return (
            <div className="user-dashboard-wrapper">
                <Navbar />
                <div className="container mx-auto px-4 py-32 text-center">
                    <p className="text-gray-700 mb-6">Please sign in to view your profile.</p>
                    <Link to="/login" className="px-6 py-3 rounded-xl bg-primary text-white font-bold">Sign in</Link>
                </div>
                <Footer />
            </div>
        );
    }

    const handleField = (key) => (e) => setProfile((p) => ({ ...p, [key]: e.target.value }));

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be smaller than 5MB');
            return;
        }
        setAvatarPreview(URL.createObjectURL(file));
        const tid = toast.loading('Uploading photo…');
        try {
            setUploadingAvatar(true);
            const res = await usersAPI.uploadAvatar(user.id, file);
            const url = res.data?.data?.avatar_url;
            updateUserContext({ avatar_url: url });
            setProfile((p) => ({ ...p, avatar_url: url }));
            toast.success('Profile photo updated', { id: tid });
        } catch (err) {
            console.error('Avatar upload error:', err);
            setAvatarPreview(null);
            const serverMsg = err.response?.data?.message;
            const detail = serverMsg || err.message || 'Unknown error';
            toast.error(`Failed to upload avatar: ${detail}`, { id: tid, duration: 6000 });
        } finally {
            setUploadingAvatar(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!profile.name.trim() || !profile.email.trim()) {
            toast.error('Name and email are required');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(profile.email)) {
            toast.error('Please enter a valid email');
            return;
        }
        const tid = toast.loading('Saving…');
        try {
            setSavingProfile(true);
            await usersAPI.updateProfile(user.id, {
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                address: profile.address,
            });
            updateUserContext({
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                address: profile.address,
            });
            toast.success('Profile updated', { id: tid });
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update profile', { id: tid });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
            toast.error('All password fields are required');
            return;
        }
        if (pwForm.next !== pwForm.confirm) {
            toast.error('New passwords do not match');
            return;
        }
        if (pwForm.next.length < 8) {
            toast.error('New password must be at least 8 characters');
            return;
        }
        const tid = toast.loading('Updating password…');
        try {
            setSavingPw(true);
            await usersAPI.changePassword({
                current_password: pwForm.current,
                new_password: pwForm.next,
            });
            setPwForm({ current: '', next: '', confirm: '' });
            toast.success('Password changed', { id: tid });
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message
                || err.response?.data?.errors?.[0]?.msg
                || 'Failed to change password';
            toast.error(msg, { id: tid });
        } finally {
            setSavingPw(false);
        }
    };

    const avatarSrc = avatarPreview || getImageUrl(profile.avatar_url) || null;

    return (
        <div className="user-dashboard-wrapper">
            <Navbar />

            <div className="dashboard-hero">
                <div className="container mx-auto px-4 dashboard-hero-content">
                    <div className="max-w-4xl pt-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-orange-300 font-bold uppercase tracking-wider mb-4"
                        >
                            <Sparkles size={18} />
                            <span>My Profile</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="welcome-text"
                        >
                            {profile.name?.split(' ')[0] || 'Adventurer'}'s Profile
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-300 text-lg max-w-xl"
                        >
                            Update your photo, contact details, and password — all in one place.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-6"
                        >
                            <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold">
                                <ArrowLeft size={16} /> Back to dashboard
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Avatar + Account Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="profile-card lg:col-span-1"
                    >
                        <div className="relative w-32 h-32 mx-auto mb-4">
                            {avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    alt={profile.name}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-[#D4AF37]"
                                />
                            ) : (
                                <div className="profile-avatar w-32 h-32 text-3xl">
                                    {profile.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#D4AF37] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                                aria-label="Change photo"
                            >
                                {uploadingAvatar ? (
                                    <Loader size={18} className="spinning" />
                                ) : (
                                    <Camera size={18} />
                                )}
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <h3 className="text-xl font-black text-gray-900 mb-1 text-center">{profile.name || 'Explorer'}</h3>
                        <p className="text-primary font-medium text-sm mb-6 bg-orange-50 inline-block px-3 py-1 rounded-full mx-auto block w-fit">
                            {user.role === 'admin' ? 'Administrator' : 'Member'}
                        </p>

                        <div className="space-y-3 text-left">
                            <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl">
                                <Mail size={18} className="text-gray-400 shrink-0" />
                                <span className="text-gray-600 truncate">{profile.email}</span>
                            </div>
                            {profile.phone && (
                                <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl">
                                    <Phone size={18} className="text-gray-400 shrink-0" />
                                    <span className="text-gray-600">{profile.phone}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={logout}
                            className="w-full mt-6 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut size={18} /> Sign Out
                        </button>
                    </motion.div>

                    {/* Forms */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile form */}
                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            onSubmit={handleSaveProfile}
                            className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-1">Personal details</h3>
                            <p className="text-sm text-gray-500 mb-6">These will be used on your bookings and reviews.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field
                                    label="Full name"
                                    icon={User}
                                    value={profile.name}
                                    onChange={handleField('name')}
                                    required
                                />
                                <Field
                                    label="Email"
                                    icon={Mail}
                                    type="email"
                                    value={profile.email}
                                    onChange={handleField('email')}
                                    required
                                />
                                <Field
                                    label="Phone"
                                    icon={Phone}
                                    type="tel"
                                    value={profile.phone}
                                    onChange={handleField('phone')}
                                    placeholder="+91 9876543210"
                                />
                                <Field
                                    label="Address"
                                    icon={MapPin}
                                    value={profile.address}
                                    onChange={handleField('address')}
                                    placeholder="City, State"
                                />
                            </div>

                            <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-orange-600 shadow-md shadow-orange-200 transition-all disabled:opacity-50"
                                >
                                    {savingProfile ? <Loader size={18} className="spinning" /> : <Save size={18} />}
                                    {savingProfile ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </motion.form>

                        {/* Password form */}
                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            onSubmit={handleChangePassword}
                            className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <ShieldCheck size={20} className="text-[#D4AF37]" />
                                <h3 className="text-xl font-black text-gray-900">Change password</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">Use a strong password you don't reuse elsewhere.</p>

                            <div className="space-y-4">
                                <PasswordField
                                    label="Current password"
                                    value={pwForm.current}
                                    onChange={(v) => setPwForm((p) => ({ ...p, current: v }))}
                                    visible={showPw.current}
                                    onToggle={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                                />
                                <PasswordField
                                    label="New password"
                                    value={pwForm.next}
                                    onChange={(v) => setPwForm((p) => ({ ...p, next: v }))}
                                    visible={showPw.next}
                                    onToggle={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                                />
                                <PasswordField
                                    label="Confirm new password"
                                    value={pwForm.confirm}
                                    onChange={(v) => setPwForm((p) => ({ ...p, confirm: v }))}
                                    visible={showPw.confirm}
                                    onToggle={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                                />
                            </div>

                            <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
                                <button
                                    type="submit"
                                    disabled={savingPw}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-900 transition-all disabled:opacity-50"
                                >
                                    {savingPw ? <Loader size={18} className="spinning" /> : <Lock size={18} />}
                                    {savingPw ? 'Updating…' : 'Update password'}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                </div>
            </div>

            <MobileTabBarSpacer />
            <Footer />
        </div>
    );
};

const Field = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, required }) => (
    <div>
        <label className="text-xs text-gray-500 font-bold uppercase ml-1">{label}{required && ' *'}</label>
        <div className="relative mt-1">
            <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
        </div>
    </div>
);

const PasswordField = ({ label, value, onChange, visible, onToggle }) => (
    <div>
        <label className="text-xs text-gray-500 font-bold uppercase ml-1">{label}</label>
        <div className="relative mt-1">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
            <button
                type="button"
                onClick={onToggle}
                aria-label={visible ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
                {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    </div>
);

export default Profile;
