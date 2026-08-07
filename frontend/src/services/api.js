import axios from 'axios';
import clientLog from '../utils/clientLogger';

// Dev: Vite proxies /api/* to the backend (see vite.config.js).
// Prod: VITE_API_URL must be set to the full backend origin (without /api).
//       e.g. https://api.questxp.in   →   baseURL becomes https://api.questxp.in/api
const RAW_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
const baseURL = RAW_BASE
    ? (RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`)
    : '/api';

const api = axios.create({
    baseURL,
    withCredentials: true,
    // 12s is generous enough for slow mobile networks but fast enough that a
    // dead backend can't trap the UI in an indefinite spinner.
    timeout: 12000,
});

const getLocalAccessToken = () => {
    try { return localStorage.getItem('accessToken'); } catch { return null; }
};
const getLocalRefreshToken = () => {
    try { return localStorage.getItem('refreshToken'); } catch { return null; }
};
const clearLocalTokens = () => {
    try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    } catch { /* private-mode quotas etc. */ }
};

api.interceptors.request.use(
    (config) => {
        const token = getLocalAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Send the tab's clientRequestId so backend logs can be correlated
        // with frontend error reports. Per-request override is honored.
        if (!config.headers['X-Request-Id']) {
            config.headers['X-Request-Id'] = clientLog.requestId;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((p) => {
        if (error) p.reject(error);
        else p.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        const { accessToken, refreshToken } = response.data || {};
        try {
            if (accessToken) localStorage.setItem('accessToken', accessToken);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        } catch { /* private-mode quotas etc. */ }
        return response;
    },
    async (error) => {
        const originalRequest = error.config || {};
        const status = error.response?.status;
        const url = originalRequest.url || '';

        // Network failure (no response). Don't try to refresh — surface it.
        if (!error.response) {
            clientLog.warn('Network error (no response)', {
                url,
                method: originalRequest.method,
                code: error.code,
                message: error.message,
            });
            return Promise.reject(error);
        }

        const isAuthEntryPoint =
            url.includes('/auth/login') ||
            url.includes('/auth/register') ||
            url.includes('/auth/google') ||
            url.includes('/auth/refresh');

        if (status === 401 && !originalRequest._retry && !isAuthEntryPoint) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const rToken = getLocalRefreshToken();
                // Even without a local refresh token, the backend may have a
                // cookie-based refresh token (withCredentials: true). Try anyway.
                const { data } = await api.post('/auth/refresh', rToken ? { refreshToken: rToken } : {});
                if (!data?.accessToken) throw new Error('No accessToken in refresh response');

                try { localStorage.setItem('accessToken', data.accessToken); } catch { /* noop */ }
                if (data.refreshToken) {
                    try { localStorage.setItem('refreshToken', data.refreshToken); } catch { /* noop */ }
                }
                processQueue(null, data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearLocalTokens();

                const isPublicPage =
                    ['/', '/login', '/register'].includes(window.location.pathname) ||
                    window.location.pathname.startsWith('/share/');
                const isDemoUser = sessionStorage.getItem('questxp_demo') === 'true';
                
                if (!isPublicPage && !isDemoUser) {
                    window.location.href = '/login?reason=session_expired';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (status === 403) {
            window.dispatchEvent(new CustomEvent('feature-locked', {
                detail: { url: originalRequest.url, message: error.response.data?.error },
            }));
        }

        // 5xx is genuinely broken — record so backend log + client log can be
        // joined by requestId for diagnosis.
        if (status >= 500) {
            clientLog.error('Server error response', {
                url,
                method: originalRequest.method,
                status,
                serverRequestId: error.response.headers?.['x-request-id'],
                body: error.response.data,
            });
        }

        return Promise.reject(error);
    }
);

export default api;
