import { useEffect, useRef } from 'react';

/**
 * Lightweight focus trap hook for modals/dialogs.
 * Traps Tab/Shift+Tab focus within the container ref.
 * Also closes on Escape (calls onClose).
 *
 * Usage:
 *   const trapRef = useFocusTrap(isOpen, onClose);
 *   <div ref={trapRef} role="dialog" aria-modal="true"> ... </div>
 */
export default function useFocusTrap(isOpen, onClose) {
    const containerRef = useRef(null);
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        // Save the currently focused element to restore later
        previousFocusRef.current = document.activeElement;

        const container = containerRef.current;
        if (!container) return;

        // Focus the first focusable element inside the container
        const focusableSelector =
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

        const focusFirst = () => {
            const firstFocusable = container.querySelector(focusableSelector);
            if (firstFocusable) firstFocusable.focus();
        };

        // Small delay to allow DOM to render
        const timer = requestAnimationFrame(focusFirst);

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose?.();
                return;
            }

            if (e.key !== 'Tab') return;

            const focusableEls = container.querySelectorAll(focusableSelector);
            if (focusableEls.length === 0) return;

            const firstEl = focusableEls[0];
            const lastEl = focusableEls[focusableEls.length - 1];

            if (e.shiftKey) {
                // Shift+Tab: if on first element, wrap to last
                if (document.activeElement === firstEl) {
                    e.preventDefault();
                    lastEl.focus();
                }
            } else {
                // Tab: if on last element, wrap to first
                if (document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            cancelAnimationFrame(timer);
            document.removeEventListener('keydown', handleKeyDown, true);

            // Restore focus to the element that opened the modal
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
        };
    }, [isOpen, onClose]);

    return containerRef;
}
