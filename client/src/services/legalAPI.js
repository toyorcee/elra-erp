import api from "./api";

export const legalPolicyAPI = {
  getPolicyCategories: async () => {
    const res = await api.get("/legal/policies/categories/available");
    return res.data?.data?.categories || [];
  },
  getPolicies: async () => {
    const res = await api.get("/legal/policies");
    return res.data;
  },
  createPolicy: async (payload) => {
    const res = await api.post("/legal/policies", payload);
    return res.data;
  },
  updatePolicy: async (id, payload) => {
    const res = await api.put(`/legal/policies/${id}`, payload);
    return res.data;
  },
  deletePolicy: async (id) => {
    const res = await api.delete(`/legal/policies/${id}`);
    return res.data;
  },
};

export const legalComplianceAPI = {
  getComplianceCategories: async () => {
    const res = await api.get("/legal/compliance/categories/available");
    return res.data?.data?.categories || [];
  },
  getComplianceItems: async () => {
    const res = await api.get("/legal/compliance");
    return res.data;
  },
  createCompliance: async (payload) => {
    const res = await api.post("/legal/compliance", payload);
    return res.data;
  },
  updateCompliance: async (id, payload) => {
    const res = await api.put(`/legal/compliance/${id}`, payload);
    return res.data;
  },
  deleteCompliance: async (id) => {
    const res = await api.delete(`/legal/compliance/${id}`);
    return res.data;
  },
  getComplianceStats: async () => {
    const res = await api.get("/legal/compliance/stats/overview");
    return res.data;
  },
  getOverdueItems: async () => {
    const res = await api.get("/legal/compliance/overdue/items");
    return res.data;
  },
  getDueSoonItems: async () => {
    const res = await api.get("/legal/compliance/due-soon/items");
    return res.data;
  },
};

export const legalComplianceProgramAPI = {
  getCompliancePrograms: async () => {
    const res = await api.get("/legal/compliance-programs");
    return res.data;
  },
  getComplianceProgramById: async (id) => {
    const res = await api.get(`/legal/compliance-programs/${id}`);
    return res.data;
  },
  createComplianceProgram: async (payload) => {
    const res = await api.post("/legal/compliance-programs", payload);
    return res.data;
  },
  updateComplianceProgram: async (id, payload) => {
    const res = await api.put(`/legal/compliance-programs/${id}`, payload);
    return res.data;
  },
  deleteComplianceProgram: async (id) => {
    const res = await api.delete(`/legal/compliance-programs/${id}`);
    return res.data;
  },
  getComplianceProgramCategories: async () => {
    const res = await api.get(
      "/legal/compliance-programs/categories/available"
    );
    return res.data?.data?.categories || [];
  },
  getComplianceProgramStats: async () => {
    const res = await api.get("/legal/compliance-programs/stats/overview");
    return res.data;
  },
};

export default legalPolicyAPI;
