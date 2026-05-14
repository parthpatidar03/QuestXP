import axios from 'axios';

// T064 — In dev, Vite proxies /api/* to localhost:5000 so we can use a
// relative base URL. In production, VITE_API_URL must be set to the full backend URL.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
});

// Helper to get tokens from localStorage
const getLocalAccessToken = () => localStorage.getItem('accessToken');
const getLocalRefreshToken = () => localStorage.getItem('refreshToken');

// Request Interceptor: Attach Bearer token if available in LocalStorage
api.interceptors.request.use(
    (config) => {
        const token = getLocalAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response Interceptor: Handle Token Refresh and persistence
api.interceptors.response.use(
    (response) => {
        // Capture and persist tokens fallback
        const { accessToken, refreshToken } = response.data || {};
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error.response ? error.response.status : 'NETWORK_ERROR';
        const url = error.config ? error.config.url : 'UNKNOWN_URL';
        const method = error.config ? error.config.method?.toUpperCase() : 'UNKNOWN_METHOD';
        const responseData = error.response ? error.response.data : null;

        console.error(`[API ERROR] ${method} ${url} | Status: ${status}`, {
            message: error.message,
            details: responseData,
            stack: error.stack
        });

        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/auth/login') &&
            !originalRequest.url.includes('/auth/register') &&
            !originalRequest.url.includes('/auth/refresh')
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const rToken = getLocalRefreshToken();
                if (!rToken) {
                    throw new Error('No refresh token available');
                }

                const { data } = await api.post('/auth/refresh', { refreshToken: rToken });
                
                if (data.accessToken) {
                    localStorage.setItem('accessToken', data.accessToken);
                    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
                    
                    processQueue(null, data.accessToken);
                    
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                
                const isPublicPage = ['/', '/login', '/register'].includes(window.location.pathname) || window.location.pathname.startsWith('/share/');
                if (!isPublicPage) {
                    window.location.href = '/login?reason=session_expired';
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response && error.response.status === 401) {
            console.warn('[API] 401 Unauthorized detected - redirecting or clearing state');
        }

        if (error.response && error.response.status === 403) {
            window.dispatchEvent(new CustomEvent('feature-locked', {
                detail: { url: error.config?.url, message: error.response.data?.error }
            }));
        }

        return Promise.reject(error);
    }
);

export default api;
