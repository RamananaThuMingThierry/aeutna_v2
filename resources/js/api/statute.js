import api from "./axios";

export const statutesApi = {
  async list() {
    const res = await api.get("/statutes");
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/statutes/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/statutes", payload);
    return { data: res.data.statute ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/statutes/${encryptedId}`, payload);
    return { data: res.data.statute ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/statutes/${encryptedId}`);
    return { message: res.data.message };
  },

  async createTitle(statuteEncryptedId, payload) {
    const res = await api.post(`/statutes/${statuteEncryptedId}/titles`, payload);
    return { data: res.data.title ?? res.data, message: res.data.message };
  },

  async updateTitle(encryptedId, payload) {
    const res = await api.put(`/statute-titles/${encryptedId}`, payload);
    return { data: res.data.title ?? res.data, message: res.data.message };
  },

  async removeTitle(encryptedId) {
    const res = await api.delete(`/statute-titles/${encryptedId}`);
    return { message: res.data.message };
  },

  async createArticle(titleEncryptedId, payload) {
    const res = await api.post(`/statute-titles/${titleEncryptedId}/articles`, payload);
    return { data: res.data.article ?? res.data, message: res.data.message };
  },

  async updateArticle(encryptedId, payload) {
    const res = await api.put(`/statute-articles/${encryptedId}`, payload);
    return { data: res.data.article ?? res.data, message: res.data.message };
  },

  async removeArticle(encryptedId) {
    const res = await api.delete(`/statute-articles/${encryptedId}`);
    return { message: res.data.message };
  },
};
