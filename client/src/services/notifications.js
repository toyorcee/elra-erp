import api from "./api";

class NotificationService {
  // Get user's notifications
  async getNotifications(page = 1, limit = 20) {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Get unread notification count
  async getUnreadCount() {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await api.patch("/notifications/mark-all-read");
    return response.data;
  }

  // Delete notification
  async deleteNotification(notificationId) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  // Get notification preferences
  async getPreferences() {
    const response = await api.get("/notifications/preferences");
    return response.data;
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    const response = await api.put("/notifications/preferences", preferences);
    return response.data;
  }

  // Test notification (development)
  async testNotification(type = "SYSTEM_ALERT", priority = "medium") {
    const response = await api.post("/notifications/test", { type, priority });
    return response.data;
  }
}

export default new NotificationService(); 