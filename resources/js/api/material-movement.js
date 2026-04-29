import api from "./axios";

export const materialMovementsApi = {
  async list(params = {}) {
    const res = await api.get("/material-movements", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/material-movements/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/material-movements", payload);
    return { data: res.data.material_movement ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/material-movements/${encryptedId}`, payload);
    return { data: res.data.material_movement ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/material-movements/${encryptedId}`);
    return { message: res.data.message };
  },
};
