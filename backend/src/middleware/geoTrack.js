/**
 * Geo-Tracking Middleware
 *
 * Goal: record which country each sign-in / sign-up comes from, for audit and
 * analytics. It NEVER blocks a request.
 *
 * We used to block anyone outside India here, but IP → country lookups are a
 * guess: mobile carriers, college networks, cloud proxies and stale lookup data
 * all made real Indian users show up as "not in India" and get locked out.
 * So we only track now.
 *
 * Strategy:
 *   1. Extract the real client IP (Cloudflare → X-Forwarded-For → req.ip).
 *      Handle IPv4, IPv6, IPv6-mapped IPv4 and `ip:port` forms.
 *   2. Resolve country with geoip-lite (offline, ~4μs).
 *   3. If geoip-lite returns null, fall back to the ip-api.com REST endpoint
 *      with a short timeout. Cache the result.
 *   4. Add the full country name (e.g. 'IN' → 'India') next to the code.
 *   5. Put the result on `req.geoInfo` (saved on the user and the session) and
 *      always call next(). Logins from outside India are logged, not blocked.
 */

const geoip = require('geoip-lite');
const { geoLogger } = require('../utils/logger');

const HOME_COUNTRY = 'IN';

// 'IN' → 'India', 'US' → 'United States'. Built into Node, no extra package.
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const countryNameFor = (code) => {
    if (!code) return null;
    try {
        return regionNames.of(code) || code;
    } catch {
        return code;
    }
};
const BYPASS_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const FALLBACK_LOOKUP_TIMEOUT_MS = 1500;
const FALLBACK_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FALLBACK_DISABLED = process.env.GEO_FALLBACK_DISABLED === 'true';

// Small in-process LRU-ish cache for fallback lookups
const fallbackCache = new Map();
const setCache = (ip, value) => {
    fallbackCache.set(ip, { value, ts: Date.now() });
    if (fallbackCache.size > 5000) {
        const oldestKey = fallbackCache.keys().next().value;
        fallbackCache.delete(oldestKey);
    }
};
// Sentinel returned on cache miss so callers can distinguish "no entry" from
// "negative-cached as failed (value: null)". Caching failures matters because
// repeated geo lookups for non-routable / unknown IPs would otherwise hammer
// the ip-api endpoint on every request.
const CACHE_MISS = Symbol('cacheMiss');
const getCache = (ip) => {
    const hit = fallbackCache.get(ip);
    if (!hit) return CACHE_MISS;
    if (Date.now() - hit.ts > FALLBACK_CACHE_TTL_MS) {
        fallbackCache.delete(ip);
        return CACHE_MISS;
    }
    return hit.value; // may be null (negative) or a geo object (positive)
};

const isPrivateIP = (ip) => {
    if (!ip) return false;
    const v = ip.replace(/^::ffff:/, '');
    if (v === '::1' || v === '127.0.0.1') return true;
    if (v.startsWith('10.')) return true;
    if (v.startsWith('192.168.')) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(v)) return true;
    if (v.startsWith('169.254.')) return true;       // link-local
    if (v.startsWith('fc') || v.startsWith('fd')) return true; // ULA
    if (v.startsWith('fe80')) return true;           // link-local v6
    return false;
};

// Match IPv4 with optional :port
const IPV4_RE = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?$/;

/**
 * Normalize a header-supplied IP token: strip ports, brackets, and the
 * `::ffff:` prefix on IPv6-mapped IPv4 addresses.
 */
const normalizeIP = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    let ip = raw.trim();
    if (!ip) return null;

    // Bracketed IPv6 with optional port: [::1]:443
    if (ip.startsWith('[')) {
        const end = ip.indexOf(']');
        if (end !== -1) ip = ip.slice(1, end);
    }

    // IPv4-mapped IPv6: ::ffff:1.2.3.4 → 1.2.3.4
    const mapped = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?$/i);
    if (mapped) return mapped[1];

    // Pure IPv4 (optionally with port)
    const v4 = ip.match(IPV4_RE);
    if (v4) return v4[1];

    // Otherwise treat as IPv6 (no port suffix expected without brackets)
    return ip;
};

/**
 * Extract real client IP from request.
 *
 * Order of preference:
 *   1. req.ip — Express resolves this through `trust proxy` (configured as
 *      TRUST_PROXY_HOPS hops in app.js). This is the ONLY value an attacker
 *      cannot spoof: Express only honors x-forwarded-for from a trusted hop.
 *   2. cf-connecting-ip / x-real-ip / x-forwarded-for — raw headers, used
 *      ONLY when req.ip is somehow unavailable (extremely rare). Honoring
 *      these blindly is what lets an attacker spoof their IP by simply
 *      adding a header, so we keep them as last-resort fallbacks.
 *   3. socket.remoteAddress — direct TCP peer.
 */
