import Security2FAPanel from '../components/Security2FAPanel';

const Security = () => (
    <div className="settings-page">
        <div className="page-header">
            <p className="page-subtitle" style={{ marginTop: 0 }}>
                Optional authenticator for your staff login. Full site settings stay with the founder admin.
            </p>
        </div>
        <Security2FAPanel title="Account two-factor authentication" />
    </div>
);

export default Security;
