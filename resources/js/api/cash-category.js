import api from "./axios";

export const cashCategoriesApi = {
  async list(params = {}) {
    const res = await api.get("/cash-categories", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/cash-categories/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/cash-categories", payload);
    return { data: res.data.cash_category ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/cash-categories/${encryptedId}`, payload);
    return { data: res.data.cash_category ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/cash-categories/${encryptedId}`);
    return { message: res.data.message };
  },
};
