import api from "./axios";

export const suppliersApi = {
  async list(params = {}) {
    const res = await api.get("/suppliers", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/suppliers/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/suppliers", payload);
    return { data: res.data.supplier ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/suppliers/${encryptedId}`, payload);
    return { data: res.data.supplier ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/suppliers/${encryptedId}`);
    return { message: res.data.message };
  },
};

