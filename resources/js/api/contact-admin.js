import api from "./axios";

export const contactAdminApi = {
  async list(params = {}) {
    const response = await api.get("/contacts", { params });
    return response.data;
  },

  async show(encryptedId) {
    const response = await api.get(`/contacts/${encryptedId}`);
    return response.data;
  },

  async reply(encryptedId, payload) {
    const response = await api.post(`/contacts/${encryptedId}/reply`, payload);
    return response.data;
  },

  async remove(encryptedId) {
    const response = await api.delete(`/contacts/${encryptedId}`);
    return response.data;
  },
};
