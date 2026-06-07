const { getConvexClient } = require('../utils/convexClient');

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
        await getConvexClient().setSetting(key, String(value ?? ''));
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to save setting' });
    }
};

// Public read for a single whitelisted key. No auth required.
// Whitelist anything safe to expose to the world.
const PUBLIC_KEYS = new Set(['instagram_posts', 'instagram_handle', 'site_name', 'contact_email', 'whatsapp', 'instagram', 'maps_url', 'cancellation_window_days', 'advance_per_person']);

exports.getPublic = async (req, res) => {
    try {
        const { key } = req.query;
        if (!key) {
            // Return the whole public set (useful for the footer/SEO components)
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
