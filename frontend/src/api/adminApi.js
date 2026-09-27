import api from './client';

export const adminApi = {
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  getCompanies: async (params) => {
    const res = await api.get('/admin/companies', { params });
    return res.data;
  },

  verifyCompany: async (id, data) => {
    const res = await api.patch(`/admin/companies/${id}/verify`, data);
    return res.data;
  },

  getJobs: async (params) => {
    const res = await api.get('/admin/jobs', { params });
    return res.data;
  },

  moderateJob: async (id, data) => {
    const res = await api.patch(`/admin/jobs/${id}/moderate`, data);
    return res.data;
  },

  getUsers: async (params) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  updateUserStatus: async (id, data) => {
    const res = await api.patch(`/admin/users/${id}/status`, data);
    return res.data;
  },

  getAuditLogs: async (limit = 50) => {
    const res = await api.get('/admin/audit-logs', { params: { limit } });
    return res.data;
  },
};
