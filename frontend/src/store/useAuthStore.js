import { create } from 'zustand';
import { authApi } from '../api/authApi';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('jobpilot_user') || 'null'),
  accessToken: localStorage.getItem('jobpilot_access_token') || null,
  isAuthenticated: !!localStorage.getItem('jobpilot_access_token'),
  isLoading: false,
  isInitialized: false,

  setAuth: (user, accessToken, refreshToken = null) => {
    localStorage.setItem('jobpilot_user', JSON.stringify(user));
    localStorage.setItem('jobpilot_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('jobpilot_refresh_token', refreshToken);
    }
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('jobpilot_user');
      localStorage.removeItem('jobpilot_access_token');
      localStorage.removeItem('jobpilot_refresh_token');
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  initializeAuth: async () => {
    const token = localStorage.getItem('jobpilot_access_token');
    if (!token) {
      set({ isInitialized: true, isAuthenticated: false, user: null });
      return;
    }

    try {
      set({ isLoading: true });
      const res = await authApi.getMe();
      const user = res.data.user;
      localStorage.setItem('jobpilot_user', JSON.stringify(user));
      set({
        user,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      // Token might be invalid or expired
      localStorage.removeItem('jobpilot_user');
      localStorage.removeItem('jobpilot_access_token');
      localStorage.removeItem('jobpilot_refresh_token');
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
      });
    }
  },
}));

// Listen for global unauthorized events dispatched by axios interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().logout();
  });
}
