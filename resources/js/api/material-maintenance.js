import api from "./axios";

export const materialMaintenancesApi = {
  async list(params = {}) {
    const res = await api.get("/material-maintenances", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/material-maintenances/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/material-maintenances", payload);
    return { data: res.data.material_maintenance ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/material-maintenances/${encryptedId}`, payload);
    return { data: res.data.material_maintenance ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/material-maintenances/${encryptedId}`);
    return { message: res.data.message };
  },
};
