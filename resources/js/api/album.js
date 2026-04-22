import api from "./axios";

export const albumsApi = {
  async list(params = {}) {
    const res = await api.get("/albums", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/albums/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/albums", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return { data: res.data.album ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.post(`/albums/${encryptedId}?_method=PUT`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return { data: res.data.album ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/albums/${encryptedId}`);
    return { message: res.data.message };
  },
};