const extractClientIP = (req) => {
    if (req.ip) {
        const norm = normalizeIP(req.ip);
        if (norm) return norm;
    }

    // Fallbacks below — only reached when req.ip is missing (e.g. running
    // outside Express like in a worker). Order chosen to match common proxy
    // chains.
    const cfIP = req.headers['cf-connecting-ip'];
    if (cfIP) {
        const norm = normalizeIP(cfIP);
        if (norm) return norm;
    }

    const xRealIP = req.headers['x-real-ip'];
    if (xRealIP) {
        const norm = normalizeIP(xRealIP);
        if (norm) return norm;
    }

    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        const first = forwarded.split(',')[0];
        const norm = normalizeIP(first);
        if (norm) return norm;
    }

    if (req.socket?.remoteAddress) {
        return normalizeIP(req.socket.remoteAddress);
    }

    return null;
};

/**
 * Offline lookup via geoip-lite.
 */
const resolveGeoOffline = (ip) => {
    if (!ip) return null;
    const cleanIP = ip.replace(/^::ffff:/, '');
    const geo = geoip.lookup(cleanIP);
    if (!geo || !geo.country) return null;
    return {
        country: geo.country,
        countryName: countryNameFor(geo.country),
        region: geo.region || null,
        city: geo.city || null,
        ll: geo.ll || null,
        timezone: geo.timezone || null,
        source: 'geoip-lite',
    };
};

/**
 * Online fallback via ip-api.com — free, no key, ~1500ms timeout.
 * Returns null on any error. Result is cached.
 */
const resolveGeoOnline = async (ip) => {
    if (FALLBACK_DISABLED || !ip) return null;
    const cached = getCache(ip);
    if (cached !== CACHE_MISS) return cached; // honors both positive and negative cache

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FALLBACK_LOOKUP_TIMEOUT_MS);

    try {
        const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode,regionName,city,lat,lon,timezone`;
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!resp.ok) {
            setCache(ip, null);
            return null;
        }
        const body = await resp.json();
        if (body.status !== 'success' || !body.countryCode) {
            setCache(ip, null);
            return null;
        }
        const result = {
            country: body.countryCode,
            countryName: countryNameFor(body.countryCode),
            region: body.regionName || null,
            city: body.city || null,
            ll: (body.lat != null && body.lon != null) ? [body.lat, body.lon] : null,
            timezone: body.timezone || null,
            source: 'ip-api',
        };
        setCache(ip, result);
        return result;
    } catch (err) {
        clearTimeout(timer);
        geoLogger.warn?.('ip-api fallback failed', { ip, error: err.message });
        setCache(ip, null);
        return null;
    }
};

/**
 * Unified resolver: offline first, online fallback if offline returns null.
 */
const resolveGeo = async (ip) => {
    const offline = resolveGeoOffline(ip);
    if (offline) return offline;
    return await resolveGeoOnline(ip);
};

/**
 * Geo-tracking middleware. Always async because of online fallback.
 * Never rejects a request — lookup problems just mean the country is unknown.
 */
const geoTrack = async (req, res, next) => {
    const clientIP = extractClientIP(req);

    // Dev / internal: localhost and private LAN IPs have no real location
    if (!clientIP || BYPASS_IPS.has(clientIP) || isPrivateIP(clientIP)) {
        req.geoInfo = { country: 'IN', countryName: 'India', region: 'LAN', city: 'private', source: 'bypass' };
        return next();
    }

    let geo = null;
    try {
        geo = await resolveGeo(clientIP);
    } catch (err) {
        geoLogger.error?.('Geo resolution threw', { ip: clientIP, error: err.message });
        geo = null;
    }

    if (!geo || !geo.country) {
        req.geoInfo = { country: 'UNKNOWN', countryName: 'Unknown', region: null, city: null, source: 'unresolved' };
        geoLogger.warn?.('Geo unresolved', { ip: clientIP });
        return next();
    }

    req.geoInfo = geo;

    if (geo.country !== HOME_COUNTRY) {
        geoLogger.info?.('Auth request from outside India', {
            ip: clientIP,
            country: geo.country,
            countryName: geo.countryName,
            city: geo.city,
            region: geo.region,
            source: geo.source,
        });
    }

    next();
};

module.exports = {
    geoTrack,
    resolveGeo,
    resolveGeoOffline,
    resolveGeoOnline,
    extractClientIP,
    normalizeIP,
    isPrivateIP,
    countryNameFor,
};
