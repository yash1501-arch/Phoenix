import React from 'react';
import { Wrench } from 'lucide-react';

const Maintenance = ({ message }) => (
    <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1810 100%)',
        color: '#faf7f1',
        textAlign: 'center',
    }}>
        <div style={{ maxWidth: '480px' }}>
            <Wrench size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.8 }} />
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                Under Maintenance
            </h1>
            <p style={{ opacity: 0.85, lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {message || 'We are performing scheduled maintenance. Please check back shortly.'}
            </p>
            <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                    background: '#f0591e',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 500,
                }}
            >
                Try again
            </button>
        </div>
    </div>
);

export default Maintenance;
