import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdNotifications,
  MdNotificationsActive,
  MdCheck,
  MdDelete,
  MdSearch,
  MdDescription,
  MdApproval,
  MdWarning,
  MdInfo,
  MdSchedule,
  MdMarkEmailRead,
  MdRefresh,
  MdCheckCircle,
  MdClose,
} from "react-icons/md";
import { toast } from "react-toastify";
import notificationService from "../../services/notifications";

const Notifications = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [markingAsRead, setMarkingAsRead] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMarkAllModal, setShowMarkAllModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (location.state?.selectedNotificationId) {
      const notificationId = location.state.selectedNotificationId;
      const notification = notifications.find((n) => n._id === notificationId);
      if (notification) {
        setSelectedNotification(notification);
      }
    }
  }, [location.state, notifications]);

  // Clear location state when selected notification is null
  useEffect(() => {
    if (!selectedNotification && location.state?.selectedNotificationId) {
      window.history.replaceState({}, document.title);
    }
  }, [selectedNotification, location.state]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications. Please try again.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId, event) => {
    if (event) {
      event.stopPropagation();
    }

    try {
      setMarkingAsRead(notificationId);

      const response = await notificationService.markAsRead(notificationId);

      if (response.success) {
        await fetchNotifications();

        toast.success(
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="text-[var(--elra-primary)]"
            >
              <MdCheckCircle size={24} />
            </motion.div>
            <span>Marked as read successfully!</span>
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            icon: false,
          }
        );
      } else {
        throw new Error(response.message || "Failed to mark as read");
      }
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read. Please try again.");
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      setShowMarkAllModal(false);
      const response = await notificationService.markAllAsRead();

      if (response.success) {
        await fetchNotifications();

        toast.success(
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="text-[var(--elra-primary)]"
            >
              <MdCheckCircle size={24} />
            </motion.div>
            <span>All notifications marked as read!</span>
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            icon: false,
          }
        );
      } else {
        throw new Error(response.message || "Failed to mark all as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read. Please try again.");
    }
  };

  const deleteNotification = async (notificationId, event) => {
    if (event) {
      event.stopPropagation();
    }

    try {
      setShowDeleteModal(false);
      setNotificationToDelete(null);

      await notificationService.deleteNotification(notificationId);

      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );

      if (selectedNotification && selectedNotification._id === notificationId) {
        setSelectedNotification(null);
      }

      toast.success("Notification deleted successfully!");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification. Please try again.");
    }
  };

  const handleDeleteClick = (notificationId, event) => {
    if (event) {
      event.stopPropagation();
    }
    setNotificationToDelete(notificationId);
    setShowDeleteModal(true);
  };

  const handleNotificationClick = async (notification) => {
    console.log(
      "🔍 [NOTIFICATION CLICK] Full notification object:",
      notification
    );
    setSelectedNotification(notification);
  };

  const handleModalClose = () => {
    setSelectedNotification(null);
    console.log("🔍 [MODAL CLOSE] Staying on notifications page");
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "document":
        return (
          <MdDescription className="text-[var(--elra-primary)]" size={24} />
        );
      case "approval":
        return <MdApproval className="text-[var(--elra-primary)]" size={24} />;
      case "warning":
        return <MdWarning className="text-[var(--elra-primary)]" size={24} />;
      case "system":
        return <MdSchedule className="text-[var(--elra-primary)]" size={24} />;
      case "info":
        return <MdInfo className="text-[var(--elra-primary)]" size={24} />;
      default:
        return (
          <MdNotifications className="text-[var(--elra-primary)]" size={24} />
        );
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 border-[var(--elra-primary)]/20";
      case "medium":
        return "text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 border-[var(--elra-primary)]/20";
      case "low":
        return "text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 border-[var(--elra-primary)]/20";
      default:
        return "text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 border-[var(--elra-primary)]/20";
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getSenderDisplay = (sender) => {
    if (!sender) {
      return {
        name: "ELRA System",
        email: "system@elra.com",
        avatar: "ES",
      };
    }

    return {
      name: sender.name || "ELRA System",
      email: sender.email || "system@elra.com",
      avatar: sender.avatar || "ES",
    };
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.sender?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !notification.isRead) ||
      (filter === "read" && notification.isRead) ||
      (filter === "high" && (notification.priority || "low") === "high");

    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    hover: {
      y: -2,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6 text-[var(--elra-primary)] font-[Poppins]">
          Notifications
        </h1>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-20 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 mx-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="p-3 rounded-xl bg-[var(--elra-primary)] text-white shadow-lg"
              >
                <MdNotifications size={24} />
              </motion.div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[var(--elra-primary)]">
                  Notifications
                </h1>
                <p className="text-gray-600 mt-1 text-sm">
                  Stay updated with important alerts and updates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMarkAllModal(true)}
                  className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-300 flex items-center gap-2 cursor-pointer"
                >
                  <MdMarkEmailRead size={20} />
                  Mark All Read
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total</p>
                <p className="text-4xl font-bold text-[var(--elra-primary)]">
                  {notifications.length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--elra-primary)] text-white group-hover:scale-110 transition-transform duration-300">
                <MdNotifications size={28} />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Unread</p>
                <p className="text-4xl font-bold text-orange-600">
                  {unreadCount}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-orange-500 text-white group-hover:scale-110 transition-transform duration-300">
                <MdNotificationsActive size={28} />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Read</p>
                <p className="text-4xl font-bold text-blue-600">{readCount}</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-500 text-white group-hover:scale-110 transition-transform duration-300">
                <MdMarkEmailRead size={28} />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MdSearch
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent bg-white/50 backdrop-blur-sm text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent bg-white/50 backdrop-blur-sm text-gray-700"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="high">High Priority</option>
              </select>

              <motion.button
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={fetchNotifications}
                className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors bg-white/50 backdrop-blur-sm cursor-pointer"
              >
                <MdRefresh size={20} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-16 border border-white/30 shadow-xl text-center"
            >
              <div className="text-gray-400 text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No notifications found
              </h3>
              <p className="text-gray-600">
                {searchTerm || filter !== "all"
                  ? "Try adjusting your search or filters."
                  : "You're all caught up! No new notifications."}
              </p>
            </motion.div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification._id}
                variants={cardVariants}
                whileHover="hover"
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl transition-all duration-300 overflow-hidden cursor-pointer ${
                  !notification.read
                    ? "ring-2 ring-[var(--elra-primary)]/20"
                    : ""
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {notification.message}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                              notification.priority || "low"
                            )}`}
                          >
                            {notification.priority || "low"}
                          </span>
                          {!notification.read && (
                            <div className="w-3 h-3 bg-[var(--elra-primary)] rounded-full"></div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[var(--elra-primary)] flex items-center justify-center text-white font-bold text-sm">
                              {getSenderDisplay(notification.sender).avatar}
                            </div>
                            <span>
                              {getSenderDisplay(notification.sender).name}
                            </span>
                          </div>
                          <span>{formatTimestamp(notification.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => markAsRead(notification._id, e)}
                              disabled={markingAsRead === notification._id}
                              className="p-2 text-gray-400 hover:text-[var(--elra-primary)] hover:bg-[var(--elra-primary)]/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              title="Mark as read"
                            >
                              {markingAsRead === notification._id ? (
                                <div className="w-4 h-4 border-2 border-[var(--elra-primary)] border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <MdMarkEmailRead size={18} />
                              )}
                            </motion.button>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) =>
                              handleDeleteClick(notification._id, e)
                            }
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete notification"
                          >
                            <MdDelete size={18} />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
            onClick={handleModalClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    {getNotificationIcon(selectedNotification.type)}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedNotification.title}
                      </h2>
                      <p className="text-gray-600">
                        {formatTimestamp(selectedNotification.createdAt)}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleModalClose}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 cursor-pointer"
                    title="Close"
                  >
                    <MdClose size={24} />
                  </motion.button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Message
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedNotification.message}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Sender
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--elra-primary)] flex items-center justify-center text-white font-bold">
                          {getSenderDisplay(selectedNotification.sender).avatar}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {getSenderDisplay(selectedNotification.sender).name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {
                              getSenderDisplay(selectedNotification.sender)
                                .email
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Status
                      </h3>
                      <span
                        className={`px-3 py-2 rounded-full text-sm font-semibold border ${
                          selectedNotification.read
                            ? "text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 border-[var(--elra-primary)]/20"
                            : "text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 border-[var(--elra-primary)]/20"
                        }`}
                      >
                        {selectedNotification.read ? "READ" : "UNREAD"}
                      </span>
                    </div>
                  </div>

                  {selectedNotification.document && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Related Document
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-900">
                          {selectedNotification.document.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          Reference: {selectedNotification.document.reference}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedNotification.metadata && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Additional Details
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {Object.entries(selectedNotification.metadata).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between py-1"
                            >
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}:
                              </span>
                              <span className="text-sm text-gray-600">
                                {value instanceof Date
                                  ? value.toLocaleDateString()
                                  : value}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex gap-3">
                      {!selectedNotification.read && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (selectedNotification._id) {
                              markAsRead(selectedNotification._id);
                            }
                            handleModalClose();
                          }}
                          className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-300 cursor-pointer"
                        >
                          Mark as Read
                        </motion.button>
                      )}

                      {selectedNotification.actionUrl && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            window.location.href =
                              selectedNotification.actionUrl;
                          }}
                          className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-300 cursor-pointer"
                        >
                          Take Action
                        </motion.button>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (selectedNotification._id) {
                          deleteNotification(selectedNotification._id);
                        }
                        handleModalClose();
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 cursor-pointer"
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdDelete className="text-red-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Delete Notification
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this notification? This action
                  cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteNotification(notificationToDelete)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mark All Read Confirmation Modal */}
      <AnimatePresence>
        {showMarkAllModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowMarkAllModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-[var(--elra-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdMarkEmailRead
                    className="text-[var(--elra-primary)]"
                    size={32}
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Mark All as Read
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to mark all {unreadCount} unread
                  notifications as read?
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowMarkAllModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors cursor-pointer"
                  >
                    Mark All Read
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
