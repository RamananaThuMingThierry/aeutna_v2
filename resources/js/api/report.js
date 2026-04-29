import api from "./axios";

export const reportsApi = {
  async list() {
    const res = await api.get("/reports");
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/reports/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/reports", payload);
    return { data: res.data.report ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const res = await api.put(`/reports/${encryptedId}`, payload);
    return { data: res.data.report ?? res.data, message: res.data.message };
  },

  async scanAttendance(encryptedId, payload) {
    const res = await api.post(`/reports/${encryptedId}/scan-attendance`, payload);
    return {
      data: res.data.report ?? null,
      attendance: res.data.attendance ?? null,
      message: res.data.message,
    };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/reports/${encryptedId}`);
    return { message: res.data.message };
  },
};
