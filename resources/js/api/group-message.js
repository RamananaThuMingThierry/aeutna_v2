import api from "./axios";

export const groupMessagesApi = {
  async list() {
    const res = await api.get("/group-messages");
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/group-messages/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/group-messages", payload);
    return res.data;
  },

  async remove(encryptedId) {
    const res = await api.delete(`/group-messages/${encryptedId}`);
    return res.data;
  },
};
