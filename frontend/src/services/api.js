import axios from 'axios';

// T064 — In dev, Vite proxies /api/* to localhost:5000 so we can use a
// relative base URL. In production, VITE_API_URL must be set to the full backend URL.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
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
                await api.post('/auth/refresh');
                return api(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }

        if (error.response && error.response.status === 401) {
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
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
