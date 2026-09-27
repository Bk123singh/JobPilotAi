import api from './client';

export const alertApi = {
  createAlert: async (data) => {
    const res = await api.post('/job-alerts', data);
    return res.data;
  },

  getUserAlerts: async () => {
    const res = await api.get('/job-alerts');
    return res.data;
  },

  getAlertById: async (id) => {
    const res = await api.get(`/job-alerts/${id}`);
    return res.data;
  },

  updateAlert: async (id, data) => {
    const res = await api.patch(`/job-alerts/${id}`, data);
    return res.data;
  },

  deleteAlert: async (id) => {
    const res = await api.delete(`/job-alerts/${id}`);
    return res.data;
  },

  triggerAlertDigest: async (id) => {
    const res = await api.post(`/job-alerts/${id}/trigger`);
    return res.data;
  },

  getPreferences: async () => {
    const res = await api.get('/job-alerts/preferences');
    return res.data;
  },

  updatePreferences: async (data) => {
    const res = await api.patch('/job-alerts/preferences', data);
    return res.data;
  },
};
