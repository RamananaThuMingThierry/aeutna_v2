import api from "./axios";

export async function registerApi(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginApi(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function meApi() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function updateProfileApi(payload) {
  const { data } = await api.post("/auth/me?_method=PUT", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export async function logoutApi() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function forgotPasswordApi(payload) {
  const { data } = await api.post("/auth/forgot-password", payload);
  return data;
}

export async function verifyResetCodeApi(payload) {
  const { data } = await api.post("/auth/forgot-password/verify-code", payload);
  return data;
}

export async function resetPasswordApi(payload) {
  const { data } = await api.post("/auth/reset-password", payload);
  return data;
}
