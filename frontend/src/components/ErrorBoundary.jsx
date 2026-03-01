import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-bg flex items-center justify-center p-6 font-body">
                    <div className="card max-w-md w-full text-center p-10">
                        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-6 border border-danger/20">
                            <AlertTriangle className="w-8 h-8 text-danger" />
                        </div>
                        <h1 className="text-xl font-display font-bold text-text-primary mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-text-secondary text-sm mb-6">
                            An unexpected error occurred. Your progress has been saved.
                        </p>
                        {import.meta.env.DEV && this.state.error && (
                            <pre className="text-xs text-danger/80 bg-surface-2 rounded-lg p-3 text-left mb-6 overflow-auto max-h-32">
                                {this.state.error.toString()}
                            </pre>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="btn-primary flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
