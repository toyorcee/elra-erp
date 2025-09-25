import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import messageService from "../services/messageService";
import { toast } from "react-toastify";
import {
  SocketEventTypes,
  formatUserStatus,
  getUserDisplayName,
  getUserInitials,
  isMessageType,
  isConversationType,
} from "../types/messageTypes";

export const useMessages = () => {
  const { user } = useAuth();
  const {
    socket,
    isConnected,
    sendMessage,
    markMessageRead,
    updateTypingStatus,
    deleteMessage,
  } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await messageService.getConversations();

      if (response.success && Array.isArray(response.data)) {
        setConversations(response.data);

        // Update unread counts
        const counts = {};
        response.data.forEach((conv) => {
          if (isConversationType(conv)) {
            counts[conv._id._id] = conv.unreadCount;
          }
        });
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadChatHistory = useCallback(
    async (otherUserId) => {
      try {
        const response = await messageService.getChatHistory(otherUserId);

        if (response.success && Array.isArray(response.data)) {
          const messagesWithStatus = response.data.map((message) => ({
            ...message,
            status: message.isRead ? "read" : "sent",
          }));

          setMessages((prev) => ({
            ...prev,
            [otherUserId]: messagesWithStatus,
          }));

          if (response.data.length > 0) {
            await messageService.markMessagesAsRead(otherUserId);
            markMessageRead(otherUserId);

            setUnreadCounts((prev) => ({
              ...prev,
              [otherUserId]: 0,
            }));
          }
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        toast.error("Failed to load chat history");
      }
    },
    [markMessageRead]
  );

  const sendNewMessage = useCallback(
    async (recipientId, content, documentId = null) => {
      const currentUserId = user?._id || user?.id;

      const optimisticMessage = {
        _id: `temp_${Date.now()}`,
        sender: {
          _id: currentUserId,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        recipient: { _id: recipientId },
        content: content.trim(),
        document: documentId,
        createdAt: new Date(),
        isRead: false,
        status: "sending",
      };

      setMessages((prev) => ({
        ...prev,
        [recipientId]: [...(prev[recipientId] || []), optimisticMessage],
      }));

      try {
        const response = await messageService.sendMessage(
          recipientId,
          content.trim(),
          documentId
        );

        if (response.success) {
          setMessages((prev) => ({
            ...prev,
            [recipientId]: (prev[recipientId] || []).map((msg) =>
              msg._id === optimisticMessage._id
                ? { ...response.data, status: "sent" }
                : msg
            ),
          }));

          setConversations((prev) => {
            const updated = prev.map((conv) =>
              conv._id._id === recipientId
                ? {
                    ...conv,
                    lastMessage: {
                      content: content.trim(),
                      createdAt: new Date(),
                    },
                  }
                : conv
            );
            return updated;
          });

          return response.success;
        } else {
          setMessages((prev) => ({
            ...prev,
            [recipientId]: (prev[recipientId] || []).filter(
              (msg) => msg._id !== optimisticMessage._id
            ),
          }));
          return false;
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => ({
          ...prev,
          [recipientId]: (prev[recipientId] || []).filter(
            (msg) => msg._id !== optimisticMessage._id
          ),
        }));
        toast.error("Failed to send message");
        return false;
      }
    },
    [user?._id || user?.id, user?.firstName, user?.lastName]
  );

  const handleMessageSent = (message) => {
    setMessages((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((userId) => {
        updated[userId] = updated[userId].map((msg) => {
          if (msg._id === message._id || msg.content === message.content) {
            return { ...msg, status: "sent", _id: message._id };
          }
          return msg;
        });
      });
      return updated;
    });
  };

  // Handle message received (for delivery receipts)
  const handleMessageReceived = (message) => {
    setMessages((prev) => ({
      ...prev,
      [message.sender._id]: [...(prev[message.sender._id] || []), message],
    }));

    setConversations((prev) => {
      const existingIndex = prev.findIndex(
        (conv) => conv._id._id === message.sender._id
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastMessage: {
            content: message.content,
            createdAt: message.createdAt,
          },
        };
        return updated;
      }
      return prev;
    });

    setUnreadCounts((prev) => ({
      ...prev,
      [message.sender._id]: (prev[message.sender._id] || 0) + 1,
    }));
  };

  const handleMessagesRead = (data) => {
    setMessages((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((userId) => {
        if (userId === data.readerId) {
          updated[userId] = updated[userId].map((msg) => {
            const newStatus = msg.status === "sent" ? "read" : msg.status;
            return {
              ...msg,
              isRead: true,
              status: newStatus,
            };
          });
        }
      });
      return updated;
    });

    // Reset unread count
    setUnreadCounts((prev) => ({
      ...prev,
      [data.readerId]: 0,
    }));
  };

  // Handle message delivered (for delivery receipts)
  const handleMessageDelivered = (data) => {
    setMessages((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((userId) => {
        updated[userId] = updated[userId].map((msg) => {
          if (msg._id === data.messageId) {
            return { ...msg, status: "delivered" };
          }
          return msg;
        });
      });
      return updated;
    });
  };

  // Mark messages as read
  const markMessagesAsReadForUser = useCallback(
    async (senderId) => {
      try {
        await messageService.markMessagesAsRead(senderId);
        markMessageRead(senderId);

        // Update unread count
        setUnreadCounts((prev) => ({
          ...prev,
          [senderId]: 0,
        }));
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    },
    [markMessageRead]
  );

  // Delete a message
  const deleteMessageById = useCallback(
    async (messageId) => {
      try {
        await messageService.deleteMessage(messageId);
        deleteMessage(messageId);

        // Remove from local state
        setMessages((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((userId) => {
            updated[userId] = updated[userId].filter(
              (msg) => msg._id !== messageId
            );
          });
          return updated;
        });

        return true;
      } catch (error) {
        console.error("Error deleting message:", error);
        toast.error("Failed to delete message");
        return false;
      }
    },
    [deleteMessage]
  );

  // Update typing status
  const updateTypingStatusForUser = useCallback(
    (recipientId, isTyping) => {
      updateTypingStatus(recipientId, isTyping);
    },
    [updateTypingStatus]
  );

  // Get total unread count
  const getTotalUnreadCount = useCallback(() => {
    return Object.values(unreadCounts).reduce(
      (total, count) => total + count,
      0
    );
  }, [unreadCounts]);

  // Get conversation by user ID
  const getConversationByUserId = useCallback(
    (userId) => {
      return conversations.find((conv) => conv._id._id === userId);
    },
    [conversations]
  );

  // Get messages for a user (filter out inactive messages)
  const getMessagesForUser = useCallback(
    (userId) => {
      const userMessages = messages[userId] || [];
      // Filter out inactive/deleted messages
      return userMessages.filter((message) => message.isActive !== false);
    },
    [messages]
  );

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      handleMessageReceived(message);
    };

    // Handle message sent confirmation
    const handleMessageSentConfirmation = (message) => {
      handleMessageSent(message);
    };

    // Handle messages read
    const handleMessagesReadConfirmation = (data) => {
      handleMessagesRead(data);
    };

    // Handle message delivered
    const handleMessageDeliveredConfirmation = (data) => {
      handleMessageDelivered(data);
    };

    // Handle user typing
    const handleUserTyping = (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };

    // Handle user online/offline
    const handleUserOnline = (data) => {
      setOnlineUsers((prev) => new Set([...prev, data.userId]));
    };

    const handleUserOffline = (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    // Handle message deletion
    const handleMessageDeleted = (data) => {
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((userId) => {
          updated[userId] = updated[userId].filter(
            (msg) => msg._id !== data.messageId
          );
        });
        return updated;
      });
    };

    // Add event listeners
    socket.on(SocketEventTypes.RECEIVE_MESSAGE, handleReceiveMessage);
    socket.on(SocketEventTypes.MESSAGE_SENT, handleMessageSentConfirmation);
    socket.on(SocketEventTypes.MESSAGES_READ, handleMessagesReadConfirmation);
    socket.on(
      SocketEventTypes.MESSAGE_DELIVERED,
      handleMessageDeliveredConfirmation
    );
    socket.on(SocketEventTypes.USER_TYPING, handleUserTyping);
    socket.on(SocketEventTypes.USER_ONLINE, handleUserOnline);
    socket.on(SocketEventTypes.USER_OFFLINE, handleUserOffline);
    socket.on(SocketEventTypes.MESSAGE_DELETED, handleMessageDeleted);

    return () => {
      socket.off(SocketEventTypes.RECEIVE_MESSAGE, handleReceiveMessage);
      socket.off(SocketEventTypes.MESSAGE_SENT, handleMessageSentConfirmation);
      socket.off(
        SocketEventTypes.MESSAGES_READ,
        handleMessagesReadConfirmation
      );
      socket.off(
        SocketEventTypes.MESSAGE_DELIVERED,
        handleMessageDeliveredConfirmation
      );
      socket.off(SocketEventTypes.USER_TYPING, handleUserTyping);
      socket.off(SocketEventTypes.USER_ONLINE, handleUserOnline);
      socket.off(SocketEventTypes.USER_OFFLINE, handleUserOffline);
      socket.off(SocketEventTypes.MESSAGE_DELETED, handleMessageDeleted);
    };
  }, [socket, user._id]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    // State
    conversations,
    messages,
    unreadCounts,
    onlineUsers,
    typingUsers,
    isLoading,

    // Actions
    loadConversations,
    loadChatHistory,
    sendNewMessage,
    markMessagesAsReadForUser,
    deleteMessageById,
    updateTypingStatusForUser,

    // Computed values
    getTotalUnreadCount,
    getConversationByUserId,
    getMessagesForUser,

    // Utility functions
    formatUserStatus: (user) => formatUserStatus(user, onlineUsers),
    getUserDisplayName,
    getUserInitials,
  };
};
