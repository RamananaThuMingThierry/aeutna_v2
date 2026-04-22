import api from "./axios";

export const websiteApi = {
  async home() {
    const res = await api.get("/website/home");
    return res.data;
  },

  async gallery() {
    const res = await api.get("/website/gallery");
    return res.data;
  },

  async activities() {
    const res = await api.get("/website/activities");
    return res.data;
  },
};
