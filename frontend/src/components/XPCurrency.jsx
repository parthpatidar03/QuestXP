/**
 * XPCurrency — renders XP as a styled currency amount.
 * Usage: <XPCurrency amount={1250} /> → 🪙 1,250
 *
 * Props:
 *   amount  — number
 *   size    — 'xs' | 'sm' | 'md' | 'lg' | 'xl'  (default: 'sm')
 *   sign    — '+' | '-' | ''                      (default: '')
 *   inline  — bool — render as inline-flex (default: true)
 *   className — extra classes
 */

const SIZE_MAP = {
    xs: { text: 'text-[11px]', coin: 10 },
    sm: { text: 'text-sm',     coin: 13 },
    md: { text: 'text-base',   coin: 15 },
    lg: { text: 'text-lg',     coin: 17 },
    xl: { text: 'text-2xl',    coin: 22 },
};

const XPCurrency = ({ amount = 0, size = 'sm', sign = '', inline = true, className = '' }) => {
    const { text, coin } = SIZE_MAP[size] || SIZE_MAP.sm;
    const formatted = Number(amount).toLocaleString();

    return (
        <span
            className={`${inline ? 'inline-flex' : 'flex'} items-center gap-1.5 font-mono font-bold tabular-nums ${text} text-gold ${className}`}
            aria-label={`${sign}${formatted} XP`}
        >
            {/* The XP spark from the QuestXP mark — same shape, small. */}
            <svg width={coin} height={coin} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
                <path d="M12 1.5c1.2 6.7 2.6 8.1 9.3 9.3-6.7 1.2-8.1 2.6-9.3 9.3-1.2-6.7-2.6-8.1-9.3-9.3 6.7-1.2 8.1-2.6 9.3-9.3z" />
            </svg>
            <span>{sign}{formatted}</span>
        </span>
    );
};

export default XPCurrency;
