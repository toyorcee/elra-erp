import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MdNotifications, MdNotificationsActive } from "react-icons/md";
import { toast } from "react-toastify";
import notificationService from "../services/notifications";
import { useSocket } from "../context/SocketContext";

const NotificationBell = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  // Fetch unread count
  const {
    data: unreadData,
    isLoading: unreadLoading,
    refetch: refetchUnread,
  } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.data?.count || 0;

  // Fetch notifications when dropdown is opened
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(1, 10),
    enabled: isOpen,
  });

  useEffect(() => {
    if (notificationsData?.data) {
      setNotifications(notificationsData.data);
    }
  }, [notificationsData]);

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
  }, [socket, isConnected, refetchUnread]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
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
        toast.success("All notifications marked as read");
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

  const handleNotificationClick = (notification) => {
    setIsOpen(false);
    navigate("/dashboard/notifications", {
      state: { selectedNotificationId: notification._id },
    });
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
      default:
        return "📢";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500";
      case "high":
        return "border-l-orange-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-gray-500";
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
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <MdNotificationsActive className="w-5 h-5" />
        ) : (
          <MdNotifications className="w-5 h-5" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg border-2 border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  {loading ? "Marking..." : "Mark all read"}
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificationsLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors duration-200 border-l-4 cursor-pointer ${getPriorityColor(
                      notification.data?.priority || "medium"
                    )} ${
                      !notification.isRead ? "bg-[var(--elra-secondary-3)]" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-[var(--elra-primary)] rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Mark as read
                            </button>
                          )}
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/dashboard/notifications");
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium w-full text-center"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
