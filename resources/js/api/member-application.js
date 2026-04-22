import api from "./axios";

export const memberApplicationsApi = {
  async publicMeta() {
    const res = await api.get("/website/member-application-meta");
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/member-applications", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  async list(params = {}) {
    const res = await api.get("/member-applications", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/member-applications/${encryptedId}`);
    return res.data;
  },

  async review(encryptedId, payload) {
    const res = await api.post(`/member-applications/${encryptedId}/review`, payload);
    return res.data;
  },
};
