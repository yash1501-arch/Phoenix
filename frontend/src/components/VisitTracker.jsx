import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import { getCookieConsent } from './ui/CookieConsent';

const VISITOR_KEY = 'phx_vid';

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id || !/^[a-zA-Z0-9_-]{8,64}$/.test(id)) {
      id = `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return `v_${Date.now().toString(36)}`;
  }
}

/**
 * Anonymous pageview tracker for the public site.
 * Respects Do Not Track / reduced tracking where possible.
 */
const VisitTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return;
    const consent = getCookieConsent();
    if (consent !== 'all') return;

    const path = location.pathname || '/';
    // Skip auth/payment flows from polluting top pages too much? Still count them.
    const visitor_id = getVisitorId();
    const t = setTimeout(() => {
      api.post('/analytics/visit', { path, visitor_id }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return null;
};

export default VisitTracker;
