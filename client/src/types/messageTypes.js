// Message Types for consistent frontend/backend communication

// Message object structure
export const MessageType = {
  _id: String,
  sender: {
    _id: String,
    name: String,
    email: String,
    avatar: String,
    firstName: String,
    lastName: String,
  },
  recipient: {
    _id: String,
    name: String,
    email: String,
    avatar: String,
    firstName: String,
    lastName: String,
  },
  content: String,
  document:
    {
      _id: String,
      title: String,
      reference: String,
    } || null,
  isRead: Boolean,
  readAt: Date || null,
  createdAt: Date,
  updatedAt: Date,
};

// Conversation object structure
export const ConversationType = {
  _id: {
    _id: String,
    name: String,
    email: String,
    avatar: String,
    firstName: String,
    lastName: String,
    lastSeen: Date,
    isOnline: Boolean,
    department: {
      _id: String,
      name: String,
    },
    role: {
      _id: String,
      name: String,
      level: Number,
    },
  },
  lastMessage: MessageType,
  unreadCount: Number,
};

// Socket event types
export const SocketEventTypes = {
  RECEIVE_MESSAGE: "receiveMessage",
  MESSAGE_SENT: "messageSent",
  MESSAGES_READ: "messagesRead",
  MESSAGE_DELIVERED: "messageDelivered",
  USER_TYPING: "userTyping",
  USER_ONLINE: "userOnline",
  USER_OFFLINE: "userOffline",
  MESSAGE_DELETED: "messageDeleted",
};

// Message status types
export const MessageStatus = {
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
};

// User status types
export const UserStatus = {
  ONLINE: "online",
  OFFLINE: "offline",
  AWAY: "away",
  BUSY: "busy",
};

// API response structure
export const ApiResponseType = {
  success: Boolean,
  message: String,
  data: Object || Array,
  pagination:
    {
      page: Number,
      limit: Number,
      total: Number,
      pages: Number,
    } || null,
};

// Socket message payload types
export const SocketPayloadTypes = {
  // Send message payload
  sendMessage: {
    sender: String, // user ID
    recipient: String, // user ID
    content: String,
    document: String || null, // document ID
  },

  // Receive message payload
  receiveMessage: MessageType,

  // Message sent confirmation
  messageSent: MessageType,

  // Message read notification
  messagesRead: {
    readerId: String,
    count: Number,
    messageId: String,
  },

  // Message deleted notification
  messageDeleted: {
    messageId: String,
    deletedBy: String,
  },

  // Typing status
  userTyping: {
    userId: String,
    isTyping: Boolean,
  },

  // User online/offline
  userOnline: {
    userId: String,
    lastSeen: Date,
  },

  userOffline: {
    userId: String,
  },

  // Error payload
  error: {
    message: String,
    code: String || null,
  },
};

// Helper functions for type checking
export const isMessageType = (obj) => {
  return (
    obj &&
    typeof obj._id === "string" &&
    obj.sender &&
    typeof obj.sender._id === "string" &&
    obj.recipient &&
    typeof obj.recipient._id === "string" &&
    typeof obj.content === "string" &&
    typeof obj.isRead === "boolean" &&
    obj.createdAt instanceof Date
  );
};

export const isConversationType = (obj) => {
  return (
    obj &&
    obj._id &&
    typeof obj._id._id === "string" &&
    typeof obj.unreadCount === "number"
  );
};

export const isApiResponseType = (obj) => {
  return (
    obj && typeof obj.success === "boolean" && typeof obj.message === "string"
  );
};

// Message utility functions
export const formatMessageTime = (date) => {
  if (!date) return "";
  const messageDate = new Date(date);
  const now = new Date();
  const diffMinutes = Math.floor((now - messageDate) / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return messageDate.toLocaleDateString();
};

export const formatUserStatus = (user, onlineUsers) => {
  if (onlineUsers.has(user._id)) {
    return UserStatus.ONLINE;
  }
  if (user.lastSeen) {
    const lastSeen = new Date(user.lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));

    if (diffMinutes < 1) return UserStatus.ONLINE;
    if (diffMinutes < 5) return UserStatus.AWAY;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  }
  return UserStatus.OFFLINE;
};

export const getUserDisplayName = (user) => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.name || user.email || "Unknown User";
};

export const getUserInitials = (user) => {
  if (user.avatar) return user.avatar;
  if (user.firstName) return user.firstName[0].toUpperCase();
  if (user.name) return user.name[0].toUpperCase();
  return "U";
};
