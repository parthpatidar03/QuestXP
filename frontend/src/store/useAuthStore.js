import { create } from 'zustand';
import api from '../services/api';

// Module-scoped guards so concurrent React StrictMode mounts and fast-nav
// don't fire 3 simultaneous /auth/me requests.
let authVersion = 0;
let inFlightCheckAuth = null;

const persistTokens = (data) => {
    if (data?.accessToken) localStorage.setItem('accessToken', data.accessToken);
    if (data?.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
};

const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isDemoMode: sessionStorage.getItem('questxp_demo') === 'true',

    checkAuth: async () => {
        if (inFlightCheckAuth) return inFlightCheckAuth;
        const version = authVersion;
        inFlightCheckAuth = (async () => {
            try {
                const { data } = await api.get('/auth/me');
                if (version !== authVersion) return;
                set({ user: data.user, isAuthenticated: true, isLoading: false });
            } catch {
                if (version !== authVersion) return;
                set({ user: null, isAuthenticated: false, isLoading: false });
            } finally {
                inFlightCheckAuth = null;
            }
        })();
        return inFlightCheckAuth;
    },

    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        authVersion += 1;
        persistTokens(data);
        sessionStorage.removeItem('questxp_demo');
        set({ user: data.user, isAuthenticated: true, isLoading: false, isDemoMode: false });
        return data;
    },

    googleLogin: async (credential) => {
        const { data } = await api.post('/auth/google', { credential });
        authVersion += 1;
        persistTokens(data);
        sessionStorage.removeItem('questxp_demo');
        set({ user: data.user, isAuthenticated: true, isLoading: false, isDemoMode: false });
        return data;
    },

    register: async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        authVersion += 1;
        persistTokens(data);
        set({ user: data.user, isAuthenticated: true, isLoading: false });
        return data;
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch { /* ignore — local cleanup must still happen */ }
        clearTokens();
        sessionStorage.removeItem('questxp_demo');
        localStorage.removeItem('questxp_demo_course');
        authVersion += 1;
        set({ user: null, isAuthenticated: false, isDemoMode: false });
        window.location.href = '/login';
    },

    setUser: (user) => set({ user }),

    enterDemoMode: () => {
        sessionStorage.setItem('questxp_demo', 'true');
        set({ isDemoMode: true, isLoading: false });
    },

    exitDemoMode: () => {
        sessionStorage.removeItem('questxp_demo');
        localStorage.removeItem('questxp_demo_course');
        set({ isDemoMode: false });
    },
}));

export default useAuthStore;
