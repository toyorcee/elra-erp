import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiChatBubbleLeftRight,
  HiXMark,
  HiPaperAirplane,
  HiUser,
  HiClock,
  HiCheckCircle,
} from "react-icons/hi2";
import { complaintAPI } from "../services/customerCareAPI";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const CustomerCareResponseChat = ({
  complaint,
  isOpen,
  onClose,
  onSessionEnd,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && complaint) {
      const initialMessage = {
        id: 1,
        type: "system",
        message: `Complaint #${complaint.complaintNumber} - ${complaint.title}`,
        timestamp: new Date().toISOString(),
      };
      setMessages([initialMessage]);
    }
  }, [isOpen, complaint]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !sessionActive) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = newMessage;
    setNewMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: "customer",
        message:
          "Thank you for your response. I understand the issue better now.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleEndSession = async () => {
    try {
      await complaintAPI.updateComplaintStatus(complaint._id, "resolved");

      const sessionTranscript = messages
        .map((msg) => `${msg.type}: ${msg.message}`)
        .join("\n");

      const sessionData = {
        complaintId: complaint._id,
        responderId: user._id,
        responderName: `${user.firstName} ${user.lastName}`,
        sessionTranscript,
        startTime: messages[0]?.timestamp,
        endTime: new Date().toISOString(),
        status: "completed",
      };

      await complaintAPI.saveSession(sessionData);

      setSessionActive(false);
      toast.success(
        "Session ended successfully. Complaint marked as resolved."
      );

      onSessionEnd(complaint._id, sessionData);
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Failed to end session. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen || !complaint) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <HiChatBubbleLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Customer Care Response</h3>
                    <p className="text-sm text-white/80">
                      Complaint #{complaint.complaintNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {sessionActive && (
                    <button
                      onClick={handleEndSession}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      End Session
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <HiXMark className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Session Status */}
            <div className="p-3 bg-gray-50 border-b">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    sessionActive ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {sessionActive ? "Session Active" : "Session Ended"}
                </span>
                <span className="text-xs text-gray-500">
                  Responding as: {user.firstName} {user.lastName}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.type === "user"
                        ? "bg-[var(--elra-primary)] text-white"
                        : message.type === "system"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 p-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    sessionActive ? "Type your response..." : "Session ended"
                  }
                  disabled={!sessionActive}
                  className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !sessionActive}
                  className="p-3 bg-[var(--elra-primary)] text-white rounded-xl hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <HiPaperAirplane className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomerCareResponseChat;
