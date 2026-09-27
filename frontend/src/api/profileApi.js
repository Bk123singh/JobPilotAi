import api from './client';

export const profileApi = {
  getMyProfile: async () => {
    const res = await api.get('/profiles/me');
    return res.data;
  },

  updateMyProfile: async (profileData) => {
    const res = await api.patch('/profiles/me', profileData);
    return res.data;
  },

  getPublicProfile: async (userId) => {
    const res = await api.get(`/profiles/${userId}`);
    return res.data;
  },

  getSkillGaps: async () => {
    const res = await api.get('/profiles/me/skill-gaps');
    return res.data;
  },
};
