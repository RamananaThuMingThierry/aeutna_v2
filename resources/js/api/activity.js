import api from "./axios";

export const activitiesApi = {
  async list(params = {}) {
    const res = await api.get("/activities", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/activities/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/activities", payload);

    return { data: res.data.activity ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const body = payload instanceof FormData ? payload : new FormData();

    if (!(payload instanceof FormData)) {
      Object.entries(payload ?? {}).forEach(([key, value]) => {
        body.append(key, value ?? "");
      });
    }

    body.append("_method", "PUT");

    const res = await api.post(`/activities/${encryptedId}`, body);

    return { data: res.data.activity ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/activities/${encryptedId}`);
    return { message: res.data.message };
  },
};
