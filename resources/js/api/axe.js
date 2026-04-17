import api from "./axios";

export const axesApi = {
  async list(params = {}) {
    const res = await api.get("/axes", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/axes/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/axes", payload);
    return {
      data: res.data.axe ?? res.data,
      message: res.data.message,
    };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/axes/${encryptedId}`, payload);
    return {
      data: res.data.axe ?? res.data,
      message: res.data.message,
    };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/axes/${encryptedId}`);
    return {
      message: res.data.message,
    };
  },
};
