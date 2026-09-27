import api from './client';

export const jobApi = {
  listJobs: async (params = {}) => {
    const res = await api.get('/jobs', { params });
    return res.data;
  },

  getJob: async (id) => {
    const res = await api.get(`/jobs/${id}`);
    return res.data;
  },

  createJob: async (jobData) => {
    const res = await api.post('/jobs', jobData);
    return res.data;
  },

  updateJob: async (id, updateData) => {
    const res = await api.patch(`/jobs/${id}`, updateData);
    return res.data;
  },

  closeJob: async (id) => {
    const res = await api.patch(`/jobs/${id}/close`);
    return res.data;
  },

  listRecruiterJobs: async () => {
    const res = await api.get('/jobs/recruiter/my-jobs');
    return res.data;
  },

  toggleSaveJob: async (id) => {
    const res = await api.post(`/jobs/${id}/save`);
    return res.data;
  },

  listSavedJobs: async () => {
    const res = await api.get('/jobs/candidate/saved');
    return res.data;
  },

  getMatchScore: async (id) => {
    const res = await api.get(`/jobs/${id}/match-score`);
    return res.data;
  },

  getRecommendations: async (limit = 10) => {
    const res = await api.get('/jobs/candidate/recommendations', { params: { limit } });
    return res.data;
  },
};
