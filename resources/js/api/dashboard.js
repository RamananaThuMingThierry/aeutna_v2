import api from "./axios";

export const dashboardApi = {
  async get() {
    const res = await api.get("/dashboard");
    return res.data;
  },
};
