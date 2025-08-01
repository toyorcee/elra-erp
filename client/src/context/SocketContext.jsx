import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

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

  let authContext = null;
  try {
    authContext = useAuth();
  } catch (error) {
    console.log("🔍 SocketProvider: Auth context not ready yet");
  }

  const { user, isAuthenticated } = authContext || {
    user: null,
    isAuthenticated: false,
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
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
      query: { userId: user._id },
      withCredentials: true,
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ Socket.IO connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket.IO disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error);
      setIsConnected(false);
    });

    // Real-time notifications
    newSocket.on("newNotification", (notification) => {
      console.log("🔔 New notification received:", notification);

      // Show toast notification
      toast.info(notification.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });

    // User online/offline events
    newSocket.on("userOnline", ({ userId }) => {
      console.log("👤 User online:", userId);
    });

    newSocket.on("userOffline", ({ userId }) => {
      console.log("👤 User offline:", userId);
    });

    // Chat messages
    newSocket.on("receiveMessage", (message) => {
      console.log("💬 New message received:", message);

      // Show toast for new messages
      toast.info(`New message from ${message.sender?.name || "User"}`, {
        position: "top-right",
        autoClose: 3000,
      });
    });

    newSocket.on("messageSent", (message) => {
      console.log("✅ Message sent successfully:", message);
    });

    // Error handling
    newSocket.on("error", (error) => {
      console.error("❌ Socket error:", error);
      toast.error("Connection error. Please refresh the page.");
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Socket methods
  const sendMessage = (data) => {
    if (socket && isConnected) {
      socket.emit("sendMessage", data);
    }
  };

  const markMessageRead = (messageId) => {
    if (socket && isConnected) {
      socket.emit("markMessageRead", { messageId, userId: user?._id });
    }
  };

  const value = {
    socket,
    isConnected,
    sendMessage,
    markMessageRead,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
