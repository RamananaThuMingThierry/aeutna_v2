import api from "./axios";

export const educationLevelsApi = {
  async list(params = {}) {
    const res = await api.get("/education-levels", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/education-levels/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/education-levels", payload);
    return {
      data: res.data.education_level ?? res.data,
      message: res.data.message,
    };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/education-levels/${encryptedId}`, payload);
    return {
      data: res.data.education_level ?? res.data,
      message: res.data.message,
    };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/education-levels/${encryptedId}`);
    return {
      message: res.data.message,
    };
  },
};
