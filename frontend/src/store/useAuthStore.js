import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    checkAuth: async () => {
        try {
            const { data } = await api.get('/auth/me');
            set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            console.error('[AuthStore] checkAuth failed:', error.response?.data || error.message);
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    login: async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            set({ user: data.user, isAuthenticated: true, isLoading: false });
            return data;
        } catch (error) {
            console.error('[AuthStore] login failed:', error.response?.data || error.message);
            throw error;
        }
    },

    googleLogin: async (credential) => {
        try {
            const { data } = await api.post('/auth/google', { credential });
            set({ user: data.user, isAuthenticated: true, isLoading: false });
            return data;
        } catch (error) {
            console.error('[AuthStore] googleLogin failed:', error.response?.data || error.message);
            throw error;
        }
    },

    register: async (name, email, password) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            set({ user: data.user, isAuthenticated: true, isLoading: false });
            return data;
        } catch (error) {
            console.error('[AuthStore] register failed:', error.response?.data || error.message);
            throw error;
        }
    },

    logout: async () => {
        await api.post('/auth/logout');
        set({ user: null, isAuthenticated: false });
        window.location.href = '/login';
    },
    setUser: (user) => set({ user })
}));

export default useAuthStore;
