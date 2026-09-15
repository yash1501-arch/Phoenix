import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    // eslint-disable-next-line no-unused-vars
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'white', backgroundColor: '#333', maxWidth: '48rem' }}>
                    <h1>Something went wrong.</h1>
                    <p style={{ marginTop: '0.75rem', marginBottom: '1rem', opacity: 0.9 }}>
                        Try a hard refresh (Ctrl+Shift+R) or reopen this page in a new tab. If you were paying by UPI,
                        your booking is still saved — open it again from My trips.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        style={{
                            marginBottom: '1rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            background: '#c45c26',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Reload page
                    </button>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
