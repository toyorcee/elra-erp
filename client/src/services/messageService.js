import api from "./api.js";

class MessageService {
  // Get chat history between two users
  async getChatHistory(otherUserId, page = 1, limit = 50) {
    try {
      const response = await api.get(`/messages/history`, {
        params: { otherUserId, page, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      throw error;
    }
  }

  // Get all conversations for current user
  async getConversations() {
    try {
      const response = await api.get(`/messages/conversations`);
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(recipientId, content, documentId = null) {
    try {
      const response = await api.post(`/messages/send`, {
        recipientId,
        content,
        documentId,
      });
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  // Mark messages as read from a specific sender
  async markMessagesAsRead(senderId) {
    try {
      const response = await api.patch(`/messages/read/${senderId}`);
      return response.data;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  }

  // Get online users
  async getOnlineUsers() {
    try {
      const response = await api.get(`/messages/online-users`);
      return response.data;
    } catch (error) {
      console.error("Error fetching online users:", error);
      throw error;
    }
  }

  // Update last seen
  async updateLastSeen() {
    try {
      const response = await api.patch(`/messages/last-seen`);
      return response.data;
    } catch (error) {
      console.error("Error updating last seen:", error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount() {
    try {
      const response = await api.get(`/messages/unread-count`);
      return response.data;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId) {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }

  // Update typing status
  async updateTypingStatus(recipientId, isTyping) {
    try {
      const response = await api.patch(`/messages/typing`, {
        recipientId,
        isTyping,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating typing status:", error);
      throw error;
    }
  }

  async getAvailableUsers(search = "") {
    try {
      const response = await api.get(
        `/messages/available-users${
          search ? `?search=${encodeURIComponent(search)}` : ""
        }`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching available users:", error);
      throw error;
    }
  }
}

export default new MessageService();
