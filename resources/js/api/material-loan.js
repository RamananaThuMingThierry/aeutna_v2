import api from "./axios";

export const materialLoansApi = {
  async list(params = {}) {
    const res = await api.get("/material-loans", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/material-loans/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/material-loans", payload);
    return { data: res.data.material_loan ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/material-loans/${encryptedId}`, payload);
    return { data: res.data.material_loan ?? res.data, message: res.data.message };
  },

  async returnLoan(encryptedId, payload = {}) {
    const res = await api.post(`/material-loans/${encryptedId}/return`, payload);
    return { data: res.data.material_loan ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/material-loans/${encryptedId}`);
    return { message: res.data.message };
  },
};

