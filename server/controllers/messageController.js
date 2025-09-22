import Message from "../models/Message.js";
import User from "../models/User.js";

function getSocketIdByUserId(userId) {
  return null;
}

async function createMessageNotification(message, recipient) {
  try {
    if (typeof global.notificationService !== "undefined") {
      await global.notificationService.createNotification({
        recipient: recipient._id,
        type: "MESSAGE_RECEIVED",
        title: `New message received`,
        message: `You have a new message from ${
          message.sender.firstName || message.sender.name
        }`,
        data: {
          senderId: message.sender._id,
          messageId: message._id,
          actionUrl: `/messages?conversation=${message.sender._id}`,
          priority: "medium",
        },
      });
    }
  } catch (error) {
    console.error("Error creating message notification:", error);
  }
}

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
        { sender: currentUser._id, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUser._id },
      ],
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "name email avatar firstName lastName")
      .populate("recipient", "name email avatar firstName lastName")
      .populate("document", "title reference");

    const total = await Message.countDocuments({
      $or: [
        { sender: currentUser._id, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUser._id },
      ],
      isActive: true,
    });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: otherUserId,
        recipient: currentUser._id,
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
      data: messages.reverse(),
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
          $or: [{ sender: currentUser._id }, { recipient: currentUser._id }],
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
              { $eq: ["$sender", currentUser._id] },
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
                    { $eq: ["$recipient", currentUser._id] },
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
        select:
          "name email avatar firstName lastName lastSeen isOnline department role",
        model: "User",
        populate: [
          {
            path: "department",
            select: "name",
            model: "Department",
          },
          {
            path: "role",
            select: "name level",
            model: "Role",
          },
        ],
      },
      {
        path: "lastMessage.sender",
        select: "name email avatar firstName lastName",
        model: "User",
      },
      {
        path: "lastMessage.recipient",
        select: "name email avatar firstName lastName",
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

// Send a message
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

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    const message = new Message({
      sender: currentUser._id,
      recipient: recipientId,
      content: content.trim(),
      document: documentId || null,
    });

    await message.save();

    await message.populate("sender", "name email avatar firstName lastName");
    await message.populate("recipient", "name email avatar firstName lastName");
    if (documentId) {
      await message.populate("document", "title reference");
    }

    await createMessageNotification(message, recipient);

    if (global.io) {
      global.io.to(recipientId.toString()).emit("receiveMessage", {
        _id: message._id,
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        document: message.document,
        createdAt: message.createdAt,
        isRead: false,
      });

      global.io.to(recipientId.toString()).emit("messageDelivered", {
        messageId: message._id,
        recipientId: recipientId,
        deliveredAt: new Date(),
      });

      global.io.to(currentUser._id.toString()).emit("messageSent", {
        _id: message._id,
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        document: message.document,
        createdAt: message.createdAt,
        isRead: false,
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
        recipient: currentUser._id,
        isRead: false,
        isActive: true,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Emit read status to sender if online
    if (global.io && result.modifiedCount > 0) {
      global.io.to(senderId.toString()).emit("messagesRead", {
        readerId: currentUser._id,
        count: result.modifiedCount,
      });
    }

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
      _id: { $ne: currentUser._id },
      isActive: true,
    })
      .select(
        "name email avatar firstName lastName lastSeen isOnline department role"
      )
      .populate("department", "name")
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

    await User.findByIdAndUpdate(currentUser._id, {
      lastSeen: new Date(),
      isOnline: true,
    });

    // Emit online status to other users
    if (global.io) {
      global.io.broadcast.emit("userOnline", {
        userId: currentUser._id,
        lastSeen: new Date(),
      });
    }

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

// Get unread messages for current user
export const getUnreadMessages = async (req, res) => {
  try {
    const currentUser = req.user;
    const { limit = 10 } = req.query;

    const unreadMessages = await Message.find({
      recipient: currentUser._id,
      isRead: false,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("sender", "firstName lastName email avatar")
      .populate("recipient", "firstName lastName email avatar");

    res.json({
      success: true,
      data: unreadMessages,
    });
  } catch (error) {
    console.error("Get unread messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread messages",
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const currentUser = req.user;

    const count = await Message.countDocuments({
      recipient: currentUser._id,
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
      sender: currentUser._id,
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

    // Emit message deletion to recipient if online
    if (global.io) {
      global.io.to(message.recipient.toString()).emit("messageDeleted", {
        messageId: message._id,
        deletedBy: currentUser._id,
      });
    }

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

// Get user typing status
export const updateTypingStatus = async (req, res) => {
  try {
    const currentUser = req.user;
    const { recipientId, isTyping } = req.body;

    if (global.io) {
      global.io.to(recipientId.toString()).emit("userTyping", {
        userId: currentUser._id,
        isTyping,
      });
    }

    res.json({
      success: true,
      message: "Typing status updated",
    });
  } catch (error) {
    console.error("Update typing status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update typing status",
    });
  }
};

// Get available users based on role-based chat access
export const getAvailableUsers = async (req, res) => {
  try {
    const currentUser = req.user;
    const { search } = req.query;

    // Get current user with populated role and department
    const userWithDetails = await User.findById(currentUser._id)
      .populate("role", "name level")
      .populate("department", "name");

    if (!userWithDetails) {
      console.error("❌ User not found:", currentUser._id);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      `🔍 [MESSAGES] Getting available users for ${userWithDetails.role?.name} (Level: ${userWithDetails.role?.level})`
    );

    // Build base query
    let query = {
      _id: { $ne: currentUser._id }, // Exclude current user
      isActive: true,
    };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    let users = [];
    const userRoleLevel = userWithDetails.role?.level || 0;

    if (userRoleLevel >= 1000) {
      // SUPER ADMIN: Can chat with everyone
      console.log("🔍 [MESSAGES] Super Admin - showing all users");
      users = await User.find(query)
        .select(
          "firstName lastName email avatar department role lastSeen isOnline"
        )
        .populate("department", "name")
        .populate("role", "name level")
        .sort({ "role.level": -1, firstName: 1 })
        .limit(100);
    } else if (userRoleLevel >= 700) {
      // HOD: Can chat with anyone in their department + fellow HODs
      console.log("🔍 [MESSAGES] HOD - showing department users + fellow HODs");
      users = await User.find({
        ...query,
        $or: [
          // Users in same department
          { department: userWithDetails.department?._id },
          // Fellow HODs (level 700) from other departments
          { "role.level": 700 },
        ],
      })
        .select(
          "firstName lastName email avatar department role lastSeen isOnline"
        )
        .populate("department", "name")
        .populate("role", "name level")
        .sort({ "role.level": -1, firstName: 1 })
        .limit(50);
    } else if (userRoleLevel >= 600) {
      // MANAGER: Can chat with HODs and higher roles in their department
      console.log(
        "🔍 [MESSAGES] Manager - showing HODs and higher in department"
      );
      users = await User.find({
        ...query,
        $and: [
          { department: userWithDetails.department?._id },
          { "role.level": { $gte: 700 } }, // HODs and above
        ],
      })
        .select(
          "firstName lastName email avatar department role lastSeen isOnline"
        )
        .populate("department", "name")
        .populate("role", "name level")
        .sort({ "role.level": -1, firstName: 1 })
        .limit(30);
    } else if (userRoleLevel >= 300) {
      console.log(
        "🔍 [MESSAGES] Staff - showing HODs and higher in department"
      );
      users = await User.find({
        ...query,
        $and: [
          { department: userWithDetails.department?._id },
          { "role.level": { $gte: 700 } },
        ],
      })
        .select(
          "firstName lastName email avatar department role lastSeen isOnline"
        )
        .populate("department", "name")
        .populate("role", "name level")
        .sort({ "role.level": -1, firstName: 1 })
        .limit(20);
    } else {
      console.log(
        "🔍 [MESSAGES] Viewer - showing HODs and higher in department"
      );
      users = await User.find({
        ...query,
        $and: [
          { department: userWithDetails.department?._id },
          { "role.level": { $gte: 700 } },
        ],
      })
        .select(
          "firstName lastName email avatar department role lastSeen isOnline"
        )
        .populate("department", "name")
        .populate("role", "name level")
        .sort({ "role.level": -1, firstName: 1 })
        .limit(15);
    }

    let recentConversations = [];
    try {
      const recentMessages = await Message.find({
        $or: [{ sender: currentUser._id }, { recipient: currentUser._id }],
      })
        .populate("sender", "firstName lastName email avatar department role")
        .populate(
          "recipient",
          "firstName lastName email avatar department role"
        )
        .populate("sender.department", "name")
        .populate("recipient.department", "name")
        .populate("sender.role", "name level")
        .populate("recipient.role", "name level")
        .sort({ createdAt: -1 })
        .limit(50);

      const recentUserIds = new Set();
      recentMessages.forEach((message) => {
        const otherUser =
          message.sender._id.toString() === currentUser._id.toString()
            ? message.recipient
            : message.sender;

        if (!recentUserIds.has(otherUser._id.toString())) {
          recentUserIds.add(otherUser._id.toString());
          recentConversations.push(otherUser);
        }
      });

      console.log(
        `🔍 [MESSAGES] Found ${recentConversations.length} recent conversations for user`
      );
    } catch (error) {
      console.error("Error fetching recent conversations:", error);
    }

    res.json({
      success: true,
      data: users,
      recentConversations: recentConversations,
      userRole: {
        name: userWithDetails.role?.name,
        level: userWithDetails.role?.level,
        department: userWithDetails.department?.name,
      },
    });
  } catch (error) {
    console.error("❌ Get available users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available users",
    });
  }
};
