import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export const registrationDataAPI = {
  // Fetch available roles for registration
  getRoles: async () => {
    try {
      console.log(
        "🔍 Fetching roles from:",
        `${api.defaults.baseURL}/auth/registration-roles`
      );
      const response = await api.get("/auth/registration-roles");
      console.log("✅ Roles fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching roles:", error);
      throw error;
    }
  },

  // Fetch available departments for registration
  getDepartments: async () => {
    try {
      console.log(
        "🔍 Fetching departments from:",
        `${api.defaults.baseURL}/auth/registration-departments`
      );
      const response = await api.get("/auth/registration-departments");
      console.log("✅ Departments fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching departments:", error);
      throw error;
    }
  },

  // Fetch both roles and departments
  getRegistrationData: async () => {
    try {
      console.log("🔍 Fetching registration data...");
      console.log("API Base URL:", api.defaults.baseURL);

      const [rolesResponse, departmentsResponse] = await Promise.all([
        api.get("/auth/registration-roles"),
        api.get("/auth/registration-departments"),
      ]);

      const result = {
        roles: rolesResponse.data.data || [],
        departments: departmentsResponse.data.data || [],
      };

      console.log("✅ Registration data fetched successfully:");
      console.log("Roles:", result.roles);
      console.log("Departments:", result.departments);

      return result;
    } catch (error) {
      console.error("❌ Error fetching registration data:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      throw error;
    }
  },
};
