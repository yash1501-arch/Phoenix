import { FileText, Loader, Upload, X, Mail } from 'lucide-react';

export const BrochurePdfImport = ({ loading, onUpload }) => (
    <div className="form-section pdf-import-section">
        <h2 className="section-title">Import from brochure PDF</h2>
        <p className="form-help section-help">
            Upload your trek brochure PDF to auto-fill title, dates, pickup points, packing list, and other fields below.
        </p>
        <label className={`pdf-upload-box ${loading ? 'is-loading' : ''}`}>
            <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={onUpload}
                disabled={loading}
                className="pdf-upload-input"
            />
            <div className="pdf-upload-content">
                {loading ? (
                    <>
                        <Loader className="spinning" size={28} />
                        <span>Reading PDF and filling fields…</span>
                    </>
                ) : (
                    <>
                        <FileText size={28} />
                        <span className="pdf-upload-title">Choose brochure PDF</span>
                        <span className="pdf-upload-hint">Fields below will update automatically</span>
                    </>
                )}
            </div>
        </label>
    </div>
);

export const ConfirmationPdfField = ({
    confirmationFileName,
    existingConfirmationUrl,
    removeConfirmation,
    onConfirmationChange,
    onRemoveConfirmation,
}) => (
    <div className="form-section pdf-confirmation-section">
        <h2 className="section-title">
            <Mail size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Confirmation PDF
        </h2>
        <p className="form-help section-help">
            Sent to customers by email and WhatsApp after payment is verified. Never shown on the public website.
        </p>

        {(existingConfirmationUrl || confirmationFileName) && !removeConfirmation ? (
            <div className="pdf-current-file">
                <FileText size={18} />
                <span className="pdf-current-name">
                    {confirmationFileName || 'Confirmation PDF on file'}
                </span>
                {existingConfirmationUrl && (
                    <a
                        href={existingConfirmationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pdf-preview-link"
                    >
                        Preview
                    </a>
                )}
                <button type="button" className="pdf-remove-btn" onClick={onRemoveConfirmation}>
                    <X size={16} /> Remove
                </button>
            </div>
        ) : (
            <label className="pdf-upload-box pdf-upload-box--secondary">
                <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={onConfirmationChange}
                    className="pdf-upload-input"
                />
                <div className="pdf-upload-content">
                    <Upload size={24} />
                    <span className="pdf-upload-title">Upload confirmation PDF</span>
                    <span className="pdf-upload-hint">Attached when booking is confirmed</span>
                </div>
            </label>
        )}
    </div>
);
