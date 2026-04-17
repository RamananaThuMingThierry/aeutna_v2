import api from "./axios";

export const membershipCardsApi = {
  async list(params = {}) {
    const res = await api.get("/membership-cards", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/membership-cards/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/membership-cards", payload);
    return { data: res.data.membership_card ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/membership-cards/${encryptedId}`, payload);
    return { data: res.data.membership_card ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/membership-cards/${encryptedId}`);
    return { message: res.data.message };
  },
};
