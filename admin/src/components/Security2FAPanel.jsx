import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Shield } from 'lucide-react';
import { twoFactorAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

/**
 * TOTP setup / status. Admins may be required to enable; clerks and members are optional.
 */
const Security2FAPanel = ({ title = 'Two-factor authentication', allowDisable = true }) => {
    const { setRequires2faSetup } = useAuth();
    const [enabled, setEnabled] = useState(false);
    const [recoveryLeft, setRecoveryLeft] = useState(0);
    const [required, setRequired] = useState(false);
    const [loading, setLoading] = useState(true);
    const [setup, setSetup] = useState(null);
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState(null);
    const [disablePassword, setDisablePassword] = useState('');

    const loadStatus = () => {
        twoFactorAPI.status()
            .then((res) => {
                const data = res.data?.data || {};
                setEnabled(Boolean(data.enabled));
                setRecoveryLeft(Number(data.recoveryCodesRemaining || 0));
                setRequired(Boolean(data.required));
            })
            .catch(() => toast.error('Could not load 2FA status'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadStatus(); }, []);

    const downloadRecoveryCodes = (codes) => {
        const lines = [
            'Phoenix Adventures — 2FA recovery codes',
            `Generated: ${new Date().toISOString()}`,
            '',
            'Store this file offline. Each code works once if you lose your authenticator app.',
            'Do not share these codes.',
            '',
            ...codes.map((c, i) => `${String(i + 1).padStart(2, '0')}. ${c}`),
            '',
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'phoenix-2fa-recovery-codes.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const startSetup = async () => {
        setBusy(true);
        try {
            const res = await twoFactorAPI.setup();
            setSetup(res.data?.data || null);
            setCode('');
            setRecoveryCodes(null);
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
            const res = await twoFactorAPI.enable(setup.secret, code);
            const codes = res.data?.data?.recoveryCodes || [];
            toast.success('Two-factor authentication enabled — download your recovery codes now');
            setSetup(null);
            setCode('');
            setEnabled(true);
            setRequires2faSetup?.(false);
            setRecoveryCodes(codes);
            setRecoveryLeft(codes.length);
            if (codes.length) downloadRecoveryCodes(codes);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid code');
        } finally {
            setBusy(false);
        }
    };

    const confirmDisable = async () => {
        if (!disablePassword) {
            toast.error('Enter your password to disable 2FA');
            return;
        }
        setBusy(true);
        try {
            await twoFactorAPI.disable('', disablePassword);
            toast.success('Two-factor authentication disabled');
            setEnabled(false);
            setDisablePassword('');
            setRecoveryLeft(0);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not disable 2FA');
        } finally {
            setBusy(false);
        }
    };

    const canDisable = allowDisable && enabled && !required;

    return (
        <div className="panel">
            <div className="panel-body">
                <h2 className="panel-title" style={{ fontSize: 'var(--text-lg)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={18} style={{ color: 'var(--ember)' }} />
                    {title}
                </h2>
                <p className="page-subtitle" style={{ marginTop: 0, marginBottom: '1rem' }}>
                    {required
                        ? 'Required for admin access. Scan the QR with Google Authenticator / Authy, then download your recovery codes and keep them offline.'
                        : 'Optional authenticator app protection. Download recovery codes when you enable 2FA.'}
                </p>

                {loading ? (
                    <p className="text-muted">Loading…</p>
                ) : recoveryCodes?.length ? (
                    <div className="settings-stack" style={{ maxWidth: 'none' }}>
                        <p style={{ margin: 0, color: 'var(--success)', fontWeight: 600 }}>
                            2FA is on. Save these recovery codes now — they are shown only once.
                        </p>
                        <pre
                            style={{
                                margin: 0,
                                padding: '0.85rem 1rem',
                                background: 'var(--mist, #f5f5f4)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                fontFamily: 'ui-monospace, monospace',
                                fontSize: '0.9rem',
                                lineHeight: 1.7,
                            }}
                        >
                            {recoveryCodes.join('\n')}
                        </pre>
                        <div className="page-actions" style={{ margin: 0 }}>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => downloadRecoveryCodes(recoveryCodes)}
                            >
                                <Save size={16} /> Download .txt
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setRecoveryCodes(null)}
                            >
                                I saved them
                            </button>
                        </div>
                    </div>
                ) : enabled ? (
                    <div className="settings-stack" style={{ maxWidth: 'none' }}>
                        <p style={{ margin: 0, color: 'var(--success)', fontWeight: 600 }}>2FA is enabled on this account.</p>
                        <p className="text-muted" style={{ margin: 0 }}>
                            Recovery codes remaining: <strong>{recoveryLeft}</strong>
                        </p>
                        <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                            If you lose your authenticator, sign in with a recovery code (XXXX-XXXX) on the login screen.
                            {required
                                ? ' If those are gone too, use emergency reset on the server (node scripts/resetAdmin2fa.js). 2FA cannot be turned off while it is required.'
                                : ''}
                        </p>
                        {canDisable && (
                            <div className="settings-field-row" style={{ marginTop: '0.75rem' }}>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Password to disable 2FA"
                                    value={disablePassword}
                                    onChange={(e) => setDisablePassword(e.target.value)}
                                />
                                <button type="button" className="btn-secondary" disabled={busy} onClick={confirmDisable}>
                                    Disable 2FA
                                </button>
                            </div>
                        )}
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

export default Security2FAPanel;
