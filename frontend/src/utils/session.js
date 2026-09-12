/** Session token for cross-site API (Vercel SPA + Render API). Tab-scoped, not localStorage. */
const STORAGE_KEY = 'phoenix_session';
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
}

export function setCachedCsrf(token) {
    cachedCsrf = token || null;
}

export function getCachedCsrf() {
    return cachedCsrf;
}

export function readCsrfFromDocument() {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfToken() {
    return readCsrfFromDocument() || cachedCsrf;
}
