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
    xs: { text: 'text-[10px]', coin: 'text-[11px]' },
    sm: { text: 'text-sm',     coin: 'text-sm'      },
    md: { text: 'text-base',   coin: 'text-base'    },
    lg: { text: 'text-lg',     coin: 'text-lg'      },
    xl: { text: 'text-2xl',    coin: 'text-2xl'     },
};

const XPCurrency = ({ amount = 0, size = 'sm', sign = '', inline = true, className = '' }) => {
    const { text, coin } = SIZE_MAP[size] || SIZE_MAP.sm;
    const formatted = Number(amount).toLocaleString();

    return (
        <span
            className={`${inline ? 'inline-flex' : 'flex'} items-center gap-0.5 font-black tabular-nums ${text} text-gold ${className}`}
            aria-label={`${sign}${formatted} XP`}
        >
            <span className={`${coin} leading-none`}>🪙</span>
            <span>{sign}{formatted}</span>
        </span>
    );
};

export default XPCurrency;
