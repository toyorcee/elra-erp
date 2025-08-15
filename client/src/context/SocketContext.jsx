import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";
import { SocketEventTypes } from "../types/messageTypes";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        console.log("🔌 Disconnecting socket - no user");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // If we have a socket but the user changed, disconnect and reconnect
    if (socket && socket.userId !== user._id) {
      console.log("🔌 User changed, reconnecting socket");
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }

    // Create socket connection
    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api", "")
      : "http://localhost:5000";

    const newSocket = io(socketUrl, {
      auth: {
        token: user.token,
      },
      query: {
        userId: user._id || user.id,
      },
      transports: ["websocket", "polling"],
    });

    // Store user ID in socket for comparison
    newSocket.userId = user._id || user.id;

    // Connection events
    newSocket.on("connect", () => {
      console.log("🔌 Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔌 Socket connection error:", error);
      setIsConnected(false);

      if (error.message === "Authentication failed") {
        toast.error("Authentication failed. Please log in again.");
        logout();
      }
    });

    // Message events
    newSocket.on(SocketEventTypes.RECEIVE_MESSAGE, (message) => {
      console.log("💬 Message received via socket:", message);
      console.log(
        "👤 Current user:",
        user._id,
        "Message sender:",
        message.sender._id
      );
      // Don't show toast - let the message count badge handle this
      // The useMessages hook will handle updating the unread count
    });

    newSocket.on(SocketEventTypes.MESSAGE_SENT, (message) => {
      console.log("✅ Message sent confirmation:", message);
    });

    newSocket.on(SocketEventTypes.MESSAGES_READ, (data) => {
      console.log("👁️ Messages read:", data);
    });

    newSocket.on(SocketEventTypes.MESSAGE_DELIVERED, (data) => {
      console.log("📨 Message delivered:", data);
    });

    newSocket.on(SocketEventTypes.USER_TYPING, (data) => {
      console.log("⌨️ User typing:", data);
    });

    newSocket.on(SocketEventTypes.MESSAGE_DELETED, (data) => {
      console.log("🗑️ Message deleted:", data);
    });

    newSocket.on(SocketEventTypes.USER_ONLINE, (data) => {
      console.log("🟢 User online:", data);
    });

    newSocket.on(SocketEventTypes.USER_OFFLINE, (data) => {
      console.log("🔴 User offline:", data);
    });

    newSocket.on("error", (error) => {
      console.error("❌ Socket error:", error);
      toast.error(error.message || "An error occurred");
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user, logout]);

  // Socket methods
  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit("sendMessage", messageData);
    } else {
      console.warn("Socket not connected, cannot send message");
    }
  };

  const markMessageRead = (senderId) => {
    if (socket && isConnected) {
      socket.emit("markMessageRead", { senderId });
    }
  };

  const updateTypingStatus = (recipientId, isTyping) => {
    if (socket && isConnected) {
      socket.emit("typing", { recipientId, isTyping });
    }
  };

  const deleteMessage = (messageId) => {
    if (socket && isConnected) {
      socket.emit("deleteMessage", { messageId });
    }
  };

  const value = {
    socket,
    isConnected,
    sendMessage,
    markMessageRead,
    updateTypingStatus,
    deleteMessage,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
