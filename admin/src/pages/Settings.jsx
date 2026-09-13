import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Settings as SettingsIcon, Plus, Trash2, Instagram, ExternalLink } from 'lucide-react';
import { settingsAPI } from '../utils/api';
import Security2FAPanel from '../components/Security2FAPanel';

const SETTINGS_FIELDS = [
    { key: 'site_name', label: 'Site Name', type: 'text' },
    { key: 'site_tagline', label: 'Tagline', type: 'text' },
    { key: 'contact_email', label: 'Contact Email', type: 'email' },
    { key: 'contact_phone', label: 'Contact Phone', type: 'tel' },
    { key: 'whatsapp', label: 'WhatsApp (with +countrycode)', type: 'tel' },
    { key: 'instagram', label: 'Instagram URL', type: 'url' },
    { key: 'instagram_handle', label: 'Instagram handle (e.g. @phoenixadventures)', type: 'text' },
    { key: 'maps_url', label: 'Google Maps URL', type: 'url' },
    { key: 'advance_per_person', label: 'Tour advance per person (₹)', type: 'number', help: 'Default UPI advance per seat for tours. A tour can override this. Treks/camping pay in full.' },
    { key: 'cancellation_window_days', label: 'Cancellation window (days)', type: 'number', help: 'Minimum days before departure for travellers to self-cancel a confirmed booking. Default 14. Used in the app and shown on Refund Policy / Terms / FAQ.' },
    { key: 'seat_hold_minutes', label: 'Seat hold (minutes)', type: 'number', help: 'How long unpaid checkout holds a seat. Default 15. Shown on the UPI payment page.' },
    { key: 'upi_id', label: 'UPI ID (FAQ / legal copy only)', type: 'text', help: 'Shown on FAQ and policies. Checkout always pays 9372506447@sbi — changing this field does not change the QR or Open UPI App.' },
    { key: 'upi_payee_name', label: 'UPI payee name (FAQ / legal copy only)', type: 'text', help: 'Checkout payee is always PHEONIX ADVENTURES LLP in code. Public brand remains Phoenix Adventures.' },
    { key: 'maintenance_mode', label: 'Maintenance mode (true/false)', type: 'text' },
];

const isValidInstagramUrl = (u) =>
    typeof u === 'string' && /instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]{6,}/i.test(u);

const normalizePostItem = (item) => {
    if (!item) return null;
    if (typeof item === 'string') {
        const cleaned = item.trim().split(/[?#]/)[0].replace(/\/+$/, '');
        if (!cleaned) return null;
        const url = `${cleaned}/`;
        return isValidInstagramUrl(url) ? { url, image: '' } : null;
    }
    if (typeof item === 'object') {
        const raw = String(item.url || item.href || item.link || '').trim();
        const cleaned = raw.split(/[?#]/)[0].replace(/\/+$/, '');
        if (!cleaned) return null;
        const url = `${cleaned}/`;
        if (!isValidInstagramUrl(url)) return null;
        const image = String(item.image || item.thumb || item.thumbnail || '').trim();
        return { url, image };
    }
    return null;
};

const InstagramPostsEditor = ({ value, onSave }) => {
    const parseValue = (v) => {
        try {
            const parsed = v ? JSON.parse(v) : [];
            if (!Array.isArray(parsed)) return [];
            return parsed.map(normalizePostItem).filter(Boolean);
        } catch {
            return [];
        }
    };

    const [items, setItems] = useState(() => parseValue(value));
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setItems(parseValue(value));
    }, [value]);

    const add = () => {
        const next = normalizePostItem(draft);
        if (!next) {
            toast.error("That doesn't look like a valid Instagram post or reel URL");
            return;
        }
        if (items.some((u) => u.url.replace(/\/+$/, '') === next.url.replace(/\/+$/, ''))) {
            toast.error('Already added');
            return;
        }
        setItems([...items, next]);
        setDraft('');
    };

    const remove = (i) => setItems(items.filter((_, idx) => idx !== i));

    const setCover = (i, image) => {
        setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, image } : item)));
    };

    const save = async () => {
        setSaving(true);
        const tid = toast.loading('Saving Instagram feed…');
        try {
            // Persist objects so optional cover images survive; still works with string-only clients.
            const payload = items.map(({ url, image }) => (image ? { url, image } : url));
            await onSave(JSON.stringify(payload));
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
                    Paste full post/reel links. The public Gallery shows a tight photo mosaic.
                    Optional cover image URL (Cloudinary / direct JPG) fills the tile when Instagram blocks auto-thumbnails.
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
                        {items.map((item, i) => (
                            <li key={item.url} className="list-card" style={{ padding: '0.75rem 0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, marginBottom: '0.5rem' }}>
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt=""
                                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                                        />
                                    ) : (
                                        <Instagram size={14} style={{ color: '#db2777', flexShrink: 0 }} />
                                    )}
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    >
                                        {item.url}
                                    </a>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-icon" aria-label="Open on Instagram">
                                        <ExternalLink size={14} />
                                    </a>
                                    <button type="button" onClick={() => remove(i)} className="btn-icon danger" aria-label="Remove">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <input
                                    type="url"
                                    value={item.image || ''}
                                    onChange={(e) => setCover(i, e.target.value)}
                                    placeholder="Optional cover image URL (Cloudinary JPG/PNG)"
                                    className="form-input"
                                    style={{ fontSize: '0.85rem' }}
                                />
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
                {SETTINGS_FIELDS.map((field) => (
                    <div key={field.key} className="panel">
                        <div className="panel-body">
                            <label className="form-label">
                                {field.label}
                                <span className="settings-key">{field.key}</span>
                            </label>
                            {field.help && (
                                <p className="page-subtitle" style={{ marginTop: 0, marginBottom: '0.65rem' }}>{field.help}</p>
                            )}
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

                <InstagramPostsEditor
                    value={values.instagram_posts}
                    onSave={(v) => onSave('instagram_posts', v)}
                />

                <Security2FAPanel title="Admin two-factor authentication" />
            </div>
        </div>
    );
};

export default Settings;
