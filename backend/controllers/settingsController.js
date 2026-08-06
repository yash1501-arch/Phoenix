const { getConvexClient } = require('../utils/convexClient');

// Public keys (also writable by admin)
const PUBLIC_KEYS = new Set([
    'instagram_posts', 'instagram_handle', 'instagram_url', 'instagram',
    'facebook_url', 'youtube_url',
    'google_maps_url', 'google_place_id', 'google_lat', 'google_lng',
    'google_rating', 'google_review_count', 'google_reviews',
    'site_name', 'site_tagline', 'tagline', 'contact_email', 'contact_phone',
    'contact_phone_secondary', 'contact_address', 'contact_hours', 'whatsapp',
    'maps_url', 'established', 'cancellation_window_days', 'advance_per_person',
    'upi_id', 'upi_payee_name', 'seat_hold_minutes',
]);

// Admin-only keys (not exposed via public read)
const ADMIN_ONLY_KEYS = new Set([
    'maintenance_mode',
    'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from',
]);

const ALLOWED_WRITE_KEYS = new Set([...PUBLIC_KEYS, ...ADMIN_ONLY_KEYS]);

exports.getAll = async (req, res) => {
    try {
        const data = await getConvexClient().getSettings();
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
};

exports.set = async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ success: false, message: 'key is required' });
        if (!ALLOWED_WRITE_KEYS.has(key)) {
            return res.status(400).json({ success: false, message: `Setting key "${key}" is not allowed` });
        }
        await getConvexClient().setSetting(key, String(value ?? ''));
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to save setting' });
    }
};

exports.getPublic = async (req, res) => {
    try {
        const { key } = req.query;
        if (!key) {
            const all = await getConvexClient().getSettings();
            const filtered = {};
            for (const k of PUBLIC_KEYS) {
                if (all && all[k] != null) filtered[k] = all[k];
            }
            return res.json({ success: true, data: filtered });
        }
        if (!PUBLIC_KEYS.has(key)) {
            return res.status(403).json({ success: false, message: 'Key not publicly accessible' });
        }
        const all = await getConvexClient().getSettings();
        const value = all && all[key] != null ? all[key] : null;
        return res.json({ success: true, data: { key, value } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch public setting' });
    }
};

exports.PUBLIC_KEYS = PUBLIC_KEYS;
exports.ALLOWED_WRITE_KEYS = ALLOWED_WRITE_KEYS;
