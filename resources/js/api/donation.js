import api from "./axios";

export const donationsApi = {
  async list(params = {}) {
    const res = await api.get("/donations", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/donations/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/donations", payload);
    return { data: res.data.donation ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/donations/${encryptedId}`, payload);
    return { data: res.data.donation ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/donations/${encryptedId}`);
    return { message: res.data.message };
  },
};
