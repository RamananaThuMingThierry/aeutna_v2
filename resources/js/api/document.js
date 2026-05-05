import api from "./axios";

function toFormData(payload) {
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null || value === "") {
      formData.append(key, "");
      return;
    }

    formData.append(key, value);
  });

  return formData;
}

export const documentsApi = {
  async list() {
    const res = await api.get("/documents");
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/documents/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/documents", toFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return {
      data: res.data.document ?? res.data,
      message: res.data.message,
    };
  },

  async update(encryptedId, payload) {
    const formData = toFormData({ ...payload, _method: "PUT" });
    const res = await api.post(`/documents/${encryptedId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return {
      data: res.data.document ?? res.data,
      message: res.data.message,
    };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/documents/${encryptedId}`);
    return { message: res.data.message };
  },
};
