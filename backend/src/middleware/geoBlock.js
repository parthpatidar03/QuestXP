/**
 * Geo-Blocking Middleware
 * 
 * Uses geoip-lite (offline MaxMind GeoLite2 DB) to resolve client IP → country.
 * Blocks all non-Indian IPs from auth routes (login, register, google auth).
 * Stores country metadata in request for downstream use.
 * 
 * Architecture:
 * - geoip-lite bundles MaxMind's GeoLite2 DB (~60MB) inside node_modules
 * - Zero external API calls → fast, free, works offline
 * - Lookup is ~4μs per IP (in-memory binary search)
 * - Azure/proxy IPs handled via x-forwarded-for + trust proxy
 */

const geoip = require('geoip-lite');
const { geoLogger } = require('../utils/logger');

// Allowed country codes (ISO 3166-1 alpha-2)
const ALLOWED_COUNTRIES = new Set(['IN']);

// IPs that bypass geo-blocking (localhost, private ranges for dev)
const BYPASS_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const isPrivateIP = (ip) => {
    if (!ip) return false;
    return (
        ip.startsWith('10.') ||
        ip.startsWith('192.168.') ||
        ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') ||
        ip.startsWith('172.19.') || ip.startsWith('172.20.') || ip.startsWith('172.21.') ||
        ip.startsWith('172.22.') || ip.startsWith('172.23.') || ip.startsWith('172.24.') ||
        ip.startsWith('172.25.') || ip.startsWith('172.26.') || ip.startsWith('172.27.') ||
        ip.startsWith('172.28.') || ip.startsWith('172.29.') || ip.startsWith('172.30.') ||
        ip.startsWith('172.31.')
    );
};

/**
 * Extract real client IP from request
 * Handles Azure App Service, Cloudflare, nginx proxies
 */
const extractClientIP = (req) => {
    // Cloudflare
    const cfIP = req.headers['cf-connecting-ip'];
    if (cfIP) return cfIP;

    // Azure App Service / standard proxies
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }

    // Direct connection
    return req.ip || req.socket?.remoteAddress || null;
};

/**
 * Resolve IP to country info
 * Returns { country, region, city, ll } or null
 */
const resolveGeo = (ip) => {
    if (!ip) return null;
    
    // Strip IPv6 prefix
    const cleanIP = ip.replace(/^::ffff:/, '');
    
    const geo = geoip.lookup(cleanIP);
    if (!geo) return null;
    
    return {
        country: geo.country,       // 'IN', 'US', 'PK' etc.
        region: geo.region,
        city: geo.city,
        ll: geo.ll,                 // [lat, lon]
        timezone: geo.timezone,
    };
};

/**
 * Geo-blocking middleware for auth routes.
 * Blocks non-Indian IPs. Attaches geo info to req for storage.
 */
const geoBlock = (req, res, next) => {
    const clientIP = extractClientIP(req);
    
    // Dev bypass: allow localhost and private IPs
    if (BYPASS_IPS.has(clientIP) || isPrivateIP(clientIP?.replace(/^::ffff:/, ''))) {
        req.geoInfo = { country: 'IN', region: 'DEV', city: 'localhost', source: 'bypass' };
        return next();
    }

    const geo = resolveGeo(clientIP);
    
    // If geo lookup fails (unknown IP), block by default in production, allow in dev
    if (!geo) {
        if (process.env.NODE_ENV === 'production') {
            geoLogger.warn('Geo lookup failed — blocked unknown IP', { ip: clientIP });
            return res.status(403).json({ 
                error: `Access denied. Could not verify your location (IP: ${clientIP}).`,
                code: 'GEO_LOOKUP_FAILED',
                detectedIP: clientIP
            });
        }
        // Dev: allow unknown IPs
        req.geoInfo = { country: 'UNKNOWN', region: null, city: null, source: 'unknown' };
        return next();
    }

    // Attach geo info to request
    req.geoInfo = { ...geo, source: 'geoip-lite' };

    // Check if country is allowed
    if (!ALLOWED_COUNTRIES.has(geo.country)) {
        geoLogger.warn('Blocked non-Indian login attempt', {
            ip: clientIP,
            country: geo.country,
            city: geo.city,
            region: geo.region,
        });
        
        return res.status(403).json({
            error: `Access denied. This service is only available in India. Detected: ${geo.country} from IP: ${clientIP}`,
            code: 'GEO_BLOCKED',
            detectedCountry: geo.country,
            detectedIP: clientIP
        });
    }

    next();
};

module.exports = { geoBlock, resolveGeo, extractClientIP };
