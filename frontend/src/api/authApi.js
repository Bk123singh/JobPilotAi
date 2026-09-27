import api from './client';

export const authApi = {
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  googleAuth: async (data) => {
    const res = await api.post('/auth/google', data);
    return res.data;
  },

  checkHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },
};
