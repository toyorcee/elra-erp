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
  EllipsisVerticalIcon,
  TrashIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
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
  const [showChat, setShowChat] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
    if (selectedUser && isOpen) {
      handleStartNewConversation(selectedUser);
    }
  }, [selectedUser, isOpen]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      await sendNewMessage(selectedConversation._id._id, messageText.trim());
      setMessageText("");

      setIsTyping(false);
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
      } else {
        console.error("❌ Failed to get available users:", response);
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error("Error fetching available users:", error);
      setAvailableUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [searchTerm]);

  // Filter available users based on search term
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

  // Load conversations and available users on mount
  useEffect(() => {
    if (isOpen) {
      loadConversations();
      getAvailableUsers();
    }
  }, [isOpen, loadConversations, getAvailableUsers]);

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
            className="relative w-full max-w-md h-[calc(100vh-4rem)] bg-white rounded-l-2xl shadow-2xl border border-[var(--elra-border-primary)] overflow-hidden message-dropdown"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--elra-border-primary)] bg-gradient-to-r from-[var(--elra-secondary-3)] to-white">
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
                className="p-2 text-[var(--elra-text-muted)] hover:text-[var(--elra-text-primary)] transition-colors"
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
                      placeholder="Search users to start a conversation..."
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

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
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
                              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                onlineUsers.has(conversation._id._id)
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            ></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-[var(--elra-text-primary)] text-sm truncate">
                                {getDisplayName(conversation._id)}
                              </h4>
                              {unreadCounts[conversation._id._id] > 0 && (
                                <span className="bg-[var(--elra-primary)] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                  {unreadCounts[conversation._id._id]}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--elra-text-secondary)] truncate">
                              {conversation.lastMessage?.content ||
                                "No messages yet"}
                            </p>
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
                                    className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white ${
                                      onlineUsers.has(user._id)
                                        ? "bg-green-500"
                                        : "bg-gray-400"
                                    }`}
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
                            <div className="mt-12 p-3 bg-[var(--elra-primary)] rounded-lg">
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
                <div className="flex items-center justify-between p-4 border-b border-[var(--elra-border-primary)] bg-gradient-to-r from-[var(--elra-secondary-3)] to-white">
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
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          onlineUsers.has(selectedConversation._id._id)
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      ></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-[var(--elra-text-primary)] text-sm">
                        {getDisplayName(selectedConversation._id)}
                      </h4>
                      <p className="text-xs text-[var(--elra-text-secondary)]">
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
                                        <CheckCircleIcon className="h-3 w-3" />
                                      )}
                                      {message.status === "read" && (
                                        <CheckCircleIcon className="h-3 w-3 text-[var(--elra-secondary-3)]" />
                                      )}
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
                  <div className="flex items-center gap-2">
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
                      disabled={!messageText.trim()}
                      className="p-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                      <span className="text-xs font-medium">Send</span>
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
    </>
  );
};

export default MessageDropdown;
