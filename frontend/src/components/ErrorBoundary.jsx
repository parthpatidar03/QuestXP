import React from 'react';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';
import clientLog from '../utils/clientLogger';

// A stale JS chunk after a redeploy (or a dev-server restart) fails to import
// rather than throwing a "real" bug. That's recoverable with a single reload,
// so we retry once automatically instead of dropping the user on a crash page.
const CHUNK_ERROR_RE = /failed to fetch dynamically imported module|loading chunk .* failed|importing a module script failed/i;
const CHUNK_RETRY_KEY = 'questxp_chunk_reload';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null, copied: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidMount() {
        // Reaching a normal mount means the page loaded fine — clear the
        // one-shot retry guard so a future stale-chunk error can retry again.
        try { sessionStorage.removeItem(CHUNK_RETRY_KEY); } catch { /* noop */ }
    }

    componentDidCatch(error, info) {
        if (CHUNK_ERROR_RE.test(error?.message || '')) {
            try {
                if (!sessionStorage.getItem(CHUNK_RETRY_KEY)) {
                    sessionStorage.setItem(CHUNK_RETRY_KEY, '1');
                    window.location.reload();
                    return;
                }
            } catch { /* sessionStorage unavailable — fall through to crash page */ }
        }

        // Send the full crash report to the central logger — console, localStorage,
        // and (best-effort) the backend /api/logs/client endpoint. Never render
        // this content in the UI: a raw stack trace can leak backend internals.
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
