import api from './client';

export const resumeApi = {
  getResumes: async () => {
    const res = await api.get('/resumes');
    return res.data;
  },

  getResume: async (id) => {
    const res = await api.get(`/resumes/${id}`);
    return res.data;
  },

  uploadResume: async (resumeData) => {
    const res = await api.post('/resumes', resumeData);
    return res.data;
  },

  updateResume: async (id, updateData) => {
    const res = await api.patch(`/resumes/${id}`, updateData);
    return res.data;
  },

  setPrimary: async (id) => {
    const res = await api.patch(`/resumes/${id}/primary`);
    return res.data;
  },

  deleteResume: async (id) => {
    const res = await api.delete(`/resumes/${id}`);
    return res.data;
  },

  parseResume: async (resumeData) => {
    const res = await api.post('/resumes/parse', resumeData);
    return res.data;
  },

  autofillProfile: async (id, strategy = 'MERGE') => {
    const res = await api.post(`/resumes/${id}/autofill-profile`, { strategy });
    return res.data;
  },
};
