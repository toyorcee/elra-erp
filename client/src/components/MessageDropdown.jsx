import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useMessages } from "../hooks/useMessages";
import { useMessageContext } from "../context/MessageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { formatMessageTime } from "../types/messageTypes";
import messageService from "../services/messageService";
import defaultAvatar from "../assets/defaulticon.jpg";

const MessageDropdown = ({ isOpen, onClose }) => {
  const overlayStyles = `
    .message-dropdown svg {
      max-width: 24px !important;
      max-height: 24px !important;
    }
    .message-dropdown .text-3xl {
      font-size: 1.5rem !important;
    }
  `;

  const { user } = useAuth();
  const { isConnected } = useSocket();
  const { selectedUser, closeMessageDropdown } = useMessageContext();

  // Check if user is from Customer Care department
  const isCustomerCareUser =
    user?.department?.name === "Customer Service" ||
    user?.department?.name === "Customer Care";

  const {
    conversations,
    messages,
    unreadCounts,
    onlineUsers,
    typingUsers,
    isLoading,
    loadConversations,
    loadChatHistory,
    sendNewMessage,
    markMessagesAsReadForUser,
    getTotalUnreadCount,
    getMessagesForUser,
    deleteMessageById,
    formatUserStatus,
    getUserDisplayName: getDisplayName,
    getUserInitials: getInitials,
  } = useMessages();

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [recentConversations, setRecentConversations] = useState([]);
  const [allRecentConversations, setAllRecentConversations] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const getDefaultAvatar = () => {
    return defaultAvatar;
  };

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) return getDefaultAvatar();
    if (avatarPath.startsWith("http")) return avatarPath;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");
    return `${baseUrl}${avatarPath}`;
  };

  const getAvatarDisplay = (user) => {
    if (user.avatar) {
      return (
        <img
          src={getImageUrl(user.avatar)}
          alt={`${user.firstName} ${user.lastName}`}
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            e.target.src = getDefaultAvatar();
          }}
        />
      );
    }
    return (
      <div className="w-full h-full bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-bold text-sm">
        {getInitials(user)}
      </div>
    );
  };

  // Handle selectedUser from context
  useEffect(() => {
    if (selectedUser && isOpen) {
      handleStartNewConversation(selectedUser);
    }
  }, [selectedUser, isOpen]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // File upload functions
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleDeleteMessage = (message) => {
    setMessageToDelete(message);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    setIsDeleting(true);
    try {
      // Use the deleteMessageById function from useMessages hook
      // This will handle both the API call and local state update
      await deleteMessageById(messageToDelete._id);
      setShowDeleteConfirm(false);
      setMessageToDelete(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteMessage = () => {
    setShowDeleteConfirm(false);
    setMessageToDelete(null);
  };

  // Send message
  const handleSendMessage = async () => {
    const content = messageText.trim();
    if ((!content && !selectedFile) || !selectedConversation) return;

    const messageContent =
      content || (selectedFile ? `📎 ${selectedFile.name}` : "");
    setMessageText("");
    setSelectedFile(null);
    setIsTyping(false);

    try {
      let documentId = null;

      // Upload file if selected
      if (selectedFile) {
        setIsUploadingFile(true);
        try {
          const uploadResponse = await messageService.uploadMessageFile(
            selectedFile
          );
          documentId = uploadResponse.data.documentId;
        } catch (error) {
          console.error("Error uploading file:", error);
          alert("Failed to upload file. Please try again.");
          setIsUploadingFile(false);
          return;
        }
        setIsUploadingFile(false);
      }

      await sendNewMessage(
        selectedConversation._id._id,
        messageContent,
        documentId
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle typing
  const handleTyping = useCallback(
    (recipientId) => {
      if (!isTyping) {
        setIsTyping(true);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    },
    [isTyping]
  );

  // Handle conversation selection
  const handleConversationSelect = useCallback(
    async (conversation) => {
      setSelectedConversation(conversation);
      setShowChat(true);
      await loadChatHistory(conversation._id._id);
      await markMessagesAsReadForUser(conversation._id._id);
    },
    [loadChatHistory, markMessagesAsReadForUser]
  );

  const handleStartNewConversation = useCallback(
    async (user) => {
      const existingConversation = conversations.find(
        (conv) => conv._id._id === user._id
      );

      if (existingConversation) {
        await handleConversationSelect(existingConversation);
      } else {
        const newConversation = {
          _id: user,
          lastMessage: null,
          unreadCount: 0,
        };

        setSelectedConversation(newConversation);
        setShowChat(true);
        setSearchTerm("");

        await loadChatHistory(user._id);

        await markMessagesAsReadForUser(user._id);
      }
    },
    [
      conversations,
      handleConversationSelect,
      loadChatHistory,
      markMessagesAsReadForUser,
    ]
  );

  const filteredConversations = conversations.filter(
    (conv) =>
      getDisplayName(conv._id)
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      conv._id.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage?.content
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const getConversationSuggestions = () => {
    if (!messageText.trim()) return [];

    const searchTerm = messageText.toLowerCase();
    return conversations
      .filter((conv) => {
        const displayName = getDisplayName(conv._id)?.toLowerCase() || "";
        const email = conv._id.email?.toLowerCase() || "";
        return displayName.includes(searchTerm) || email.includes(searchTerm);
      })
      .slice(0, 5);
  };

  const conversationSuggestions = getConversationSuggestions();

  const getAvailableUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const response = await messageService.getAvailableUsers(searchTerm);
      if (response.success) {
        setAvailableUsers(response.data || []);
        const recentConvs = response.recentConversations || [];
        setAllRecentConversations(recentConvs);
        setRecentConversations(recentConvs.slice(0, 5));
        setUserRole(response.userRole || null);
      } else {
        console.error("❌ Failed to get available users:", response);
        setAvailableUsers([]);
        setRecentConversations([]);
        setAllRecentConversations([]);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error fetching available users:", error);
      setAvailableUsers([]);
      setRecentConversations([]);
      setUserRole(null);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [searchTerm]);

  const getFilteredAvailableUsers = () => {
    if (!searchTerm.trim()) {
      const result = availableUsers.slice(0, 10);
      return result;
    }

    const result = availableUsers
      .filter((user) => {
        const displayName = getDisplayName(user)?.toLowerCase() || "";
        const email = user.email?.toLowerCase() || "";
        return (
          displayName.includes(searchTerm.toLowerCase()) ||
          email.includes(searchTerm.toLowerCase())
        );
      })
      .slice(0, 10);
    return result;
  };

  // Get role-based access information
  const getRoleBasedInfo = () => {
    if (!userRole)
      return { title: "Loading...", description: "Please wait..." };

    const roleLevel = userRole.level;

    if (roleLevel >= 1000) {
      return {
        title: "Chat with Everyone",
        description:
          "As a Super Admin, you can chat with anyone in the organization.",
        icon: "👑",
      };
    } else if (roleLevel >= 700) {
      return {
        title: "Department & HOD Access",
        description:
          "You can chat with anyone in your department and fellow HODs.",
        icon: "👔",
      };
    } else if (roleLevel >= 600) {
      return {
        title: "Manager Access",
        description:
          "You can chat with HODs and higher roles in your department.",
        icon: "📋",
      };
    } else if (roleLevel >= 300) {
      return {
        title: "Staff Access",
        description:
          "You can chat with HODs and higher roles in your department.",
        icon: "👤",
      };
    } else {
      return {
        title: "Viewer Access",
        description:
          "You can chat with HODs and higher roles in your department.",
        icon: "👁️",
      };
    }
  };

  const roleInfo = getRoleBasedInfo();

  // Toggle showing all recent conversations
  const toggleShowAllRecent = () => {
    setShowAllRecent(!showAllRecent);
    if (!showAllRecent) {
      setRecentConversations(allRecentConversations);
    } else {
      setRecentConversations(allRecentConversations.slice(0, 5));
    }
  };

  // Load conversations and available users on mount
  useEffect(() => {
    if (isOpen) {
      loadConversations();
      getAvailableUsers();
    }
  }, [isOpen, loadConversations, getAvailableUsers]);

  // Refresh available users whenever search term changes (policy-aware)
  useEffect(() => {
    if (!isOpen) return;
    getAvailableUsers();
  }, [isOpen, searchTerm, getAvailableUsers]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversation]);

  // Handle close
  const handleClose = () => {
    closeMessageDropdown();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{overlayStyles}</style>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed inset-0 z-50 flex items-start justify-end pt-16"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Message Panel */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="relative w-full sm:max-w-md h-[calc(100vh-4rem)] sm:h-[calc(100vh-4rem)] bg-white rounded-l-2xl sm:rounded-l-2xl shadow-2xl border border-[var(--elra-border-primary)] overflow-hidden message-dropdown"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--elra-border-primary)] bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--elra-primary)] text-white cursor-pointer">
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--elra-text-primary)]">
                    Messages
                  </h3>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-xs text-[var(--elra-text-secondary)]">
                      {isConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-[var(--elra-text-muted)] hover:text-[var(--elra-text-primary)] transition-colors cursor-pointer"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {!showChat ? (
              /* Conversations List */
              <div className="flex flex-col h-full">
                {/* Search */}
                <div className="p-4 border-b border-[var(--elra-border-primary)]">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--elra-text-muted)]" />
                    <input
                      type="text"
                      placeholder={
                        userRole?.level >= 1000
                          ? "Search anyone in the organization..."
                          : userRole?.level >= 700
                          ? "Search department users or fellow HODs..."
                          : "Search peers and higher roles in your department..."
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)] text-sm bg-white"
                    />
                    {searchTerm && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <button
                          onClick={() => setSearchTerm("")}
                          className="text-[var(--elra-text-muted)] hover:text-[var(--elra-text-primary)] transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {searchTerm && (
                    <p className="text-xs text-[var(--elra-text-secondary)] mt-2">
                      Searching for users matching "{searchTerm}"...
                    </p>
                  )}
                </div>

                {/* Conversations / Available Users */}
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
                    </div>
                  ) : searchTerm || availableUsers.length > 0 ? (
                    <div className="space-y-1">
                      {getFilteredAvailableUsers().map((user) => (
                        <div
                          key={user._id}
                          onClick={() => handleStartNewConversation(user)}
                          className="flex items-center gap-3 p-3 hover:bg-[var(--elra-secondary-3)] cursor-pointer transition-colors border-b border-[var(--elra-border-primary)]"
                        >
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                              {getAvatarDisplay(user)}
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white ${(() => {
                                const id = user._id;
                                if (Array.isArray(onlineUsers))
                                  return onlineUsers.includes(id)
                                    ? "bg-green-500"
                                    : "bg-gray-400";
                                if (onlineUsers instanceof Set)
                                  return onlineUsers.has(id)
                                    ? "bg-green-500"
                                    : "bg-gray-400";
                                if (
                                  onlineUsers &&
                                  typeof onlineUsers === "object"
                                )
                                  return onlineUsers[id]
                                    ? "bg-green-500"
                                    : "bg-gray-400";
                                return "bg-gray-400";
                              })()}`}
                            ></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-medium text-[var(--elra-text-primary)] text-sm truncate"
                              title={getDisplayName(user)}
                            >
                              {getDisplayName(user)}
                            </h4>
                            <p className="text-xs text-[var(--elra-text-secondary)] truncate">
                              {user.email}
                            </p>
                          </div>
                          <div
                            className="text-[10px] text-[var(--elra-text-muted)]"
                            title={formatUserStatus(user)}
                          >
                            {formatUserStatus(user)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations.length > 0 ? (
                    <div className="space-y-1">
                      {/* Start New Conversation Button */}
                      <div className="p-3 border-b border-[var(--elra-border-primary)]">
                        <button
                          onClick={() => setSearchTerm("")}
                          className="w-full flex items-center justify-center gap-2 p-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors font-medium text-sm"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          Start New Conversation
                        </button>
                      </div>

                      {/* Customer Care Option - Only show for non-Customer Care users */}
                      {!isCustomerCareUser && (
                        <div className="p-3 border-b border-[var(--elra-border-primary)]">
                          <button
                            onClick={() => {
                              // Open Customer Care chat
                              window.open(
                                "/dashboard/modules/customer-care/submit-complaint",
                                "_blank"
                              );
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors font-medium text-sm"
                          >
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            Contact Customer Care
                          </button>
                        </div>
                      )}

                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation._id._id}
                          onClick={() => handleConversationSelect(conversation)}
                          className="flex items-center gap-3 p-4 hover:bg-[var(--elra-secondary-3)] cursor-pointer transition-colors border-b border-[var(--elra-border-primary)]"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                              {getAvatarDisplay(conversation._id)}
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${(() => {
                                const id = conversation._id._id;
                                if (Array.isArray(onlineUsers))
                                  return onlineUsers.includes(id)
                                    ? "bg-green-500"
                                    : "bg-gray-400";
                                if (onlineUsers instanceof Set)
                                  return onlineUsers.has(id)
                                    ? "bg-green-500"
                                    : "bg-gray-400";
                                if (
                                  onlineUsers &&
                                  typeof onlineUsers === "object"
                                )
                                  return onlineUsers[id]
                                    ? "bg-green-500"
                                    : "bg-gray-400";
                                return "bg-gray-400";
                              })()}`}
                            ></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4
                                className="font-medium text-[var(--elra-text-primary)] text-sm truncate"
                                title={getDisplayName(conversation._id)}
                              >
                                {getDisplayName(conversation._id)}
                              </h4>
                              {unreadCounts[conversation._id._id] > 0 && (
                                <span className="bg-[var(--elra-primary)] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                  {unreadCounts[conversation._id._id]}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-[var(--elra-text-secondary)] truncate">
                                {conversation.lastMessage?.content ||
                                  "No messages yet"}
                              </p>
                              <span
                                className="text-[10px] text-[var(--elra-text-muted)] hidden sm:inline"
                                title={formatUserStatus(conversation._id)}
                              >
                                {formatUserStatus(conversation._id)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <div className="w-16 h-16 bg-[var(--elra-secondary-3)] rounded-full flex items-center justify-center mb-4">
                        <ChatBubbleLeftRightIcon className="h-8 w-8 text-[var(--elra-text-muted)]" />
                      </div>
                      <h3 className="text-lg font-medium text-[var(--elra-text-primary)] mb-2">
                        No conversations found
                      </h3>
                      <p className="text-[var(--elra-text-secondary)] mb-6">
                        Start a new conversation with someone:
                      </p>

                      {/* Role-based Access Info */}
                      {userRole && (
                        <div className="w-full mb-6 p-4 bg-[var(--elra-primary)] rounded-lg text-white shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{roleInfo.icon}</span>
                            <h4 className="font-semibold text-sm">
                              {roleInfo.title}
                            </h4>
                          </div>
                          <p className="text-xs opacity-90">
                            {roleInfo.description}
                          </p>
                        </div>
                      )}

                      {/* Recent Conversations for ALL users (like WhatsApp) */}
                      {recentConversations.length > 0 && (
                        <div className="w-full mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium text-[var(--elra-text-primary)]">
                              Recent Conversations:
                            </div>
                            {allRecentConversations.length > 5 && (
                              <button
                                onClick={toggleShowAllRecent}
                                className="text-xs text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium transition-colors"
                              >
                                {showAllRecent
                                  ? "Show Less"
                                  : `Show All (${allRecentConversations.length})`}
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {recentConversations.map((user) => (
                              <div
                                key={user._id}
                                onClick={() => handleStartNewConversation(user)}
                                className="flex items-center gap-3 p-3 bg-[var(--elra-secondary-3)] rounded-lg cursor-pointer transition-colors border border-[var(--elra-border-primary)] hover:border-[var(--elra-primary)] hover:shadow-sm"
                              >
                                <div className="relative">
                                  <div className="w-8 h-8 rounded-full overflow-hidden">
                                    {getAvatarDisplay(user)}
                                  </div>
                                  <div
                                    className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white ${(() => {
                                      const id = user._id;
                                      if (Array.isArray(onlineUsers))
                                        return onlineUsers.includes(id)
                                          ? "bg-green-500"
                                          : "bg-gray-400";
                                      if (onlineUsers instanceof Set)
                                        return onlineUsers.has(id)
                                          ? "bg-green-500"
                                          : "bg-gray-400";
                                      if (
                                        onlineUsers &&
                                        typeof onlineUsers === "object"
                                      )
                                        return onlineUsers[id]
                                          ? "bg-green-500"
                                          : "bg-gray-400";
                                      return "bg-gray-400";
                                    })()}`}
                                  ></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-[var(--elra-text-primary)] text-sm truncate">
                                    {getDisplayName(user)}
                                  </h4>
                                  <p className="text-xs text-[var(--elra-text-secondary)] truncate">
                                    {user.email}
                                  </p>
                                  <p className="text-xs text-[var(--elra-text-muted)] truncate">
                                    {user.department?.name} {user.role?.name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-[var(--elra-primary)]" />
                                  <span className="text-xs text-[var(--elra-primary)] font-medium">
                                    Continue
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Customer Care Option for Empty State */}
                      {!isCustomerCareUser && (
                        <div className="w-full mb-6">
                          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                                <ExclamationTriangleIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  Need Help?
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Contact Customer Care for support
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                window.open(
                                  "/dashboard/modules/customer-care/submit-complaint",
                                  "_blank"
                                );
                              }}
                              className="w-full flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors font-medium text-sm"
                            >
                              <TicketIcon className="h-4 w-4" />
                              Submit Complaint
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Available Users */}
                      <div className="w-full space-y-2">
                        {isLoadingUsers ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--elra-primary)]"></div>
                          </div>
                        ) : getFilteredAvailableUsers().length > 0 ? (
                          <>
                            <div className="text-sm font-medium text-[var(--elra-text-primary)] mb-3 text-left">
                              Available Users:
                            </div>
                            {getFilteredAvailableUsers().map((user) => (
                              <div
                                key={user._id}
                                onClick={() => handleStartNewConversation(user)}
                                className="flex items-center gap-3 p-3 bg-[var(--elra-secondary-3)] rounded-lg cursor-pointer transition-colors border border-[var(--elra-border-primary)] hover:border-[var(--elra-primary)] hover:shadow-sm"
                              >
                                <div className="relative">
                                  <div className="w-8 h-8 rounded-full overflow-hidden">
                                    {getAvatarDisplay(user)}
                                  </div>
                                  <div
                                    className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white ${(() => {
                                      const id = user._id;
                                      if (Array.isArray(onlineUsers))
                                        return onlineUsers.includes(id)
                                          ? "bg-green-500"
                                          : "bg-gray-400";
                                      if (onlineUsers instanceof Set)
                                        return onlineUsers.has(id)
                                          ? "bg-green-500"
                                          : "bg-gray-400";
                                      if (
                                        onlineUsers &&
                                        typeof onlineUsers === "object"
                                      )
                                        return onlineUsers[id]
                                          ? "bg-green-500"
                                          : "bg-gray-400";
                                      return "bg-gray-400";
                                    })()}`}
                                  ></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-[var(--elra-text-primary)] text-sm truncate">
                                    {getDisplayName(user)}
                                  </h4>
                                  <p className="text-xs text-[var(--elra-text-secondary)] truncate">
                                    {user.email}
                                  </p>
                                  <p className="text-xs text-[var(--elra-text-muted)] truncate">
                                    {user.department?.name} {user.role?.name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-[var(--elra-primary)]" />
                                  <span className="text-xs text-[var(--elra-primary)] font-medium">
                                    Message
                                  </span>
                                </div>
                              </div>
                            ))}
                            <div className="mt-6 p-3 bg-[var(--elra-primary)] rounded-lg">
                              <p className="text-xs text-white">
                                💡 <strong>Tip:</strong> Click on any user above
                                to start a conversation, or use the search bar
                                to find specific users.
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm text-[var(--elra-text-secondary)] mb-4">
                              No users available to chat with
                            </p>
                            <div className="p-3 bg-[var(--elra-secondary-3)] rounded-lg">
                              <p className="text-xs text-[var(--elra-text-secondary)]">
                                Try searching for users in the search bar above,
                                or check back later when more users are
                                available.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Chat Interface */
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--elra-border-primary)] bg-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowChat(false)}
                      className="p-1 text-[var(--elra-text-muted)] hover:text-[var(--elra-text-primary)] transition-colors cursor-pointer"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        {getAvatarDisplay(selectedConversation._id)}
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${(() => {
                          const id = selectedConversation._id._id;
                          if (Array.isArray(onlineUsers))
                            return onlineUsers.includes(id)
                              ? "bg-green-500"
                              : "bg-gray-400";
                          if (onlineUsers instanceof Set)
                            return onlineUsers.has(id)
                              ? "bg-green-500"
                              : "bg-gray-400";
                          if (onlineUsers && typeof onlineUsers === "object")
                            return onlineUsers[id]
                              ? "bg-green-500"
                              : "bg-gray-400";
                          return "bg-gray-400";
                        })()}`}
                      ></div>
                    </div>
                    <div>
                      <h4
                        className="font-medium text-[var(--elra-text-primary)] text-sm"
                        title={getDisplayName(selectedConversation._id)}
                      >
                        {getDisplayName(selectedConversation._id)}
                      </h4>
                      <p
                        className="text-xs text-[var(--elra-text-secondary)]"
                        title={formatUserStatus(selectedConversation._id)}
                      >
                        {formatUserStatus(selectedConversation._id)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-[var(--elra-bg-light)]">
                  {getMessagesForUser(selectedConversation._id._id).length >
                  0 ? (
                    <div className="space-y-4">
                      {getMessagesForUser(selectedConversation._id._id).map(
                        (message) => {
                          const isOwnMessage =
                            message.sender._id === (user._id || user.id);

                          return (
                            <div
                              key={message._id}
                              className={`flex ${
                                isOwnMessage ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  isOwnMessage
                                    ? "bg-[var(--elra-primary)] text-white"
                                    : "bg-white text-[var(--elra-text-primary)] border border-[var(--elra-border-primary)]"
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                {message.document && (
                                  <div className="mt-2 p-2 bg-white bg-opacity-20 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                      <PaperClipIcon className="h-4 w-4" />
                                      <span className="text-sm font-medium">
                                        {message.document.originalFileName ||
                                          message.document.title}
                                      </span>
                                      <button
                                        onClick={() =>
                                          window.open(
                                            `/api/documents/${message.document._id}/view`,
                                            "_blank"
                                          )
                                        }
                                        className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded hover:bg-opacity-50"
                                      >
                                        View
                                      </button>
                                    </div>
                                  </div>
                                )}
                                <div
                                  className={`flex items-center justify-between mt-1 text-xs ${
                                    isOwnMessage
                                      ? "text-[var(--elra-secondary-3)]"
                                      : "text-[var(--elra-text-secondary)]"
                                  }`}
                                >
                                  <span>
                                    {formatMessageTime(message.createdAt)}
                                  </span>
                                  {isOwnMessage && (
                                    <div className="flex items-center gap-1">
                                      {message.status === "sent" && (
                                        <CheckIcon className="h-3 w-3" />
                                      )}
                                      {message.status === "delivered" && (
                                        <div className="flex">
                                          <CheckIcon className="h-3 w-3" />
                                          <CheckIcon className="h-3 w-3 -ml-1" />
                                        </div>
                                      )}
                                      {message.status === "read" && (
                                        <div className="flex">
                                          <CheckIcon className="h-3 w-3 text-blue-500" />
                                          <CheckIcon className="h-3 w-3 text-blue-500 -ml-1" />
                                        </div>
                                      )}
                                      <button
                                        onClick={() =>
                                          handleDeleteMessage(message)
                                        }
                                        className="ml-2 p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                                        title="Delete message"
                                      >
                                        <TrashIcon className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-[var(--elra-secondary-3)] rounded-full flex items-center justify-center mb-4">
                        <ChatBubbleLeftRightIcon className="h-8 w-8 text-[var(--elra-text-muted)]" />
                      </div>
                      <h3 className="text-lg font-medium text-[var(--elra-text-primary)] mb-2">
                        Start the conversation!
                      </h3>
                      <p className="text-[var(--elra-text-secondary)]">
                        Send your first message to{" "}
                        {getDisplayName(selectedConversation._id)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-[var(--elra-border-primary)] bg-white">
                  {/* Selected File Preview */}
                  {selectedFile && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <PaperClipIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {selectedFile.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {/* File Upload Button */}
                    <label className="flex items-center justify-center p-2 border border-[var(--elra-border-primary)] rounded-lg hover:bg-gray-50 cursor-pointer">
                      <PaperClipIcon className="h-4 w-4 text-gray-500" />
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                      />
                    </label>

                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        handleTyping(selectedConversation._id._id);
                        setShowSuggestions(e.target.value.trim().length > 0);
                      }}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder={`Type your message to ${getDisplayName(
                        selectedConversation._id
                      )}...`}
                      className="flex-1 px-3 py-2 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)] text-sm bg-white"
                      autoFocus
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={
                        (!messageText.trim() && !selectedFile) ||
                        isUploadingFile
                      }
                      className="p-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isUploadingFile ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4" />
                          <span className="text-xs font-medium">Send</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Conversation Suggestions */}
                  {showSuggestions && conversationSuggestions.length > 0 && (
                    <div className="mt-2 p-2 bg-[var(--elra-secondary-3)] rounded-lg">
                      <p className="text-xs text-[var(--elra-text-secondary)] mb-2">
                        Quick reply suggestions:
                      </p>
                      <div className="space-y-1">
                        {conversationSuggestions.map((suggestion) => (
                          <button
                            key={suggestion._id._id}
                            onClick={() => {
                              setMessageText(suggestion.lastMessage.content);
                              setShowSuggestions(false);
                            }}
                            className="block w-full text-left text-xs text-[var(--elra-text-secondary)] hover:text-[var(--elra-text-primary)] p-1 rounded hover:bg-[var(--elra-secondary-2)] hover:bg-opacity-20"
                          >
                            {getDisplayName(suggestion._id)}:{" "}
                            {suggestion.lastMessage.content}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Delete Message Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Delete Message
                </h3>
                <p className="text-sm text-gray-600 text-center mb-6">
                  Are you sure you want to delete this message? This action
                  cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={cancelDeleteMessage}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteMessage}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isDeleting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      "Delete"
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

export default MessageDropdown;
