import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getChatHistory,
  getConversations,
  sendMessage,
  markMessagesAsRead,
  getOnlineUsers,
  updateLastSeen,
  getUnreadCount,
  getUnreadMessages,
  deleteMessage,
  updateTypingStatus,
  getAvailableUsers,
} from "../controllers/messageController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get chat history between two users
router.get("/history", getChatHistory);

// Get all conversations for current user
router.get("/conversations", getConversations);

// Get available users based on approval hierarchy
router.get("/available-users", getAvailableUsers);

// Send a message
router.post("/send", sendMessage);

// Mark messages as read from a specific sender
router.patch("/read/:senderId", markMessagesAsRead);

// Get online users
router.get("/online-users", getOnlineUsers);

// Update last seen
router.patch("/last-seen", updateLastSeen);

// Get unread message count
router.get("/unread-count", getUnreadCount);

// Get unread messages
router.get("/unread", getUnreadMessages);

// Delete a message
router.delete("/:id", deleteMessage);

// Update typing status
router.patch("/typing", updateTypingStatus);

export default router;
