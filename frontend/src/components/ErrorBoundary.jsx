import React from 'react';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';
import clientLog from '../utils/clientLogger';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null, copied: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // Send the full crash report to the central logger — console, localStorage,
        // and (best-effort) the backend /api/logs/client endpoint.
        clientLog.error('React ErrorBoundary caught', error, {
            componentStack: info?.componentStack,
            href: typeof window !== 'undefined' ? window.location.href : null,
        });
        this.setState({ info });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, info: null });
        window.location.href = '/dashboard';
    };

    copyDebug = async () => {
        const dump = {
            message: this.state.error?.toString(),
            stack: this.state.error?.stack,
            componentStack: this.state.info?.componentStack,
            href: window.location.href,
            ua: navigator.userAgent,
            clientRequestId: clientLog.requestId,
            recentLogs: clientLog.getStored().slice(-20),
        };
        try {
            await navigator.clipboard.writeText(JSON.stringify(dump, null, 2));
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 1500);
        } catch { /* clipboard unavailable */ }
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
                        <p className="text-text-secondary text-sm mb-2">
                            An unexpected error occurred. Your progress has been saved.
                        </p>
                        <p className="text-[10px] text-text-muted font-mono mb-6 break-all">
                            Ref: {clientLog.requestId}
                        </p>
                        {import.meta.env.DEV && this.state.error && (
                            <pre className="text-xs text-[#ff4444] bg-surface-2 rounded-clay-sm p-3 text-left mb-4 overflow-auto max-h-40 border border-[#ff4444]/20 font-mono">
                                {this.state.error.toString()}
                                {this.state.info?.componentStack && (
                                    <>{'\n\n'}{this.state.info.componentStack}</>
                                )}
                            </pre>
                        )}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={this.handleReset}
                                className="btn-primary flex items-center gap-2 mx-auto"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Back to Dashboard
                            </button>
                            <button
                                onClick={this.copyDebug}
                                className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1.5 mx-auto"
                            >
                                <Copy className="w-3 h-3" />
                                {this.state.copied ? 'Copied debug info' : 'Copy debug info'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
