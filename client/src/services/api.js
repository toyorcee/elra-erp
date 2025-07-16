import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await authAPI.refreshToken();
        const { accessToken } = response.data;

        processQueue(null, accessToken);
        isRefreshing = false;

        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // If refresh fails, redirect to login
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      // Handle forbidden access
      if (window.location.pathname !== "/unauthorized") {
        window.location.href = "/unauthorized";
      }
    }

    if (error.response?.status === 500) {
      console.error("Server error occurred");
    }

    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  login: (credentials) =>
    api.post("/auth/login", credentials).then((res) => res.data),
  register: (userData) =>
    api.post("/auth/register", userData).then((res) => res.data),
  logout: () => api.post("/auth/logout").then((res) => res.data),
  refreshToken: () => api.post("/auth/refresh").then((res) => res.data),
  getProfile: () => api.get("/auth/me").then((res) => res.data),
  getMe: () => api.get("/auth/me").then((res) => res.data),
  forgotPassword: (data) =>
    api.post("/auth/forgot-password", data).then((res) => res.data),
  resetPassword: (data) =>
    api.post("/auth/reset-password", data).then((res) => res.data),
  isAuthenticated: () => {
    return (
      document.cookie.includes("accessToken=") ||
      document.cookie.includes("refreshToken=")
    );
  },
};

// Utility function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.message || "An error occurred",
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request was made but no response received
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
