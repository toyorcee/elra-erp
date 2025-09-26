import React, { useState, createContext, useContext, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import Sidebar from "../components/Sidebar";
import ProfileMenu from "../components/ProfileMenu";
import NotificationBell from "../components/NotificationBell";
import MessageDropdown from "../components/MessageDropdown";
import CustomerCareChat from "../components/CustomerCareChat";
import PasswordChangeModal from "../components/common/PasswordChangeModal";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../hooks/useMessages";
import { useMessageContext } from "../context/MessageContext";
import { DynamicSidebarProvider } from "../context/DynamicSidebarContext";
import ELRALogo from "../components/ELRALogo";
import messageService from "../services/messageService";
import { toast } from "react-toastify";
import defaultAvatar from "../assets/defaulticon.jpg";

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUnreadMessagesDropdown, setShowUnreadMessagesDropdown] =
    useState(false);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [isLoadingUnread, setIsLoadingUnread] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { getTotalUnreadCount } = useMessages();
  const { showMessageDropdown, setShowMessageDropdown, openChatWithUser } =
    useMessageContext();

  const totalUnreadMessages = getTotalUnreadCount ? getTotalUnreadCount() : 0;

  // Image utility functions
  const getDefaultAvatar = () => {
    return defaultAvatar;
  };

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) return getDefaultAvatar();
    if (avatarPath.startsWith("http")) return avatarPath;

    const baseUrl = (import.meta.env.VITE_API_URL || "/api").replace(
      "/api",
      ""
    );
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
        {user.firstName?.[0]}
        {user.lastName?.[0]}
      </div>
    );
  };

  // Check if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (user && !loading) {
      // Check if user needs to change password
      if (user.passwordChangeRequired || user.isTemporaryPassword) {
        setShowPasswordModal(true);
      }
    }
  }, [user, loading, setShowPasswordModal]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogoClick = () => {
    if (user && !loading) {
      navigate("/modules");
    } else {
      navigate("/");
    }
  };

  // Fetch unread messages
  const fetchUnreadMessages = async () => {
    try {
      setIsLoadingUnread(true);
      const response = await messageService.getUnreadMessages(10);
      if (response.success) {
        setUnreadMessages(response.data);
      }
    } catch (error) {
      console.error("Error fetching unread messages:", error);
      toast.error("Failed to fetch unread messages");
    } finally {
      setIsLoadingUnread(false);
    }
  };

  // Handle clicking on unread message
  const handleUnreadMessageClick = async (message) => {
    try {
      // Mark messages as read
      await messageService.markMessagesAsRead(message.sender._id);

      // Open chat with sender
      openChatWithUser(message.sender);

      // Close unread messages dropdown
      setShowUnreadMessagesDropdown(false);

      // Refresh unread messages
      fetchUnreadMessages();
    } catch (error) {
      console.error("Error handling unread message click:", error);
      toast.error("Failed to open chat");
    }
  };

  // Toggle unread messages dropdown
  const toggleUnreadMessagesDropdown = () => {
    if (!showUnreadMessagesDropdown) {
      fetchUnreadMessages();
    }
    setShowUnreadMessagesDropdown(!showUnreadMessagesDropdown);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showUnreadMessagesDropdown &&
        !event.target.closest(".message-dropdown-container") &&
        !event.target.closest(".message-icon-button")
      ) {
        setShowUnreadMessagesDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUnreadMessagesDropdown]);

  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        isMobile,
      }}
    >
      <style>{`
        .chat-modal-open .back-to-top-btn {
          display: none !important;
        }
      `}</style>
      <div className="min-h-screen bg-[var(--elra-bg-light)]">
        {/* Fixed Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[var(--elra-border-primary)] shadow-lg shadow-[var(--elra-primary)]/10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side */}
              <div className="flex items-center">
                {/* Mobile hamburger menu */}
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 rounded-xl text-[var(--elra-primary)] hover:bg-[var(--elra-secondary-3)] transition-all duration-200 hover:scale-105 mr-4"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {/* Spacer for desktop sidebar toggle */}
                <div className="hidden lg:block w-12 mr-2"></div>

                {/* ELRA Logo - Now clickable */}
                <div
                  className="cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={handleLogoClick}
                  title={user && !loading ? "Go to Modules" : "Go to Home"}
                >
                  <ELRALogo variant="dark" size="sm" />
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Message Icon - Always visible like other icons */}
                <div className="relative">
                  <button
                    onClick={toggleUnreadMessagesDropdown}
                    className="message-icon-button p-2 rounded-xl text-[var(--elra-primary)] hover:bg-[var(--elra-secondary-3)] transition-all duration-200 hover:scale-105 relative cursor-pointer"
                  >
                    <ChatBubbleLeftRightIcon className="h-6 w-6" />
                    <span
                      className={`absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center font-bold transition-all duration-200 ${
                        totalUnreadMessages === 0
                          ? "bg-[var(--elra-primary)] scale-90"
                          : "bg-red-500 scale-100 animate-pulse"
                      }`}
                    >
                      {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                    </span>
                  </button>

                  {/* Unread Messages Dropdown */}
                  {showUnreadMessagesDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-[var(--elra-border-primary)] z-50 message-dropdown-container">
                      <div className="p-4 border-b border-[var(--elra-border-primary)]">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-[var(--elra-text-primary)]">
                            Unread Messages
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setShowUnreadMessagesDropdown(false);
                                setShowMessageDropdown(true);
                              }}
                              className="flex items-center gap-1 text-xs text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium transition-colors cursor-pointer"
                              title="Open Full Chat"
                            >
                              <ChatBubbleLeftRightIcon className="w-3 h-3" />
                              Chat
                            </button>
                            <button
                              onClick={() =>
                                setShowUnreadMessagesDropdown(false)
                              }
                              className="text-[var(--elra-text-muted)] hover:text-[var(--elra-text-primary)]"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {isLoadingUnread ? (
                          <div className="p-4 text-center text-[var(--elra-text-muted)]">
                            Loading...
                          </div>
                        ) : unreadMessages.length === 0 ? (
                          <div className="p-4 text-center text-[var(--elra-text-muted)]">
                            No unread messages
                          </div>
                        ) : (
                          unreadMessages.map((message) => (
                            <div
                              key={message._id}
                              onClick={() => handleUnreadMessageClick(message)}
                              className="p-4 border-b border-[var(--elra-border-primary)] hover:bg-[var(--elra-secondary-3)] cursor-pointer transition-colors"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden">
                                  {getAvatarDisplay(message.sender)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-[var(--elra-text-primary)] truncate">
                                      {message.sender.firstName}{" "}
                                      {message.sender.lastName}
                                    </p>
                                    <span className="text-xs text-[var(--elra-text-muted)]">
                                      {new Date(
                                        message.createdAt
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-[var(--elra-text-muted)] truncate mt-1">
                                    {message.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {unreadMessages.length > 0 && (
                        <div className="p-3 border-t border-[var(--elra-border-primary)]">
                          <button
                            onClick={() => {
                              setShowUnreadMessagesDropdown(false);
                              setShowMessageDropdown(true);
                            }}
                            className="w-full text-sm text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium"
                          >
                            View all messages
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <NotificationBell />

                <ProfileMenu />
              </div>
            </div>
          </div>
        </nav>

        {/* Message Dropdown */}
        <MessageDropdown
          isOpen={showMessageDropdown}
          onClose={() => setShowMessageDropdown(false)}
        />

        {/* Customer Care Floating Chat Button */}
        <CustomerCareChat />

        {/* Back to Top Arrow - Shows everywhere, hidden when chat modal is open */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="back-to-top-btn fixed bottom-6 left-6 z-50 p-3 bg-[var(--elra-primary)] text-white rounded-full shadow-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-300 hover:scale-110"
          title="Back to top"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>

        {/* Main Content Area */}
        <div className="flex flex-1 pt-16 min-h-screen">
          <DynamicSidebarProvider>
            {/* Sidebar */}
            <Sidebar
              isOpen={sidebarOpen}
              onToggle={toggleSidebar}
              isMobile={isMobile}
            />
            {/* Content - Now responsive to sidebar state and mobile */}
            <div
              className={`flex-1 transition-all duration-300 ease-in-out ${
                sidebarOpen ? "lg:ml-64" : "lg:ml-16"
              } ${isMobile ? "ml-0" : ""}`}
            >
              {/* Mobile overlay */}
              {isMobile && sidebarOpen && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                  onClick={toggleSidebar}
                />
              )}

              {/* Main content area */}
              <div className="min-h-screen bg-gray-50">
                <Outlet />
              </div>
            </div>
          </DynamicSidebarProvider>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => {
          if (user?.passwordChangeRequired || user?.isTemporaryPassword) {
            return;
          }
          setShowPasswordModal(false);
        }}
        onSuccess={() => {
          console.log("✅ Password changed successfully");
          setShowPasswordModal(false);
        }}
        userData={user}
      />
    </SidebarContext.Provider>
  );
};

export default DashboardLayout;
