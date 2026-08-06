import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Settings as SettingsIcon, Plus, Trash2, Instagram, ExternalLink, Shield, ShieldOff } from 'lucide-react';
import { settingsAPI, twoFactorAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

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
        <div className="panel">
            <div className="panel-body">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Instagram size={16} style={{ color: '#db2777' }} />
                    Instagram posts (Gallery feed)
                    <span className="settings-key">instagram_posts</span>
                </label>
                <p className="page-subtitle" style={{ marginTop: 0, marginBottom: '1rem' }}>
                    Paste the URLs of Instagram posts or reels you want to feature. They render as embeds on the public Gallery page.
                </p>

                <div className="settings-inline-row" style={{ marginBottom: '0.75rem' }}>
                    <input
                        type="url"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                        placeholder="https://www.instagram.com/p/ABC123/"
                        className="form-input"
                    />
                    <button type="button" onClick={add} className="btn-secondary">
                        <Plus size={16} /> Add
                    </button>
                </div>

                {items.length === 0 ? (
                    <p className="text-muted" style={{ margin: '0 0 1rem' }}>No posts added yet.</p>
                ) : (
                    <ul className="list-stack" style={{ marginBottom: '1rem', listStyle: 'none', padding: 0 }}>
                        {items.map((url, i) => (
                            <li key={i} className="list-card" style={{ padding: '0.65rem 0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                                    <Instagram size={14} style={{ color: '#db2777', flexShrink: 0 }} />
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    >
                                        {url}
                                    </a>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="btn-icon" aria-label="Open on Instagram">
                                        <ExternalLink size={14} />
                                    </a>
                                    <button type="button" onClick={() => remove(i)} className="btn-icon danger" aria-label="Remove">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <button type="button" onClick={save} disabled={saving} className="btn-primary">
                    <Save size={16} /> {saving ? 'Saving…' : 'Save Instagram feed'}
                </button>
            </div>
        </div>
    );
};

const Security2FAPanel = () => {
    const { setRequires2faSetup } = useAuth();
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
            setRequires2faSetup(false);
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
        <div className="panel">
            <div className="panel-body">
                <h2 className="panel-title" style={{ fontSize: 'var(--text-lg)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={18} style={{ color: 'var(--ember)' }} />
                    Admin two-factor authentication
                </h2>
                <p className="page-subtitle" style={{ marginTop: 0, marginBottom: '1rem' }}>
                    Protect admin login with Google Authenticator, Authy, or any TOTP app.
                </p>

                {loading ? (
                    <p className="text-muted">Loading…</p>
                ) : enabled ? (
                    <div className="settings-stack" style={{ maxWidth: 'none' }}>
                        <p style={{ margin: 0, color: 'var(--success)', fontWeight: 600 }}>2FA is enabled on this account.</p>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Current 6-digit code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="form-input"
                        />
                        <input
                            type="password"
                            placeholder="Account password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                        />
                        <button
                            type="button"
                            onClick={disable2fa}
                            disabled={busy || code.length < 6 || !password}
                            className="btn-secondary"
                        >
                            <ShieldOff size={16} /> Disable 2FA
                        </button>
                    </div>
                ) : setup ? (
                    <div className="settings-stack" style={{ maxWidth: 'none' }}>
                        {setup.qrDataUrl && (
                            <img src={setup.qrDataUrl} alt="Scan in authenticator app" style={{ width: '11rem', height: '11rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                        )}
                        <p className="text-muted" style={{ margin: 0, wordBreak: 'break-all', fontFamily: 'ui-monospace, monospace', fontSize: 'var(--text-xs)' }}>{setup.secret}</p>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="6-digit code from app"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="form-input"
                        />
                        <div className="page-actions" style={{ margin: 0 }}>
                            <button type="button" onClick={confirmEnable} disabled={busy || code.length < 6} className="btn-primary">
                                Confirm & enable
                            </button>
                            <button type="button" onClick={() => setSetup(null)} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button type="button" onClick={startSetup} disabled={busy} className="btn-primary">
                        <Shield size={16} /> Enable 2FA
                    </button>
                )}
            </div>
        </div>
    );
};

const Settings = () => {
    const { requires2faSetup } = useAuth();
    const [values, setValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});

    useEffect(() => {
        if (requires2faSetup) {
            setLoading(false);
            return;
        }
        settingsAPI.getAll()
            .then((res) => setValues(res.data?.data || {}))
            .catch(() => toast.error('Failed to load settings'))
            .finally(() => setLoading(false));
    }, [requires2faSetup]);

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
        <div className="settings-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <SettingsIcon size={24} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
                        Settings
                    </h1>
                    <p className="page-subtitle">Site-wide configuration</p>
                </div>
            </div>

            <div className="settings-stack">
                {requires2faSetup && (
                    <div className="error-message" style={{ marginBottom: '0.5rem' }}>
                        Set up two-factor authentication below to unlock the rest of the admin panel.
                    </div>
                )}

                {!requires2faSetup && SETTINGS_FIELDS.map((field) => (
                    <div key={field.key} className="panel">
                        <div className="panel-body">
                            <label className="form-label">
                                {field.label}
                                <span className="settings-key">{field.key}</span>
                            </label>
                            <div className="settings-field-row">
                                <input
                                    type={field.type}
                                    value={values[field.key] ?? ''}
                                    onChange={(e) => onChange(field.key, e.target.value)}
                                    className="form-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => onSave(field.key)}
                                    disabled={saving[field.key]}
                                    className="btn-primary"
                                >
                                    <Save size={16} /> {saving[field.key] ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {!requires2faSetup && (
                    <InstagramPostsEditor
                        value={values.instagram_posts}
                        onSave={(v) => onSave('instagram_posts', v)}
                    />
                )}

                <Security2FAPanel />
            </div>
        </div>
    );
};

export default Settings;
