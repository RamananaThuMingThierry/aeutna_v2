import api from "./axios";

export const feePaymentsApi = {
  async list(params = {}) {
    const res = await api.get("/fee-payments", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/fee-payments/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/fee-payments", payload);
    return { data: res.data.fee_payment ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/fee-payments/${encryptedId}`, payload);
    return { data: res.data.fee_payment ?? res.data, message: res.data.message };
  },

  async validate(encryptedId) {
    const res = await api.post(`/fee-payments/${encryptedId}/validate`);
    return { data: res.data.fee_payment ?? res.data, message: res.data.message };
  },

  async cancel(encryptedId, payload = {}) {
    const res = await api.post(`/fee-payments/${encryptedId}/cancel`, payload);
    return { data: res.data.fee_payment ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/fee-payments/${encryptedId}`);
    return { message: res.data.message };
  },
};
