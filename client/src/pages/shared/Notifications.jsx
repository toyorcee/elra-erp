import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import SkeletonLoader from "../../components/SkeletonLoader";
import {
  MdNotifications,
  MdNotificationsActive,
  MdNotificationsNone,
  MdCheck,
  MdDelete,
  MdFilterList,
  MdSearch,
  MdDescription,
  MdApproval,
  MdWarning,
  MdInfo,
  MdSchedule,
  MdPerson,
  MdEmail,
} from "react-icons/md";
import { toast } from "react-toastify";
import notificationService from "../../services/notifications";

const Notifications = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      toast.success("Marked as read");
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "document":
        return <MdDescription className="text-blue-600" />;
      case "approval":
        return <MdApproval className="text-green-600" />;
      case "warning":
        return <MdWarning className="text-orange-600" />;
      case "system":
        return <MdSchedule className="text-purple-600" />;
      case "info":
        return <MdInfo className="text-cyan-600" />;
      default:
        return <MdNotifications className="text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50";
      case "medium":
        return "border-l-orange-500 bg-orange-50";
      case "low":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !notification.read) ||
      (filter === "read" && notification.read) ||
      notification.type === filter;

    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-900 font-[Poppins]">
          Notifications
        </h1>
        <SkeletonLoader className="h-96" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-900 font-[Poppins] flex items-center">
          <MdNotifications className="mr-3 text-blue-600" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-3 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h1>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MdCheck className="mr-1" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 rounded-xl p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Filter Tabs */}
          <div className="flex space-x-1">
            {[
              { id: "all", label: "All", count: notifications.length },
              { id: "unread", label: "Unread", count: unreadCount },
              {
                id: "read",
                label: "Read",
                count: notifications.length - unreadCount,
              },
              {
                id: "document",
                label: "Documents",
                count: notifications.filter((n) => n.type === "document")
                  .length,
              },
              {
                id: "approval",
                label: "Approvals",
                count: notifications.filter((n) => n.type === "approval")
                  .length,
              },
              {
                id: "system",
                label: "System",
                count: notifications.filter((n) => n.type === "system").length,
              },
            ].map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === filterOption.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {filterOption.label}
                <span className="ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                  {filterOption.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white/80 rounded-xl p-8 text-center shadow-sm">
            <MdNotificationsNone className="mx-auto text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No notifications found" : "No notifications"}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Try adjusting your search terms"
                : "You're all caught up! Check back later for new notifications."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white/80 rounded-xl p-4 shadow-sm border-l-4 transition-all duration-200 hover:shadow-md ${
                notification.read ? "opacity-75" : ""
              } ${getPriorityColor(notification.priority)}`}
            >
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3
                        className={`font-medium text-gray-900 ${
                          notification.read ? "" : "font-semibold"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <MdPerson className="mr-1" />
                          {notification.sender}
                        </span>
                        <span className="flex items-center">
                          <MdSchedule className="mr-1" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {notification.documentId && (
                          <span className="text-blue-600 font-medium">
                            Document ID: {notification.documentId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Mark as read"
                        >
                          <MdCheck size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete notification"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination or Load More */}
      {filteredNotifications.length > 0 && (
        <div className="mt-6 text-center">
          <button className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Load more notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
