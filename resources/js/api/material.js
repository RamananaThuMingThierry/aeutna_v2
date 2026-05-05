import api from "./axios";

function buildMaterialPayload(payload) {
  const hasFiles = Array.isArray(payload?.images) && payload.images.length > 0;
  const hasDeletedIds = Array.isArray(payload?.deleted_image_ids) && payload.deleted_image_ids.length > 0;

  if (!hasFiles && !hasDeletedIds) {
    return payload;
  }

  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (key === "images" || key === "deleted_image_ids") return;
    if (value === undefined) return;
    formData.append(key, value ?? "");
  });

  (payload.images || []).forEach((file) => {
    formData.append("images[]", file);
  });

  (payload.deleted_image_ids || []).forEach((id, index) => {
    formData.append(`deleted_image_ids[${index}]`, String(id));
  });

  return formData;
}

export const materialsApi = {
  async list(params = {}) {
    const res = await api.get("/materials", { params });
    return res.data;
  },

  async show(encryptedId) {
    const res = await api.get(`/materials/${encryptedId}`);
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/materials", buildMaterialPayload(payload));
    return { data: res.data.material ?? res.data, message: res.data.message };
  },

  async update(encryptedId, payload) {
    const body = buildMaterialPayload(payload);

    if (body instanceof FormData) {
      body.append("_method", "PUT");
    }

    const res = await api.post(`/materials/${encryptedId}`, body instanceof FormData ? body : payload);
    return { data: res.data.material ?? res.data, message: res.data.message };
  },

  async remove(encryptedId) {
    const res = await api.delete(`/materials/${encryptedId}`);
    return { message: res.data.message };
  },
};

