import api from "./api";

export const getCompanies = () => api.get("/platform/companies");

export const createCompanyAndSuperadmin = (data) =>
  api.post("/platform/companies", data);

export const getPlatformStatistics = () => api.get("/platform/statistics");
