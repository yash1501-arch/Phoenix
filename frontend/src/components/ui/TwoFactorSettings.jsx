import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Loader, Save } from 'lucide-react';
import { twoFactorAPI } from '../../utils/api';

/** Optional TOTP for members. Never required by ADMIN_REQUIRE_2FA. */
const TwoFactorSettings = () => {
  const [enabled, setEnabled] = useState(false);
  const [recoveryLeft, setRecoveryLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    twoFactorAPI.status()
      .then((res) => {
        const data = res.data?.data || {};
        setEnabled(Boolean(data.enabled));
        setRecoveryLeft(Number(data.recoveryCodesRemaining || 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const downloadCodes = (codes) => {
    const blob = new Blob(
      [
        ['Phoenix Adventures — 2FA recovery codes', '', ...codes].join('\n'),
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'phoenix-2fa-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const startSetup = async () => {
    setBusy(true);
    try {
      const res = await twoFactorAPI.setup();
      setSetup(res.data?.data || null);
      setCode('');
    } catch {
      toast.error('Could not start 2FA setup');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async () => {
    if (!setup?.secret) return;
    setBusy(true);
    try {
      const res = await twoFactorAPI.enable(setup.secret, code);
      const codes = res.data?.data?.recoveryCodes || [];
      setSetup(null);
      setEnabled(true);
      setRecoveryCodes(codes);
      setRecoveryLeft(codes.length);
      if (codes.length) downloadCodes(codes);
      toast.success('Two-factor authentication enabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  const confirmDisable = async () => {
    setBusy(true);
    try {
      await twoFactorAPI.disable('', password);
      setEnabled(false);
      setPassword('');
      setRecoveryLeft(0);
      toast.success('Two-factor authentication disabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not disable 2FA');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-mist-subtle rounded-lg p-6 md:p-8 border border-stone/8 shadow-smoke">
      <div className="flex items-center gap-3 mb-1">
        <ShieldCheck size={20} className="text-ember" />
        <h3 className="font-display text-xl font-semibold text-stone">Two-factor authentication</h3>
      </div>
      <p className="text-sm text-muted mb-6">
        Optional. Protect your login with Google Authenticator / Authy. We never require this for members.
      </p>

      {recoveryCodes?.length ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-moss">Save these recovery codes now — they are shown only once.</p>
          <pre className="text-sm bg-mist p-3 rounded-md overflow-x-auto">{recoveryCodes.join('\n')}</pre>
          <button type="button" className="btn btn-primary" onClick={() => downloadCodes(recoveryCodes)}>
            <Save size={16} /> Download
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setRecoveryCodes(null)}>
            I saved them
          </button>
        </div>
      ) : enabled ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-moss">2FA is on. Recovery codes left: {recoveryLeft}</p>
          <input
            type="password"
            className="input"
            placeholder="Password to disable"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" className="btn btn-outline" disabled={busy || !password} onClick={confirmDisable}>
            Disable 2FA
          </button>
        </div>
      ) : setup ? (
        <div className="space-y-3">
          {setup.qrDataUrl && (
            <img src={setup.qrDataUrl} alt="Authenticator QR" className="w-40 h-40 rounded-md border border-stone/10" />
          )}
          <p className="text-xs font-mono break-all text-muted">{setup.secret}</p>
          <input
            type="text"
            inputMode="numeric"
            className="input"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary" disabled={busy || code.length < 6} onClick={confirmEnable}>
              {busy ? <Loader size={16} className="spinning" /> : null}
              Enable
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setSetup(null)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={startSetup}>
          Enable 2FA
        </button>
      )}
    </div>
  );
};

export default TwoFactorSettings;
