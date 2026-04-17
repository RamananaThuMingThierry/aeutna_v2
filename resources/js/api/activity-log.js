import api from "./axios";

export const activityLogsApi = {
  async list(params = {}) {
    const res = await api.get("/activity-logs", { params });
    return res.data;
  },

  async show(id) {
    const res = await api.get(`/activity-logs/${id}`);
    return res.data;
  },
};
