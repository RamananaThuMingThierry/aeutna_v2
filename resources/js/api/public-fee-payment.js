import api from "./axios";

export const publicFeePaymentsApi = {
  async meta() {
    const response = await api.get("/public-fee-payments/meta");
    return response.data;
  },

  async searchMember(memberNumber) {
    const response = await api.post("/public-fee-payments/search-member", { member_number: memberNumber });
    return response.data;
  },

  async submit(payload) {
    const response = await api.post("/public-fee-payments", payload);
    return response.data;
  },
};
