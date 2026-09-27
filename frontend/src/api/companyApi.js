import api from './client';

export const companyApi = {
  getMyCompany: async () => {
    const res = await api.get('/companies/me');
    return res.data;
  },

  createCompany: async (companyData) => {
    const res = await api.post('/companies', companyData);
    return res.data;
  },

  updateCompany: async (id, updateData) => {
    const res = await api.patch(`/companies/${id}`, updateData);
    return res.data;
  },

  getCompany: async (id) => {
    const res = await api.get(`/companies/${id}`);
    return res.data;
  },

  listCompanies: async () => {
    const res = await api.get('/companies');
    return res.data;
  },
};
