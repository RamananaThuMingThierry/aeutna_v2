import api from "./axios";

export const websiteApi = {
  async home() {
    const res = await api.get("/website/home");
    return res.data;
  },
};
