import Message from "../models/Message.js";
import User from "../models/User.js";
import { io } from "../server.js";

export const getChatHistory = async (req, res) => {
  try {
    const currentUser = req.user;
    const { otherUserId, page = 1, limit = 50 } = req.query;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: "Other user ID is required",
      });
    }

    const skip = (page - 1) * limit;

    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: currentUser.userId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUser.userId },
      ],
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "name email avatar")
      .populate("recipient", "name email avatar")
      .populate("document", "title reference");

    const total = await Message.countDocuments({
      $or: [
        { sender: currentUser.userId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUser.userId },
      ],
      isActive: true,
    });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: otherUserId,
        recipient: currentUser.userId,
        isRead: false,
        isActive: true,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      data: messages.reverse(), // Show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
    });
  }
};

// Get all conversations for current user
export const getConversations = async (req, res) => {
  try {
    const currentUser = req.user;

    // Get the latest message from each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUser.userId },
            { recipient: currentUser.userId },
          ],
          isActive: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", currentUser.userId] },
              "$recipient",
              "$sender",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$recipient", currentUser.userId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
    ]);

    // Populate user details
    const populatedConversations = await Message.populate(conversations, [
      {
        path: "_id",
        select: "name email avatar lastSeen isOnline",
        model: "User",
      },
      {
        path: "lastMessage.sender",
        select: "name email avatar",
        model: "User",
      },
      {
        path: "lastMessage.recipient",
        select: "name email avatar",
        model: "User",
      },
      {
        path: "lastMessage.document",
        select: "title reference",
        model: "Document",
      },
    ]);

    res.json({
      success: true,
      data: populatedConversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};

// Send a message (HTTP endpoint for non-Socket.IO clients)
export const sendMessage = async (req, res) => {
  try {
    const currentUser = req.user;
    const { recipientId, content, documentId } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({
        success: false,
        message: "Recipient ID and content are required",
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    // Create message
    const message = new Message({
      sender: currentUser.userId,
      recipient: recipientId,
      content: content.trim(),
      document: documentId || null,
    });

    await message.save();

    // Populate sender and recipient details
    await message.populate("sender", "name email avatar");
    await message.populate("recipient", "name email avatar");
    if (documentId) {
      await message.populate("document", "title reference");
    }

    // Emit real-time message to recipient if online
    const recipientSocketId = getSocketIdByUserId(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", {
        _id: message._id,
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        document: message.document,
        createdAt: message.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const currentUser = req.user;
    const { senderId } = req.params;

    const result = await Message.updateMany(
      {
        sender: senderId,
        recipient: currentUser.userId,
        isRead: false,
        isActive: true,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} messages marked as read`,
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
    });
  }
};

// Get online users
export const getOnlineUsers = async (req, res) => {
  try {
    const currentUser = req.user;

    // Get all users with online status
    const users = await User.find({
      _id: { $ne: currentUser.userId },
      isActive: true,
    })
      .select("name email avatar lastSeen isOnline department role")
      .populate("role", "name level");

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get online users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch online users",
    });
  }
};

// Update user's last seen
export const updateLastSeen = async (req, res) => {
  try {
    const currentUser = req.user;

    await User.findByIdAndUpdate(currentUser.userId, {
      lastSeen: new Date(),
      isOnline: true,
    });

    res.json({
      success: true,
      message: "Last seen updated",
    });
  } catch (error) {
    console.error("Update last seen error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update last seen",
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const currentUser = req.user;

    const count = await Message.countDocuments({
      recipient: currentUser.userId,
      isRead: false,
      isActive: true,
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;

    const message = await Message.findOne({
      _id: id,
      sender: currentUser.userId,
      isActive: true,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or you cannot delete this message",
      });
    }

    message.isActive = false;
    await message.save();

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
};

// Helper function to get socket ID by user ID
function getSocketIdByUserId(userId) {
  // This would need to be implemented based on your socket connection management
  // For now, we'll return null and handle it in the socket connection
  return null;
}
 