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

// Response Interceptor: Handle Token Refresh and persistence
api.interceptors.response.use(
    (response) => {
        // T066: Capture and persist tokens from any JSON response (fallback for blocked cookies)
        const { accessToken, refreshToken } = response.data || {};
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            originalRequest.url !== '/auth/login' &&
            originalRequest.url !== '/auth/register' &&
            originalRequest.url !== '/auth/signup' &&
            originalRequest.url !== '/auth/refresh'
        ) {
            originalRequest._retry = true;
            try {
                // T067: Try refreshing via header if cookies are blocked
                const refreshToken = getLocalRefreshToken();
                const { data } = await api.post('/auth/refresh', { refreshToken });
                
                if (data.accessToken) {
                    localStorage.setItem('accessToken', data.accessToken);
                    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
                    
                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Clear tokens if refresh fails
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                return Promise.reject(refreshError);
            }
        }

        if (error.response && error.response.status === 401) {
            // Zustand useAuthStore will handle the state update and redirection via ProtectedRoute
            console.warn('[API] 401 Unauthorized detected');
        }

        // T061 — Emit a custom event on 403 so LockedFeature can react globally
        if (error.response && error.response.status === 403) {
            window.dispatchEvent(new CustomEvent('feature-locked', {
                detail: { url: error.config?.url, message: error.response.data?.error }
            }));
        }

        return Promise.reject(error);
    }
);

export default api;
