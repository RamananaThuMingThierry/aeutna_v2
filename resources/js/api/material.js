import api from "./axios";

export const materialsApi = {
  async list(params = {}) {
    const res = await api.get("/materials", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/materials/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/materials", payload);
    return { data: res.data.material ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/materials/${encryptedId}`, payload);
    return { data: res.data.material ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/materials/${encryptedId}`);
    return { message: res.data.message };
  },
};

