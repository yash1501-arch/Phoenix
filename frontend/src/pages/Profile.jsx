import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Camera, User, Mail, Phone, MapPin, Lock, Save, LogOut,
  Loader, ShieldCheck, Eye, EyeOff, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, getImageUrl } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { Reveal, IconMotion } from '../components/ui/Motion';
import TwoFactorSettings from '../components/ui/TwoFactorSettings';
import './UserDashboard.css';

const Profile = () => {
  const { user, updateUserContext, logout } = useAuth();
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
          <p className="text-muted mb-6">Please sign in to view your profile.</p>
          <Link to="/login" className="btn btn-primary">Sign in</Link>
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
      <Seo title="My Profile" description="Update your Phoenix Adventures profile." />
      <Navbar />

      <div className="dashboard-hero">
        <div className="container mx-auto px-4 dashboard-hero-content">
          <div className="max-w-4xl pt-10">
            <Reveal variant="fade">
              <p className="kicker !text-ember mb-4">My Profile</p>
            </Reveal>
            <Reveal variant="rise" delay={0.08}>
              <h1 className="welcome-text">
                {profile.name?.split(' ')[0] || 'Adventurer'}&apos;s Profile
              </h1>
            </Reveal>
            <Reveal variant="fade" delay={0.15}>
              <p className="text-cream/70 text-lg max-w-xl">
                Update your photo, contact details, and password — all in one place.
              </p>
            </Reveal>
            <Reveal variant="fade" delay={0.22} className="mt-6">
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-cream/80 hover:text-cream text-sm font-semibold transition-colors">
                <ArrowLeft size={16} /> Back to dashboard
              </Link>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Reveal variant="slideLeft" className="profile-card lg:col-span-1 !rounded-lg !border-stone/10">
            <div className="relative w-32 h-32 mx-auto mb-4">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-ember"
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
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-ember text-white flex items-center justify-center shadow-ember hover:bg-ember-bright transition-colors disabled:opacity-50"
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

            <h3 className="font-display text-xl font-semibold text-stone mb-1 text-center">{profile.name || 'Explorer'}</h3>
            <p className="text-ember font-medium text-sm mb-6 bg-ember/10 inline-block px-3 py-1 rounded-md mx-auto block w-fit">
              {user.role === 'admin' ? 'Administrator' : user.role === 'clerk' ? 'Payments clerk' : 'Member'}
            </p>

            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm p-3 bg-mist rounded-md">
                <Mail size={18} className="text-muted shrink-0" />
                <span className="text-muted truncate">{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-3 text-sm p-3 bg-mist rounded-md">
                  <Phone size={18} className="text-muted shrink-0" />
                  <span className="text-muted">{profile.phone}</span>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className="w-full mt-6 py-3 rounded-md bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </Reveal>

          <div className="lg:col-span-2 space-y-6">
            <Reveal variant="slideRight" as="form" onSubmit={handleSaveProfile} className="bg-mist-subtle rounded-lg p-6 md:p-8 border border-stone/8 shadow-smoke">
              <h3 className="font-display text-xl font-semibold text-stone mb-1">Personal details</h3>
              <p className="text-sm text-muted mb-6">These will be used on your bookings and reviews.</p>

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
                  placeholder="+91 93725 06447"
                />
                <Field
                  label="Address"
                  icon={MapPin}
                  value={profile.address}
                  onChange={handleField('address')}
                  placeholder="City, State"
                />
              </div>

              <div className="flex justify-end pt-4 mt-2 border-t border-stone/8">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn btn-primary inline-flex disabled:opacity-50"
                >
                  {savingProfile ? <Loader size={18} className="spinning" /> : <Save size={18} />}
                  {savingProfile ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </Reveal>

            <Reveal variant="rise" delay={0.1} as="form" onSubmit={handleChangePassword} className="bg-mist-subtle rounded-lg p-6 md:p-8 border border-stone/8 shadow-smoke">
              <div className="flex items-center gap-3 mb-1">
                <IconMotion className="text-ember">
                  <ShieldCheck size={20} />
                </IconMotion>
                <h3 className="font-display text-xl font-semibold text-stone">Change password</h3>
              </div>
              <p className="text-sm text-muted mb-6">Use a strong password you don&apos;t reuse elsewhere.</p>

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

              <div className="flex justify-end pt-4 mt-2 border-t border-stone/8">
                <button
                  type="submit"
                  disabled={savingPw}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-panel text-cream font-bold hover:bg-panel-soft transition-colors disabled:opacity-50"
                >
                  {savingPw ? <Loader size={18} className="spinning" /> : <Lock size={18} />}
                  {savingPw ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </Reveal>

            <TwoFactorSettings />
          </div>
        </div>
      </div>

            <Footer />
    </div>
  );
};

const Field = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, required }) => (
  <div>
    <label className="text-xs text-muted font-bold uppercase ml-1">{label}{required && ' *'}</label>
    <div className="relative mt-1">
      <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="input pl-10"
      />
    </div>
  </div>
);

const PasswordField = ({ label, value, onChange, visible, onToggle }) => (
  <div>
    <label className="text-xs text-muted font-bold uppercase ml-1">{label}</label>
    <div className="relative mt-1">
      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pl-10 pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-stone"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
);

export default Profile;
