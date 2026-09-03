import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import useFocusTrap from '../../hooks/useFocusTrap';

/**
 * Confirmation dialog for destructive actions.
 *
 * Deleting a course or a section wipes notes, quizzes and progress, so it gets
 * a real dialog that spells out what goes away rather than a browser confirm().
 */
export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    consequences = [],
    confirmLabel = 'Delete',
    busyLabel = 'Deleting...',
    isBusy = false,
    error = null,
}) {
    // Closing mid-request would leave the spinner orphaned, so the dialog stays
    // put until the request settles.
    const requestClose = () => { if (!isBusy) onClose?.(); };
    const trapRef = useFocusTrap(isOpen, requestClose);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-start justify-center p-4 pt-20 sm:pt-28 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm" onClick={requestClose} />
            <div
                ref={trapRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                className="relative w-full max-w-md clay rounded-clay-lg overflow-hidden animate-in slide-in-from-top-4 duration-300"
            >
                <div className="p-5 border-b border-border bg-surface-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-danger">
                        <AlertTriangle className="w-5 h-5" />
                        <span id="confirm-dialog-title" className="font-black uppercase tracking-widest text-sm">
                            {title}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={requestClose}
                        disabled={isBusy}
                        aria-label="Cancel"
                        className="p-2 hover:bg-surface-3 rounded-clay-sm transition-colors disabled:opacity-40"
                    >
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-text-secondary leading-relaxed">{message}</p>

                    {consequences.length > 0 && (
                        <ul className="p-4 bg-surface-2 rounded-clay clay-sm space-y-2 text-sm text-text-secondary">
                            {consequences.map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                    <span className="text-danger font-black leading-none mt-0.5">&times;</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <p className="text-xs font-bold uppercase tracking-widest text-danger">
                        This cannot be undone.
                    </p>

                    {error && (
                        <div className="p-3 rounded-clay-sm bg-danger/10 border border-danger/20 text-sm text-danger">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            type="button"
                            onClick={requestClose}
                            disabled={isBusy}
                            className="py-3 px-4 rounded-clay bg-surface-2 clay-sm text-xs font-black uppercase tracking-widest text-text-primary hover:bg-surface-3 transition-colors disabled:opacity-40"
                        >
                            Keep it
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isBusy}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-clay bg-danger text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100"
                        >
                            {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isBusy ? busyLabel : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
