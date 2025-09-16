import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import notificationService from "../services/notifications";
import { useSocket } from "../context/SocketContext";
import NotificationModal from "./NotificationModal";

const NotificationBell = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  const {
    data: unreadData,
    isLoading: unreadLoading,
    refetch: refetchUnread,
  } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 10000,
  });

  const unreadCount = unreadData?.data?.count || 0;

  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(1, 10),
    enabled: isOpen || unreadCount > 0,
    refetchInterval: isOpen ? 5000 : 15000,
  });

  useEffect(() => {
    if (notificationsData?.data) {
      setNotifications(notificationsData.data);
    }
  }, [notificationsData]);

  useEffect(() => {
    if (unreadCount > 0 && !isOpen) {
      refetchNotifications();
    }
  }, [unreadCount, isOpen, refetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (notification) => {
      console.log("🔔 Real-time notification received:", notification);
      setNotifications((prev) => [notification, ...prev]);
      refetchUnread();
      refetchNotifications();

      const bell = document.querySelector('[title="Notifications"]');
      if (bell) {
        bell.classList.add("animate-bounce");
        setTimeout(() => {
          bell.classList.remove("animate-bounce");
        }, 1000);
      }

      toast.info(notification.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [socket, isConnected, refetchUnread, refetchNotifications]);

  const handleRefreshNotifications = () => {
    refetchUnread();
    refetchNotifications();
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        // Update selectedNotification if it's the same notification
        setSelectedNotification((prev) =>
          prev && prev._id === notificationId ? { ...prev, read: true } : prev
        );
        refetchUnread();
        refetchNotifications();
      } else {
        throw new Error(response.message || "Failed to mark as read");
      }
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true }))
        );
        refetchUnread();
        refetchNotifications();
        toast.success("All notifications marked as read", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        throw new Error(response.message || "Failed to mark all as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all notifications as read");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
      refetchUnread();
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const [selectedNotification, setSelectedNotification] = useState(null);

  const handleNotificationClick = (notification) => {
    console.log("🔔 Clicking notification:", notification);
    setIsOpen(false);
    setSelectedNotification(notification);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "DOCUMENT_APPROVAL":
        return "📋";
      case "DOCUMENT_REJECTED":
        return "❌";
      case "DOCUMENT_SUBMITTED":
        return "📤";
      case "APPROVAL_OVERDUE":
        return "⏰";
      case "DOCUMENT_SHARED":
        return "📎";
      case "SYSTEM_ALERT":
        return "🔔";
      case "WORKFLOW_UPDATE":
        return "🔄";
      case "COMPLIANCE_CREATED":
        return "⚠️";
      case "COMPLIANCE_UPDATED":
        return "📝";
      case "COMPLIANCE_DELETED":
        return "🗑️";
      case "POLICY_CREATED":
        return "📋";
      case "POLICY_UPDATED":
        return "📝";
      case "INVENTORY_COMPLETION":
        return "📦";
      case "PROJECT_READY_IMPLEMENTATION":
        return "🚀";
      case "FUND_ADDITION":
        return "💰";
      default:
        return "📢";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            // Trigger immediate fetch when opening
            refetchNotifications();
          }
        }}
        className="p-2 rounded-xl text-[var(--elra-primary)] hover:bg-[var(--elra-secondary-3)] transition-all duration-200 hover:scale-105 relative cursor-pointer"
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <BellIcon className="w-6 h-6" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center font-bold transition-all duration-200 bg-orange-500 scale-100 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-[var(--elra-border-primary)] z-50">
          <div className="p-4 border-b border-[var(--elra-border-primary)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--elra-text-primary)]">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefreshNotifications();
                  }}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Refresh notifications"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAllAsRead();
                    }}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <CheckIcon className="w-3 h-3" />
                    {loading ? "Marking..." : "Mark all read"}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[var(--elra-text-muted)] hover:text-[var(--elra-text-primary)]"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificationsLoading ? (
              <div className="p-4 text-center text-[var(--elra-text-muted)]">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-[var(--elra-text-muted)]">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 border-b border-[var(--elra-border-primary)] hover:bg-[var(--elra-secondary-3)] cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[var(--elra-text-primary)] truncate">
                          {notification.title}
                        </p>
                        <span className="text-xs text-[var(--elra-text-muted)]">
                          {formatTimestamp(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--elra-text-muted)] truncate mt-1">
                        {notification.message}
                      </p>
                      {!notification.isRead && (
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id);
                            }}
                            className="text-xs text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)]"
                          >
                            Mark as read
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification._id);
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-[var(--elra-border-primary)]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/dashboard/notifications");
                }}
                className="w-full text-sm text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        notification={
          selectedNotification
            ? notifications.find((n) => n._id === selectedNotification._id) ||
              selectedNotification
            : null
        }
        onClose={() => setSelectedNotification(null)}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDeleteNotification}
      />
    </div>
  );
};

export default NotificationBell;
