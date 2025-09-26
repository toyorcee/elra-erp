import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiChatBubbleLeftRight,
  HiXMark,
  HiPaperAirplane,
  HiTicket,
  HiExclamationTriangle,
  HiClock,
  HiCheckCircle,
} from "react-icons/hi2";
import { complaintAPI } from "../services/customerCareAPI";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const CustomerCareChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      message:
        "Hi! I'm here to help with your concerns. How can I assist you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  useEffect(() => {
    const prefetchedComplaintId = sessionStorage.getItem(
      "prefetchedComplaintId"
    );
    console.log(
      "🔍 Checking for prefetched complaint ID:",
      prefetchedComplaintId
    );

    if (prefetchedComplaintId) {
      console.log("✅ Found prefetched complaint ID, fetching details...");
      fetchComplaintDetails(prefetchedComplaintId);
      sessionStorage.removeItem("prefetchedComplaintId");
    }
  }, []);

  const fetchComplaintDetails = async (complaintId) => {
    try {
      console.log("🔄 Fetching complaint details for ID:", complaintId);
      const response = await complaintAPI.getComplaintById(complaintId);
      console.log("📡 API Response:", response);

      if (response.success) {
        const complaint = response.data;
        console.log("📋 Complaint data:", complaint);

        const prefetchedMessage = {
          id: Date.now(),
          type: "bot",
          message: `I see you want to continue discussing your complaint "${complaint.title}" (${complaint.complaintNumber}). Current status: ${complaint.status}. How can I help you with this issue?`,
          timestamp: new Date().toISOString(),
        };

        console.log("💬 Adding prefetched message:", prefetchedMessage);
        setMessages((prev) => [...prev, prefetchedMessage]);
      } else {
        console.error("❌ API response not successful:", response);
      }
    } catch (error) {
      console.error("❌ Error fetching complaint details:", error);
      const fallbackMessage = {
        id: Date.now(),
        type: "bot",
        message:
          "I see you want to continue discussing a complaint. How can I help you with this issue?",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

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

    const complaintKeywords = [
      "complaint",
      "issue",
      "problem",
      "concern",
      "help",
      "support",
    ];
    const isComplaint = complaintKeywords.some((keyword) =>
      messageText.toLowerCase().includes(keyword)
    );

    if (isComplaint) {
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "I understand you have a concern. Would you like me to help you submit a formal complaint? This will ensure it gets tracked and resolved properly.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    } else {
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "Thank you for your message. I'm here to help! If you have a specific concern or complaint, please let me know and I can help you submit it formally.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSubmitComplaint = async (
    title,
    description,
    category = "other",
    priority = "medium"
  ) => {
    try {
      setIsSubmittingComplaint(true);

      const complaintData = {
        title,
        description,
        category,
        priority,
      };

      const response = await complaintAPI.createComplaint(complaintData);

      if (response.success) {
        toast.success("Complaint submitted successfully!");

        // Add success message to chat
        const successMessage = {
          id: Date.now(),
          type: "bot",
          message: `Great! I've submitted your complaint "${title}". You'll receive a confirmation email shortly with your complaint number: ${
            response.data.complaintNumber || "CC-XXXXXX"
          }.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, successMessage]);
      } else {
        toast.error("Failed to submit complaint. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const quickActions = [
    {
      icon: HiTicket,
      label: "Submit Complaint",
      action: () => {
        setNewMessage("I would like to submit a complaint about...");
      },
    },
    {
      icon: HiExclamationTriangle,
      label: "Report Issue",
      action: () => {
        setNewMessage("I need to report an issue with...");
      },
    },
    {
      icon: HiClock,
      label: "Check Status",
      action: () => {
        setNewMessage(
          "Can you help me check the status of my previous complaint?"
        );
      },
    },
    {
      icon: HiCheckCircle,
      label: "Quick Submit",
      action: () => {
        // Quick complaint submission
        const title = "Quick Complaint from Chat";
        const description = "Complaint submitted via Customer Care chat";
        handleSubmitComplaint(title, description, "other", "medium");
      },
    },
  ];

  // Check if user is from Customer Care department
  const isCustomerCareUser =
    user?.department?.name === "Customer Service" ||
    user?.department?.name === "Customer Care";

  if (isCustomerCareUser) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        data-chat-button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <HiChatBubbleLeftRight className="w-6 h-6" />
      </motion.button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-end p-4"
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-full">
                      <HiChatBubbleLeftRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Customer Care</h3>
                      <p className="text-sm text-white/80">
                        We're here to help
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <HiXMark className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      <action.icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </button>
                  ))}
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
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSubmittingComplaint}
                    className="p-3 bg-[var(--elra-primary)] text-white rounded-xl hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingComplaint ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <HiPaperAirplane className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CustomerCareChat;
