import api from "./axios";

export const functionsApi = {
  async list(params = {}) {
    const res = await api.get("/functions", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/functions/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/functions", payload);
    return {
      data: res.data.function ?? res.data,
      message: res.data.message,
    };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/functions/${encryptedId}`, payload);
    return {
      data: res.data.function ?? res.data,
      message: res.data.message,
    };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/functions/${encryptedId}`);
    return {
      message: res.data.message,
    };
  },
};
