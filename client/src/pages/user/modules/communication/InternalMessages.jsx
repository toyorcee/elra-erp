import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../../context/AuthContext";
import { useSocket } from "../../../../context/SocketContext";
import { useMessages } from "../../../../hooks/useMessages";
import { useMessageContext } from "../../../../context/MessageContext";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  UserPlusIcon,
  CheckIcon,
  CheckCircleIcon,
  PaperClipIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { formatMessageTime } from "../../../../types/messageTypes";
import messageService from "../../../../services/messageService";
import defaultAvatar from "../../../../assets/defaulticon.jpg";
import Skeleton from "../../../../components/common/Skeleton";
import Profile from "../../Profile";

const InternalMessages = () => {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const { selectedUser, closeMessageDropdown } = useMessageContext();

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
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Communication module sidebar configuration
  const communicationSidebarConfig = {
    label: "Communication",
    icon: "ChatBubbleLeftRightIcon",
    path: "/dashboard/modules/communication",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    sections: [
      {
        title: "Messaging & Collaboration",
        items: [
          {
            label: "Internal Messages",
            icon: "ChatBubbleLeftIcon",
            path: "/dashboard/modules/communication/messages",
            required: { minLevel: 300 },
            description: "Send and receive internal messages",
          },
          {
            label: "Team Chats",
            icon: "UsersIcon",
            path: "/dashboard/modules/communication/teams",
            required: { minLevel: 300 },
            description: "Collaborate in team chat rooms",
          },
          {
            label: "File Sharing",
            icon: "DocumentIcon",
            path: "/dashboard/modules/communication/files",
            required: { minLevel: 300 },
            description: "Share files and documents",
          },
        ],
      },
      {
        title: "Announcements",
        items: [
          {
            label: "Announcements",
            icon: "MegaphoneIcon",
            path: "/dashboard/modules/communication/announcements",
            required: { minLevel: 600 },
            description: "Create and manage announcements",
          },
        ],
      },
    ],
  };

  // Image utility functions
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
    if (selectedUser) {
      handleStartNewConversation(selectedUser);
    }
  }, [selectedUser]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Send message
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

  const handleShowProfile = async () => {
    try {
      setIsLoadingProfile(true);
      setShowProfileView(true);

      if (selectedConversation && selectedConversation._id) {
        const otherUser = selectedConversation._id;

        setProfileUser(otherUser);
      }

      setTimeout(() => {
        setIsLoadingProfile(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading profile:", error);
      setIsLoadingProfile(false);
    }
  };

  const handleBackToMessages = () => {
    setShowProfileView(false);
    setProfileUser(null);
    setIsLoadingProfile(false);
  };

  const cancelDeleteMessage = () => {
    setShowDeleteConfirm(false);
    setMessageToDelete(null);
  };

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

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    setIsTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartNewConversation = async (user) => {
    try {
      setSelectedConversation({ _id: user });
      setShowProfileView(false);
      setProfileUser(null);
      setIsLoadingProfile(false);
      await loadChatHistory(user._id);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const getAvailableUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await messageService.getAvailableUsers(searchTerm);
      setAvailableUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load conversations and available users on mount
  useEffect(() => {
    loadConversations();
    getAvailableUsers();
  }, [loadConversations]);

  // Refresh available users as search changes, to mirror dropdown behavior
  useEffect(() => {
    getAvailableUsers();
  }, [searchTerm]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversation]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) =>
    getDisplayName(conv._id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get conversation suggestions for quick replies
  const conversationSuggestions = conversations
    .filter((conv) => conv.lastMessage && conv.lastMessage.content)
    .slice(0, 3);

  // Access control
  if (!user || user.role.level < 300) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-800 mb-2">
              Access Denied
            </h1>
            <p className="text-red-600">
              You need Staff level (300) or higher to access internal messages.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex"
    >
      {/* Left Sidebar - 30% - Fixed */}
      <div className="w-1/3 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 shadow-xl flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-pink-50 via-purple-50 to-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Messages
            </h2>
            <button
              onClick={getAvailableUsers}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm"
              title="Refresh conversations"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={
                user?.role?.level >= 1000
                  ? "Search anyone in the organization..."
                  : user?.role?.level >= 700
                  ? "Search department users or fellow HODs..."
                  : "Search peers and higher roles in your department..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md focus:shadow-lg"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations / Available Users List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {/* Conversation Loading Skeletons */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <Skeleton width="w-12" height="h-12" rounded="rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="w-24" height="h-4" />
                    <Skeleton width="w-32" height="h-3" />
                  </div>
                  <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="space-y-1 p-2">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">
                  Available Users ({availableUsers.length})
                </h3>
              </div>
              {availableUsers.length > 0 ? (
                availableUsers.map((user) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="p-4 rounded-xl cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:shadow-md border border-transparent hover:border-pink-200/50"
                    onClick={async () => {
                      try {
                        await handleStartNewConversation(user);
                      } catch (e) {
                        console.error("Failed to start conversation:", e);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {getAvatarDisplay(user)}
                        </div>
                        {(() => {
                          const id = user._id;
                          let isOnline = false;
                          if (Array.isArray(onlineUsers)) {
                            isOnline = onlineUsers.includes(id);
                          } else if (onlineUsers instanceof Set) {
                            isOnline = onlineUsers.has(id);
                          } else if (
                            onlineUsers &&
                            typeof onlineUsers === "object"
                          ) {
                            isOnline = Boolean(onlineUsers[id]);
                          }
                          return isOnline;
                        })() && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className="text-sm font-medium text-gray-900 truncate"
                            title={getDisplayName(user)}
                          >
                            {getDisplayName(user)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                          <span
                            className="text-[10px] text-gray-400 hidden sm:inline"
                            title={formatUserStatus(user)}
                          >
                            {formatUserStatus(user)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">
                    No users found matching your search.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">
                  Recent Conversations ({filteredConversations.length})
                </h3>
              </div>
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation._id._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedConversation?._id._id === conversation._id._id
                      ? "bg-gradient-to-r from-pink-100 to-purple-100 border border-pink-300 shadow-lg"
                      : "hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:shadow-md border border-transparent hover:border-pink-200/50"
                  }`}
                  onClick={async () => {
                    setSelectedConversation(conversation);
                    setShowProfileView(false);
                    setProfileUser(null);
                    setIsLoadingProfile(false);
                    setIsLoadingMessages(true);
                    try {
                      await loadChatHistory(conversation._id._id);
                    } finally {
                      setIsLoadingMessages(false);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        {getAvatarDisplay(conversation._id)}
                      </div>
                      {(() => {
                        const id = conversation._id._id;
                        let isOnline = false;
                        if (Array.isArray(onlineUsers)) {
                          isOnline = onlineUsers.includes(id);
                        } else if (onlineUsers instanceof Set) {
                          isOnline = onlineUsers.has(id);
                        } else if (
                          onlineUsers &&
                          typeof onlineUsers === "object"
                        ) {
                          isOnline = Boolean(onlineUsers[id]);
                        }
                        return isOnline;
                      })() && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className="text-sm font-medium text-gray-900 truncate"
                          title={getDisplayName(conversation._id)}
                        >
                          {getDisplayName(conversation._id)}
                        </p>
                        {unreadCounts[conversation._id._id] > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center shadow-lg animate-pulse"
                          >
                            {unreadCounts[conversation._id._id]}
                          </motion.span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.lastMessage?.content ||
                            "No messages yet"}
                        </p>
                        <span
                          className="text-[10px] text-gray-400 hidden sm:inline"
                          title={formatUserStatus(conversation._id)}
                        >
                          {formatUserStatus(conversation._id)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredConversations.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No conversations yet.</p>
                  <p className="text-xs mt-1">
                    Search for users to start a conversation.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Content - 70% */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-white via-pink-50/30 to-white shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative w-10 h-10">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {getAvatarDisplay(selectedConversation._id)}
                    </div>
                    {(() => {
                      const id = selectedConversation._id._id;
                      let isOnline = false;
                      if (Array.isArray(onlineUsers)) {
                        isOnline = onlineUsers.includes(id);
                      } else if (onlineUsers instanceof Set) {
                        isOnline = onlineUsers.has(id);
                      } else if (
                        onlineUsers &&
                        typeof onlineUsers === "object"
                      ) {
                        isOnline = Boolean(onlineUsers[id]);
                      }
                      return isOnline;
                    })() && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold text-gray-900"
                      title={getDisplayName(selectedConversation._id)}
                    >
                      {getDisplayName(selectedConversation._id)}
                    </h3>
                    <p
                      className="text-sm text-gray-500"
                      title={formatUserStatus(selectedConversation._id)}
                    >
                      {formatUserStatus(selectedConversation._id)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleShowProfile}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer shadow-sm"
                    title="View Profile"
                  >
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area or Profile View */}
            {showProfileView ? (
              <div className="flex-1 flex flex-col">
                {isLoadingProfile ? (
                  <div className="p-8 space-y-4">
                    {/* Profile Loading Skeleton */}
                    <div className="flex items-center space-x-4 mb-6">
                      <Skeleton
                        width="w-16"
                        height="h-16"
                        rounded="rounded-full"
                      />
                      <div className="space-y-2">
                        <Skeleton width="w-32" height="h-4" />
                        <Skeleton width="w-24" height="h-3" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Skeleton width="w-full" height="h-4" />
                      <Skeleton width="w-3/4" height="h-4" />
                      <Skeleton width="w-1/2" height="h-4" />
                    </div>
                    <div className="space-y-4 mt-8">
                      <Skeleton width="w-full" height="h-20" />
                      <Skeleton width="w-full" height="h-20" />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-pink-50/50 via-purple-50/30 to-white flex-shrink-0 shadow-sm">
                      <button
                        onClick={handleBackToMessages}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-300 hover:scale-105"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        <span>Back to Messages</span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50/30 to-white">
                      <Profile user={profileUser} isViewingOtherUser={true} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
                {isLoadingMessages ? (
                  <div className="space-y-4">
                    {/* Message Loading Skeletons */}
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex ${
                          i % 2 === 0 ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex space-x-2 max-w-xs lg:max-w-md ${
                            i % 2 === 0
                              ? "flex-row-reverse space-x-reverse"
                              : ""
                          }`}
                        >
                          <Skeleton
                            width="w-8"
                            height="h-8"
                            rounded="rounded-full"
                          />
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              i % 2 === 0 ? "bg-pink-200" : "bg-gray-200"
                            }`}
                          >
                            <Skeleton width="w-32" height="h-4" />
                            <Skeleton
                              width="w-16"
                              height="h-3"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  getMessagesForUser(selectedConversation._id._id).map(
                    (message) => {
                      const isOwnMessage =
                        message.sender._id === (user._id || user.id);

                      return (
                        <motion.div
                          key={message._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`flex space-x-2 max-w-xs lg:max-w-md ${
                              isOwnMessage
                                ? "flex-row-reverse space-x-reverse"
                                : ""
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                              {getAvatarDisplay(message.sender)}
                            </div>
                            <div
                              className={`px-6 py-3 rounded-2xl shadow-sm ${
                                isOwnMessage
                                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                                  : "bg-white text-gray-900 border border-gray-200/50 shadow-md"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              {message.document && (
                                <div className="mt-3 p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
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
                                      className="text-xs bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg hover:bg-white/50 transition-all duration-200 hover:scale-105 shadow-sm"
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
                                    : "text-gray-500"
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
                        </motion.div>
                      );
                    }
                  )
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Message Input */}
            {!showProfileView && (
              <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-white via-pink-50/30 to-white backdrop-blur-sm shadow-lg">
                {/* Selected File Preview */}
                {selectedFile && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200/50 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-2">
                      <PaperClipIcon className="h-5 w-5 text-gray-500" />
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

                <div className="flex space-x-2">
                  {/* File Upload Button */}
                  <label className="flex items-center justify-center px-4 py-3 border border-gray-200/50 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 cursor-pointer transition-all duration-300 hover:scale-105 shadow-sm">
                    <PaperClipIcon className="h-5 w-5 text-gray-500" />
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                    />
                  </label>

                  <div className="flex-1 relative">
                    <textarea
                      value={messageText}
                      onChange={handleTyping}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md focus:shadow-lg"
                      rows="1"
                    />
                    {isTyping && (
                      <div className="absolute right-3 top-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={
                      (!messageText.trim() && !selectedFile) || isUploadingFile
                    }
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {isUploadingFile ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-xl opacity-20"></div>
                <ChatBubbleLeftRightIcon className="relative h-16 w-16 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Select a conversation
              </h3>
              <p className="text-gray-600 mb-8 text-center max-w-md">
                Choose a conversation from the sidebar to start messaging or
                search for new users to connect with
              </p>
              <button
                onClick={getAvailableUsers}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Message Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/50"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-full shadow-lg">
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
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteMessage}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 flex items-center justify-center"
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
    </motion.div>
  );
};

export default InternalMessages;
