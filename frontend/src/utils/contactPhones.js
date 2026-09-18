/** Parse contact_phones from API (array or JSON string). */
export function parseContactPhones(adventure) {
    const raw = adventure?.contact_phones;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((p) => String(p).trim()).filter(Boolean);
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.map((p) => String(p).trim()).filter(Boolean) : [];
        } catch {
            return raw.trim() ? [raw.trim()] : [];
        }
    }
    return [];
}

export function telHref(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length === 10) return `tel:+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `tel:+${digits}`;
    return `tel:+${digits}`;
}

export function displayPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 10) {
        return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    if (digits.length === 12 && digits.startsWith('91')) {
        return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    }
    return String(phone || '').trim();
}
