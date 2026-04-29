import api from "./axios";

export const cashTransactionsApi = {
  async list(params = {}) {
    const res = await api.get("/cash-transactions", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/cash-transactions/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/cash-transactions", payload);
    return { data: res.data.cash_transaction ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/cash-transactions/${encryptedId}`, payload);
    return { data: res.data.cash_transaction ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/cash-transactions/${encryptedId}`);
    return { message: res.data.message };
  },
};
