import api from "./axios";

export const annualFeesApi = {
  async list(params = {}) {
    const res = await api.get("/annual-fees", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/annual-fees/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/annual-fees", payload);
    return { data: res.data.annual_fee ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/annual-fees/${encryptedId}`, payload);
    return { data: res.data.annual_fee ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/annual-fees/${encryptedId}`);
    return { message: res.data.message };
  },
};
