/**
 * Browser-side logger.
 *
 *  - Every error/warn/info gets a structured, timestamped console message
 *    so you can read it during dev with full context.
 *  - Captures `window.onerror` and `unhandledrejection` so silent bugs
 *    become loud.
 *  - Captures `console.error` / `console.warn` calls so 3rd-party libs
 *    that just yell into the console end up reported too.
 *  - Ships error/warn entries to `POST /api/logs/client` (batched, debounced).
 *  - Keeps the last 50 entries in localStorage so you can ask the user to
 *    paste a "debug dump" if needed.
 *  - Generates a per-tab `clientRequestId` so reports can be correlated
 *    with backend logs via the `X-Request-Id` header.
 */

const STORAGE_KEY = 'questxp:logs';
const MAX_STORED = 50;
const FLUSH_INTERVAL_MS = 4000;
const SHIP_LEVELS = new Set(['error', 'warn']);

const clientRequestId = (() => {
    try {
        const k = 'questxp:cid';
        const cached = sessionStorage.getItem(k);
        if (cached) return cached;
        const id = `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem(k, id);
        return id;
    } catch {
        return `c-${Date.now().toString(36)}`;
    }
})();

const safeStringify = (v) => {
    try { return typeof v === 'string' ? v : JSON.stringify(v); }
    catch { return String(v); }
};

const composeMessage = (args) =>
    args.map(a => {
        if (a instanceof Error) return `${a.name}: ${a.message}`;
        if (a && typeof a === 'object') return safeStringify(a);
        return String(a);
    }).join(' ');

const composeStack = (args) => {
    for (const a of args) {
        if (a instanceof Error && a.stack) return a.stack;
    }
    return undefined;
};

const readStored = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
};

const writeStored = (entries) => {
    try {
        const trimmed = entries.slice(-MAX_STORED);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch { /* quota — fine */ }
};

// Capture native console methods up front so our own printing never recurses
// into the wrappers we install in installGlobalHandlers().
const nativeConsole = {
    error: console.error.bind(console),
    warn:  console.warn.bind(console),
    info:  console.info.bind(console),
    debug: console.debug ? console.debug.bind(console) : console.log.bind(console),
    log:   console.log.bind(console),
};

let queue = [];
let flushTimer = null;

const scheduleFlush = () => {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
};

const flush = async () => {
    flushTimer = null;
    if (queue.length === 0) return;
    const batch = queue.splice(0, queue.length);

    // We deliberately use fetch + keepalive so logs survive a page unload.
    for (const entry of batch) {
        try {
            await fetch('/api/logs/client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry),
                keepalive: true,
                credentials: 'include',
            });
        } catch (_) {
            // If shipping fails (offline, backend down), drop quietly —
            // we already have the entry in localStorage for manual recovery.
        }
    }
};

window.addEventListener?.('beforeunload', () => { flush(); });

const recordEntry = (level, args, context = {}) => {
    const entry = {
        level,
        message: composeMessage(args).slice(0, 4000),
        stack: composeStack(args)?.slice(0, 8000),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        clientRequestId,
        context,
        at: new Date().toISOString(),
    };

    // 1. Always print to the developer's console with a clear prefix.
    //    Use native console so we never recurse into our wrappers below.
    const tag = `[QXP ${level.toUpperCase()}]`;
    (nativeConsole[level] || nativeConsole.log)(tag, entry.message, context, entry.stack || '');

    // 2. Persist locally so devs can grab the last 50 entries.
    const stored = readStored();
    stored.push(entry);
    writeStored(stored);

    // 3. Ship important entries to the backend.
    if (SHIP_LEVELS.has(level)) {
        queue.push(entry);
        scheduleFlush();
    }
};

export const clientLog = {
    error: (...args) => recordEntry('error', args),
    warn:  (...args) => recordEntry('warn',  args),
    info:  (...args) => recordEntry('info',  args),
    debug: (...args) => recordEntry('debug', args),
    withContext: (context) => ({
        error: (...args) => recordEntry('error', args, context),
        warn:  (...args) => recordEntry('warn',  args, context),
        info:  (...args) => recordEntry('info',  args, context),
        debug: (...args) => recordEntry('debug', args, context),
    }),
    getStored: () => readStored(),
    clear: () => writeStored([]),
    requestId: clientRequestId,
};

let installed = false;

export const installGlobalHandlers = () => {
    if (installed || typeof window === 'undefined') return;
    installed = true;

    window.addEventListener('error', (event) => {
        recordEntry('error', [event.error || event.message], {
            source: 'window.onerror',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        recordEntry('error', [reason instanceof Error ? reason : new Error(String(reason))], {
            source: 'unhandledrejection',
        });
    });

    // Wrap console.error / console.warn so 3rd-party noise is also captured.
    // Our recordEntry() uses `nativeConsole` (captured above) so this does
    // NOT recurse.
    console.error = (...args) => { recordEntry('error', args, { source: 'console' }); nativeConsole.error(...args); };
    console.warn  = (...args) => { recordEntry('warn',  args, { source: 'console' }); nativeConsole.warn(...args);  };
};

export default clientLog;
