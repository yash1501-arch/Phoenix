/** Session token for cross-site API (Vercel SPA + Render API). Tab-scoped, not localStorage. */
const STORAGE_KEY = 'phoenix_session';
const CSRF_STORAGE_KEY = 'phoenix_csrf';
let sessionToken = null;
let cachedCsrf = null;

export function setSessionToken(token) {
    sessionToken = token || null;
    try {
        if (token) sessionStorage.setItem(STORAGE_KEY, token);
        else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // sessionStorage unavailable (private mode)
    }
}

export function getSessionToken() {
    if (sessionToken) return sessionToken;
    try {
        sessionToken = sessionStorage.getItem(STORAGE_KEY);
    } catch {
        sessionToken = null;
    }
    return sessionToken;
}

export function clearSessionToken() {
    sessionToken = null;
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
    clearCachedCsrf();
}

export function setCachedCsrf(token) {
    cachedCsrf = token || null;
    try {
        if (token) sessionStorage.setItem(CSRF_STORAGE_KEY, token);
        else sessionStorage.removeItem(CSRF_STORAGE_KEY);
    } catch {
        // sessionStorage unavailable (private mode)
    }
}

export function clearCachedCsrf() {
    cachedCsrf = null;
    try {
        sessionStorage.removeItem(CSRF_STORAGE_KEY);
    } catch {
        // ignore
    }
}

export function getCachedCsrf() {
    return cachedCsrf;
}

export function readCsrfFromDocument() {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfToken() {
    const fromDoc = readCsrfFromDocument();
    if (fromDoc) return fromDoc;
    if (cachedCsrf) return cachedCsrf;
    try {
        cachedCsrf = sessionStorage.getItem(CSRF_STORAGE_KEY);
    } catch {
        cachedCsrf = null;
    }
    return cachedCsrf;
}
