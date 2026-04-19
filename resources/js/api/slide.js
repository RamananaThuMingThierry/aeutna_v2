import api from "./axios";

export const slidesApi = {
  async list(params = {}) {
    const res = await api.get("/slides", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/slides/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/slides", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { data: res.data.slide ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.post(`/slides/${encryptedId}?_method=PUT`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { data: res.data.slide ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/slides/${encryptedId}`);
    return { message: res.data.message };
  },
};
