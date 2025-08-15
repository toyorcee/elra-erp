import axios from "axios";

console.log("API Base URL:", import.meta.env.VITE_API_URL);

let hasLoggedIn = false;
export const setHasLoggedIn = (value) => {
  hasLoggedIn = value;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      cookies: document.cookie,
    });

    const originalRequest = error.config;

    if (originalRequest.url === "/auth/refresh") {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      hasLoggedIn
    ) {
      if (isRefreshing) {
        console.log("⏳ Token refresh already in progress, queuing request");
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else {
      console.log("❌ Not attempting refresh:", {
        status: error.response?.status,
        hasRetry: originalRequest._retry,
        hasLoggedIn,
      });
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (formData) => {
    try {
      const response = await api.post("/auth/register", formData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return {
          success: false,
          error: error.response.data.message || "Registration failed",
        };
      }
      return { success: false, error: "Registration failed" };
    }
  },

  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.get("/auth/logout"),
  getMe: () => api.get("/auth/me"),

  updateProfile: async (formData) => {
    try {
      const response = await api.patch("/auth/updatedetails", formData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return {
          success: false,
          error: error.response.data.message || "Profile update failed",
        };
      }
      return { success: false, error: "Profile update failed" };
    }
  },

  updatePassword: async (formData) => {
    try {
      const response = await api.patch("/auth/updatepassword", formData);
      return response;
    } catch (error) {
      console.error("[authAPI.updatePassword] Error:", error);
      throw error;
    }
  },

  changePassword: async (formData) => {
    try {
      const response = await api.put("/auth/change-password", formData);
      return response.data;
    } catch (error) {
      console.error("[authAPI.changePassword] Error:", error);
      throw error;
    }
  },

  forgotPassword: async (data) => {
    try {
      const response = await api.post("/auth/forgotpassword", data);
      return response.data;
    } catch (error) {
      console.error("[authAPI.forgotPassword] Error:", error);
      throw error;
    }
  },

  resetPassword: async (data) => {
    try {
      const response = await api.post("/auth/resetpassword", {
        token: data.token,
        password: data.password,
      });

      return response.data;
    } catch (error) {
      console.error("[authAPI.resetPassword] Error:", error);
      throw error;
    }
  },

  resendVerification: async (data) => {
    try {
      const response = await api.post("/auth/resend-verification", data);
      return response;
    } catch (error) {
      console.error("[authAPI.resendVerification] Error:", error);
      throw error;
    }
  },

  joinCompany: async (data) => {
    try {
      const response = await api.post("/auth/join-company", data);
      return response;
    } catch (error) {
      console.error("[authAPI.joinCompany] Error:", error);
      throw error;
    }
  },
};

// Invitation API
export const invitationAPI = {
  verifyCode: async (code) => {
    try {
      const response = await api.post("/invitations/verify", { code });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// System Setup API
export const systemSetupAPI = {
  getIndustryTemplates: () => api.get("/system-setup/templates"),
  getSystemSetupStatus: (companyId) =>
    api.get(`/system-setup/status/${companyId}`),
  saveSystemSetup: (companyId, config) =>
    api.post(`/system-setup/${companyId}`, config),
};

// Utility function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    return {
      message: error.response.data?.message || "An error occurred",
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    return {
      message: "No response from server",
      status: null,
      data: null,
    };
  } else {
    return {
      message: error.message || "An unexpected error occurred",
      status: null,
      data: null,
    };
  }
};

export default api;
