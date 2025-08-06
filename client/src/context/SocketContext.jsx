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
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api", "")
      : "http://localhost:5000";

    const newSocket = io(socketUrl, {
      auth: {
        token: user.token,
      },
      transports: ["websocket", "polling"],
    });

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
      toast.info(
        `New message from ${
          message.sender?.firstName || message.sender?.name || "Unknown"
        }`
      );
    });

    newSocket.on(SocketEventTypes.MESSAGE_SENT, (message) => {
      console.log("✅ Message sent confirmation:", message);
    });

    newSocket.on(SocketEventTypes.MESSAGE_READ, (data) => {
      console.log("👁️ Messages read:", data);
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

    newSocket.on(SocketEventTypes.ERROR, (error) => {
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
      socket.emit(SocketEventTypes.SEND_MESSAGE, messageData);
    } else {
      console.warn("Socket not connected, cannot send message");
    }
  };

  const markMessageRead = (senderId) => {
    if (socket && isConnected) {
      socket.emit(SocketEventTypes.MESSAGE_READ, { senderId });
    }
  };

  const updateTypingStatus = (recipientId, isTyping) => {
    if (socket && isConnected) {
      socket.emit(SocketEventTypes.TYPING, { recipientId, isTyping });
    }
  };

  const deleteMessage = (messageId) => {
    if (socket && isConnected) {
      socket.emit(SocketEventTypes.MESSAGE_DELETED, { messageId });
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
