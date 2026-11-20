import api from "./axios";

export const sponsorsApi = {
  async list(params = {}) {
    const res = await api.get("/sponsors", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/sponsors/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/sponsors", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data.sponsor ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.post(`/sponsors/${encryptedId}?_method=PUT`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data.sponsor ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/sponsors/${encryptedId}`);
    return { message: res.data.message };
  },
};
