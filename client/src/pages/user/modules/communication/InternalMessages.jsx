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
} from "@heroicons/react/24/outline";
import { formatMessageTime } from "../../../../types/messageTypes";
import messageService from "../../../../services/messageService";
import defaultAvatar from "../../../../assets/defaulticon.jpg";
import Skeleton from "../../../../components/common/Skeleton";

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
    formatUserStatus,
    getUserDisplayName: getDisplayName,
    getUserInitials: getInitials,
  } = useMessages();

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

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

  // Sidebar for this module is populated automatically by DynamicSidebarContext

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
  const handleSendMessage = async () => {
    const content = messageText.trim();
    if (!content || !selectedConversation) return;

    setMessageText("");
    setIsTyping(false);

    try {
      await sendNewMessage(selectedConversation._id._id, content);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle typing
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

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start new conversation (no endpoint): select user and load history
  const handleStartNewConversation = async (user) => {
    try {
      setSelectedConversation({ _id: user });
      await loadChatHistory(user._id);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  // Get available users for new conversation
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
      className="h-screen bg-gray-50 flex"
    >
      {/* Left Sidebar - 30% */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <button
              onClick={getAvailableUsers}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
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
          ) : searchTerm || availableUsers.length > 0 ? (
            <div className="space-y-1 p-2">
              {availableUsers.map((user) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50"
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
              ))}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation._id._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedConversation?._id._id === conversation._id._id
                      ? "bg-pink-50 border border-pink-200"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={async () => {
                    setSelectedConversation(conversation);
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
                          <span className="bg-pink-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {unreadCounts[conversation._id._id]}
                          </span>
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
            </div>
          )}
        </div>
      </div>

      {/* Right Content - 70% */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
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
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                          i % 2 === 0 ? "flex-row-reverse space-x-reverse" : ""
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
                  (message) => (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        message.sender._id === user._id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex space-x-2 max-w-xs lg:max-w-md ${
                          message.sender._id === user._id
                            ? "flex-row-reverse space-x-reverse"
                            : ""
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          {getAvatarDisplay(message.sender)}
                        </div>
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            message.sender._id === user._id
                              ? "bg-pink-500 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender._id === user._id
                                ? "text-pink-100"
                                : "text-gray-500"
                            }`}
                          >
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                )
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    value={messageText}
                    onChange={handleTyping}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                    rows="1"
                  />
                  {isTyping && (
                    <div className="absolute right-2 top-2">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 mb-6">
                Choose a conversation from the sidebar to start messaging
              </p>
              <button
                onClick={getAvailableUsers}
                className="inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InternalMessages;
