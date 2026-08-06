import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Settings as SettingsIcon, Plus, Trash2, Instagram, ExternalLink, Shield, ShieldOff } from 'lucide-react';
import { settingsAPI, twoFactorAPI } from '../utils/api';

const SETTINGS_FIELDS = [
    { key: 'site_name', label: 'Site Name', type: 'text' },
    { key: 'site_tagline', label: 'Tagline', type: 'text' },
    { key: 'contact_email', label: 'Contact Email', type: 'email' },
    { key: 'contact_phone', label: 'Contact Phone', type: 'tel' },
    { key: 'whatsapp', label: 'WhatsApp (with +countrycode)', type: 'tel' },
    { key: 'instagram', label: 'Instagram URL', type: 'url' },
    { key: 'instagram_handle', label: 'Instagram handle (e.g. @phoenixadventures)', type: 'text' },
    { key: 'maps_url', label: 'Google Maps URL', type: 'url' },
    { key: 'advance_per_person', label: 'Advance per person (₹)', type: 'number' },
    { key: 'cancellation_window_days', label: 'Cancellation window (days)', type: 'number' },
    { key: 'maintenance_mode', label: 'Maintenance mode (true/false)', type: 'text' },
];

const isValidInstagramUrl = (u) =>
    typeof u === 'string' && /instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]{6,}/i.test(u);

