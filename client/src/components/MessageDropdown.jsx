import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useMessages } from "../hooks/useMessages";
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
} from "@heroicons/react/24/outline";
import { formatMessageTime } from "../types/messageTypes";
import messageService from "../services/messageService";

const MessageDropdown = ({ isOpen, onClose }) => {
  // CSS to prevent large icon overlays
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
        const department = user.department?.name?.toLowerCase() || "";
        const role = user.role?.name?.toLowerCase() || "";

        return (
          displayName.includes(searchTerm.toLowerCase()) ||
          email.includes(searchTerm.toLowerCase()) ||
          department.includes(searchTerm.toLowerCase()) ||
          role.includes(searchTerm.toLowerCase())
        );
      })
      .slice(0, 10);

    return result;
  };

  const filteredAvailableUsers = getFilteredAvailableUsers();

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load available users when dropdown opens
  useEffect(() => {
    if (isOpen) {
      getAvailableUsers();
    }
  }, [isOpen, getAvailableUsers]);

  // Load available users when search term changes
  useEffect(() => {
    if (isOpen) {
      getAvailableUsers();
    }
  }, [searchTerm, isOpen, getAvailableUsers]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversation]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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
            onClick={onClose}
          />

          {/* Message Panel */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="relative w-full max-w-md h-[calc(100vh-4rem)] bg-white rounded-l-2xl shadow-2xl border border-gray-200 overflow-hidden message-dropdown"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Messages</h3>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-xs text-gray-600">
                      {isConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {!showChat ? (
              /* Conversations List */
              <div className="flex flex-col h-full">
                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                      }}
                      placeholder="Search conversations and users..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600 text-sm">
                        Loading conversations...
                      </p>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-4">
                      <div className="text-center mb-4">
                        <div className="text-gray-400 text-3xl mb-2">💬</div>
                        <p className="text-gray-600 text-sm mb-4">
                          No conversations found
                        </p>
                        <p className="text-gray-500 text-xs">
                          Start a new conversation with someone:
                        </p>
                      </div>

                      {/* Available Users */}
                      {isLoadingUsers ? (
                        <div className="space-y-2">
                          <div className="p-4 text-center">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-gray-600 text-sm">
                              Loading users...
                            </p>
                          </div>
                        </div>
                      ) : filteredAvailableUsers.length > 0 ? (
                        <div className="space-y-2">
                          {filteredAvailableUsers.map((user) => (
                            <div
                              key={user._id}
                              onClick={() => handleStartNewConversation(user)}
                              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                                    {getInitials(user)}
                                  </div>
                                  <div
                                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                      onlineUsers.has(user._id)
                                        ? "bg-green-500"
                                        : "bg-gray-400"
                                    }`}
                                  ></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 truncate text-sm">
                                    {getDisplayName(user)}
                                  </h4>
                                  <p className="text-xs text-gray-600 truncate">
                                    {user.email}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      {user.department?.name}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {user.role?.name}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center">
                          <div className="text-gray-400 text-2xl mb-2">👥</div>
                          <p className="text-gray-600 text-sm mb-2">
                            No users found
                          </p>
                          <p className="text-gray-500 text-xs">
                            Try adjusting your search terms
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation._id._id}
                        onClick={() => handleConversationSelect(conversation)}
                        className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                              {getInitials(conversation._id)}
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
                              <h4 className="font-medium text-gray-900 truncate text-sm">
                                {getDisplayName(conversation._id)}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {conversation.lastMessage?.createdAt
                                  ? formatMessageTime(
                                      conversation.lastMessage.createdAt
                                    )
                                  : ""}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 truncate">
                              {conversation.lastMessage?.content ||
                                "No messages yet"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatUserStatus(conversation._id)}
                              </span>
                              {unreadCounts[conversation._id._id] > 0 && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                                  {unreadCounts[conversation._id._id]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Chat Interface */
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowChat(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ChevronDownIcon className="h-5 w-5" />
                    </button>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(selectedConversation._id)}
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
                      <h4 className="font-medium text-gray-900 text-sm">
                        {getDisplayName(selectedConversation._id)}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {formatUserStatus(selectedConversation._id)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {getMessagesForUser(selectedConversation._id._id).map(
                    (message) => {
                      const currentUserId = user?._id || user?.id;
                      const isMessageFromCurrentUser =
                        message.sender._id === currentUserId;
                      const isOwnMessage = isMessageFromCurrentUser;

                      return (
                        <div
                          key={message._id}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          } mb-3`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                              isOwnMessage
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div
                              className={`flex items-center justify-between mt-1 text-xs ${
                                isOwnMessage ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              <span>
                                {formatMessageTime(message.createdAt)}
                              </span>
                              {isOwnMessage && (
                                <div className="flex items-center gap-1 ml-2">
                                  {message.status === "sending" && (
                                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                                  )}
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
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs">read</span>
                                      <div className="flex">
                                        <CheckIcon className="h-3 w-3" />
                                        <CheckIcon className="h-3 w-3 -ml-1" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}

                  {/* Typing indicator */}
                  {typingUsers.has(selectedConversation._id._id) && (
                    <div className="flex justify-start mb-3">
                      <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-1">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">
                            typing...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
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
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Conversation Suggestions */}
                  {showSuggestions && conversationSuggestions.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                      {conversationSuggestions.map((suggestion) => (
                        <div
                          key={suggestion._id._id}
                          onClick={() => {
                            handleConversationSelect(suggestion);
                            setMessageText("");
                            setShowSuggestions(false);
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                                {getInitials(suggestion._id)}
                              </div>
                              <div
                                className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white ${
                                  onlineUsers.has(suggestion._id._id)
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              ></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm truncate">
                                {getDisplayName(suggestion._id)}
                              </h4>
                              <p className="text-xs text-gray-500 truncate">
                                {suggestion._id.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
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
