import api from "./api";

const base = "/communication";

export const communicationAPI = {
  // Events
  getAllEvents: async (params = {}) => {
    const res = await api.get(`${base}/events/all`, { params });
    return res.data;
  },
  getEvents: async (params = {}) => {
    const res = await api.get(`${base}/events`, { params });
    return res.data;
  },
  createEvent: async (payload) => {
    const res = await api.post(`${base}/events`, payload);
    return res.data;
  },
  updateEvent: async (id, payload) => {
    const res = await api.patch(`${base}/events/${id}`, payload);
    return res.data;
  },
  deleteEvent: async (id) => {
    const res = await api.delete(`${base}/events/${id}`);
    return res.data;
  },

  // Announcements
  getAnnouncements: async (params = {}) => {
    const res = await api.get(`${base}/announcements`, { params });
    return res.data;
  },
  createAnnouncement: async (payload) => {
    const res = await api.post(`${base}/announcements`, payload);
    return res.data;
  },
  // Department-scoped announcement (HOD)
  createDepartmentAnnouncement: async ({
    title,
    body,
    departmentId,
    attachments = [],
    priority = "normal",
    isActive = true,
  }) => {
    const payload = {
      title,
      body,
      audienceScope: "department",
      department: departmentId,
      attachments,
      priority,
      isActive,
    };
    const res = await api.post(`${base}/announcements`, payload);
    return res.data;
  },
  updateAnnouncement: async (id, payload) => {
    const res = await api.patch(`${base}/announcements/${id}`, payload);
    return res.data;
  },
  deleteAnnouncement: async (id) => {
    const res = await api.delete(`${base}/announcements/${id}`);
    return res.data;
  },
  uploadAttachments: async (formData) => {
    const res = await api.post(
      `${base}/announcements/upload-attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  },

  // Department-scoped helpers
  getDepartmentAnnouncements: async ({
    departmentId,
    page = 1,
    limit = 20,
    search = "",
  } = {}) => {
    const params = {
      audienceScope: "department",
      departmentId,
      page,
      limit,
      search,
    };
    const res = await api.get(`${base}/announcements`, { params });
    return res.data;
  },

  updateDepartmentAnnouncement: async (id, payload = {}) => {
    const res = await api.patch(`${base}/announcements/${id}`, {
      ...payload,
      audienceScope: "department",
    });
    return res.data;
  },

  deleteDepartmentAnnouncement: async (id) => {
    const res = await api.delete(`${base}/announcements/${id}`);
    return res.data;
  },
};

export default communicationAPI;