const InstagramPostsEditor = ({ value, onSave }) => {
    let initial = [];
    try {
        const parsed = value ? JSON.parse(value) : [];
        if (Array.isArray(parsed)) initial = parsed;
    } catch { /* empty */ }

    const [items, setItems] = useState(initial);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);

    const add = () => {
        const url = draft.trim();
        if (!isValidInstagramUrl(url)) {
            toast.error('That doesn\'t look like a valid Instagram post URL');
            return;
        }
        if (items.includes(url)) {
            toast.error('Already added');
            return;
        }
        setItems([...items, url]);
        setDraft('');
    };

    const remove = (i) => setItems(items.filter((_, idx) => idx !== i));

    const save = async () => {
        setSaving(true);
        const tid = toast.loading('Saving Instagram feed…');
        try {
            await onSave(JSON.stringify(items));
            toast.success(`Saved ${items.length} post${items.length === 1 ? '' : 's'}`, { id: tid });
        } catch {
            toast.error('Save failed', { id: tid });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Instagram size={16} className="text-pink-500" />
                Instagram posts (Gallery feed)
                <span className="ml-2 text-[10px] uppercase tracking-widest text-gray-400 font-mono">instagram_posts</span>
            </label>
            <p className="text-xs text-gray-500 mb-4">
                Paste the URLs of Instagram posts or reels you want to feature. They render as embeds on the public Gallery page.
            </p>

            <div className="flex gap-2 mb-3">
                <input
                    type="url"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder="https://www.instagram.com/p/ABC123/"
                    className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#D4AF37] focus:outline-none"
                />
                <button onClick={add} className="btn-secondary flex items-center gap-2">
                    <Plus size={16} /> Add
                </button>
            </div>

            {items.length === 0 ? (
                <div className="text-sm text-gray-500 italic py-3">No posts added yet.</div>
            ) : (
                <ul className="space-y-2 mb-4">
                    {items.map((url, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <Instagram size={14} className="text-pink-500 shrink-0" />
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 truncate text-gray-700 hover:text-[#D4AF37]"
                            >
                                {url}
                            </a>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700" aria-label="Open on Instagram">
                                <ExternalLink size={14} />
                            </a>
                            <button onClick={() => remove(i)} className="text-red-500 hover:text-red-700" aria-label="Remove">
                                <Trash2 size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                <Save size={16} /> {saving ? 'Saving…' : 'Save Instagram feed'}
            </button>
        </div>
    );
};

const Security2FAPanel = () => {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [setup, setSetup] = useState(null);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);

    const loadStatus = () => {
        twoFactorAPI.status()
            .then((res) => setEnabled(Boolean(res.data?.data?.enabled)))
            .catch(() => toast.error('Could not load 2FA status'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadStatus(); }, []);

    const startSetup = async () => {
        setBusy(true);
        try {
            const res = await twoFactorAPI.setup();
            setSetup(res.data?.data || null);
            setCode('');
        } catch {
            toast.error('Failed to start 2FA setup');
        } finally {
            setBusy(false);
        }
    };

    const confirmEnable = async () => {
        if (!setup?.secret) return;
        setBusy(true);
        try {
            await twoFactorAPI.enable(setup.secret, code);
            toast.success('Two-factor authentication enabled');
            setSetup(null);
            setCode('');
            setEnabled(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid code');
        } finally {
            setBusy(false);
        }
    };

    const disable2fa = async () => {
        setBusy(true);
        try {
            await twoFactorAPI.disable(code, password);
            toast.success('Two-factor authentication disabled');
            setCode('');
            setPassword('');
            setEnabled(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not disable 2FA');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Shield size={18} className="text-[#D4AF37]" />
                Admin two-factor authentication
            </h2>
            <p className="text-xs text-gray-500 mb-4">
                Protect admin login with Google Authenticator, Authy, or any TOTP app.
            </p>

            {loading ? (
                <p className="text-sm text-gray-500">Loading…</p>
            ) : enabled ? (
                <div className="space-y-3">
                    <p className="text-sm text-green-700 font-medium">2FA is enabled on this account.</p>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Current 6-digit code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm"
                    />
                    <input
                        type="password"
                        placeholder="Account password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm"
                    />
                    <button
                        type="button"
                        onClick={disable2fa}
                        disabled={busy || code.length < 6 || !password}
                        className="btn-secondary flex items-center gap-2 disabled:opacity-60"
                    >
                        <ShieldOff size={16} /> Disable 2FA
                    </button>
                </div>
            ) : setup ? (
                <div className="space-y-3">
                    {setup.qrDataUrl && (
                        <img src={setup.qrDataUrl} alt="Scan in authenticator app" className="w-44 h-44 rounded-lg border border-gray-200" />
                    )}
                    <p className="text-xs text-gray-500 break-all font-mono">{setup.secret}</p>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="6-digit code from app"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm"
                    />
                    <div className="flex gap-2">
                        <button type="button" onClick={confirmEnable} disabled={busy || code.length < 6} className="btn-primary disabled:opacity-60">
                            Confirm & enable
                        </button>
                        <button type="button" onClick={() => setSetup(null)} className="btn-secondary">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={startSetup} disabled={busy} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                    <Shield size={16} /> Enable 2FA
                </button>
            )}
        </div>
    );
};

const Settings = () => {
    const [values, setValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});

    useEffect(() => {
        settingsAPI.getAll()
            .then((res) => setValues(res.data?.data || {}))
            .catch(() => toast.error('Failed to load settings'))
            .finally(() => setLoading(false));
    }, []);

    const onChange = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

    const onSave = async (key, overrideValue) => {
        setSaving((p) => ({ ...p, [key]: true }));
        const tid = toast.loading('Saving…');
        try {
            const value = overrideValue !== undefined ? overrideValue : (values[key] ?? '');
            await settingsAPI.set(key, value);
            setValues((prev) => ({ ...prev, [key]: value }));
            toast.success(`${key} updated`, { id: tid });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed', { id: tid });
        } finally {
            setSaving((p) => ({ ...p, [key]: false }));
        }
    };

    if (loading) {
        return (
            <div className="loading-state" style={{ height: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="adventures-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <SettingsIcon size={28} className="inline mr-2" />
                        Settings
                    </h1>
                    <p className="page-subtitle">Site-wide configuration</p>
                </div>
            </div>

            <div className="grid gap-4 max-w-3xl">
                {SETTINGS_FIELDS.map((field) => (
                    <div key={field.key} className="bg-white rounded-2xl border border-gray-200 p-5">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            {field.label}
                            <span className="ml-2 text-[10px] uppercase tracking-widest text-gray-400 font-mono">{field.key}</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type={field.type}
                                value={values[field.key] ?? ''}
                                onChange={(e) => onChange(field.key, e.target.value)}
                                className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#D4AF37] focus:outline-none"
                            />
                            <button
                                onClick={() => onSave(field.key)}
                                disabled={saving[field.key]}
                                className="btn-primary flex items-center gap-2 disabled:opacity-60"
                            >
                                <Save size={16} /> {saving[field.key] ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                ))}

                <InstagramPostsEditor
                    value={values.instagram_posts}
                    onSave={(v) => onSave('instagram_posts', v)}
                />

                <Security2FAPanel />
            </div>
        </div>
    );
};

export default Settings;
