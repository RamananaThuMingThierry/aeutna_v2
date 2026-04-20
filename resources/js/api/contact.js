import api from "./axios";

export async function submitContactApi(payload) {
  const response = await api.post("/contact-us", payload);
  return response.data;
}
