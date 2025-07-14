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
  deleteMessage,
} from "../controllers/messageController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get chat history between two users
router.get("/history", getChatHistory);

// Get all conversations for current user
router.get("/conversations", getConversations);

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

// Delete a message
router.delete("/:id", deleteMessage);

export default router;
 