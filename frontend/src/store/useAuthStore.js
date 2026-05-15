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

    checkAuth: async () => {
        if (inFlightCheckAuth) return inFlightCheckAuth;
        const version = authVersion;
        inFlightCheckAuth = (async () => {
            try {
                const { data } = await api.get('/auth/me');
                if (version !== authVersion) return;
                set({ user: data.user, isAuthenticated: true, isLoading: false });
            } catch (error) {
                if (version !== authVersion) return;
                set({ user: null, isAuthenticated: false, isLoading: false });
            } finally {
                inFlightCheckAuth = null;
            }
        })();
        return inFlightCheckAuth;
    },

    login: async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            authVersion += 1;
            persistTokens(data);
            set({ user: data.user, isAuthenticated: true, isLoading: false });
            return data;
        } catch (error) {
            throw error;
        }
    },

    googleLogin: async (credential) => {
        try {
            const { data } = await api.post('/auth/google', { credential });
            authVersion += 1;
            persistTokens(data);
            set({ user: data.user, isAuthenticated: true, isLoading: false });
            return data;
        } catch (error) {
            throw error;
        }
    },

    register: async (name, email, password) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            authVersion += 1;
            persistTokens(data);
            set({ user: data.user, isAuthenticated: true, isLoading: false });
            return data;
        } catch (error) {
            throw error;
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (_) { /* ignore — local cleanup must still happen */ }
        clearTokens();
        authVersion += 1;
        set({ user: null, isAuthenticated: false });
        window.location.href = '/login';
    },

    setUser: (user) => set({ user }),
}));

export default useAuthStore;
