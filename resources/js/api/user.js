import api from "./axios";

export const usersApi = {
  async list(params = {}) {
    const res = await api.get("/users", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/users/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/users", payload);
    return {
      data: res.data.user ?? res.data,
      message: res.data.message,
    };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/users/${encryptedId}`, payload);
    return {
      data: res.data.user ?? res.data,
      message: res.data.message,
    };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/users/${encryptedId}`);
    return {
      message: res.data.message,
    };
  },

  async assignRole(encryptedId, role) {
    const res = await api.post(`/users/${encryptedId}/roles/assign`, { role });
    return {
      data: res.data.user ?? res.data,
      message: res.data.message,
    };
  },

  async removeRole(encryptedId, role) {
    const res = await api.post(`/users/${encryptedId}/roles/remove`, { role });
    return {
      data: res.data.user ?? res.data,
      message: res.data.message,
    };
  },

  async syncRoles(encryptedId, roles) {
    const res = await api.put(`/users/${encryptedId}/roles/sync`, { roles });
    return {
      data: res.data.user ?? res.data,
      message: res.data.message,
    };
  },
};
