import api from './client';

export const interviewApi = {
  scheduleInterview: async (data) => {
    const res = await api.post('/interviews', data);
    return res.data;
  },

  getCandidateInterviews: async () => {
    const res = await api.get('/interviews/my-interviews');
    return res.data;
  },

  getRecruiterInterviews: async () => {
    const res = await api.get('/interviews/recruiter');
    return res.data;
  },

  updateInterview: async (id, data) => {
    const res = await api.patch(`/interviews/${id}`, data);
    return res.data;
  },
};
