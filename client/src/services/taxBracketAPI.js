import api from "./api";

// Get all active tax brackets
export const fetchTaxBrackets = async () => {
  const response = await api.get("/tax-brackets");
  return response.data;
};

// Get PAYE info for tooltip
export const fetchPAYEInfo = async () => {
  const response = await api.get("/tax-brackets/paye-info");
  return response.data;
};
