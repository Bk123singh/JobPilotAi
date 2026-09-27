import api from './client';

export const applicationApi = {
  applyJob: async (jobId, data) => {
    const res = await api.post(`/applications/jobs/${jobId}`, data);
    return res.data;
  },

  getMyApplications: async () => {
    const res = await api.get('/applications/me');
    return res.data;
  },

  getApplication: async (id) => {
    const res = await api.get(`/applications/${id}`);
    return res.data;
  },

  withdrawApplication: async (id) => {
    const res = await api.post(`/applications/${id}/withdraw`);
    return res.data;
  },

  getRecruiterApplications: async (params = {}) => {
    const res = await api.get('/applications/recruiter', { params });
    return res.data;
  },

  updateApplicationStatus: async (id, data) => {
    const res = await api.patch(`/applications/${id}/status`, data);
    return res.data;
  },
};
