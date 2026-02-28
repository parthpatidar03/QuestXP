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
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({ user: data.user, isAuthenticated: true });
        return data;
    },

    googleLogin: async (credential) => {
        const { data } = await api.post('/auth/google', { credential });
        set({ user: data.user, isAuthenticated: true });
        return data;
    },

    register: async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        set({ user: data.user, isAuthenticated: true });
        return data;
    },

    logout: async () => {
        await api.post('/auth/logout');
        set({ user: null, isAuthenticated: false });
        window.location.href = '/login';
    }
}));

export default useAuthStore;
