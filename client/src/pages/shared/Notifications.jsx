import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
<<<<<<< HEAD

=======
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
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
} from "react-icons/md";
import { toast } from "react-toastify";
import notificationService from "../../services/notifications";

const Notifications = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [markingAsRead, setMarkingAsRead] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle selected notification from navigation state
  useEffect(() => {
    if (location.state?.selectedNotificationId) {
      const notificationId = location.state.selectedNotificationId;
      // Find the notification and set it as selected
      const notification = notifications.find((n) => n._id === notificationId);
      if (notification) {
        setSelectedNotification(notification);
      }
    }
  }, [location.state, notifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Use mock data for demo
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  };

  // Mock notifications for demo
  const getMockNotifications = () => [
    {
      _id: "1",
      title: "Document Approval Required",
      message:
        "Sarah Johnson has requested approval for the Q4 Claims Report. Please review and approve within 24 hours.",
      type: "approval",
      priority: "high",
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      sender: {
        name: "Sarah Johnson",
        email: "sarah.johnson@company.com",
        avatar: "SJ",
      },
      document: {
        title: "Q4 Claims Report",
        reference: "DOC-2024-001",
      },
      actionUrl: "/dashboard/documents",
      metadata: {
        department: "Claims",
        deadline: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours from now
        category: "Financial Report",
      },
    },
    {
      _id: "2",
      title: "System Maintenance Scheduled",
      message:
        "Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST. System may experience brief interruptions.",
      type: "system",
      priority: "medium",
      read: true,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      sender: {
        name: "IT Department",
        email: "it@company.com",
        avatar: "IT",
      },
      actionUrl: "/dashboard/settings",
      metadata: {
        maintenanceType: "Routine",
        affectedServices: ["Document Upload", "Email Notifications"],
        estimatedDuration: "2 hours",
      },
    },
    {
      _id: "3",
      title: "New Team Member Added",
      message:
        "Michael Chen has been added to your department. Please welcome them and review their access permissions.",
      type: "info",
      priority: "low",
      read: false,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      sender: {
        name: "HR Department",
        email: "hr@company.com",
        avatar: "HR",
      },
      actionUrl: "/dashboard/department/staff",
      metadata: {
        newMember: "Michael Chen",
        position: "Claims Adjuster",
        department: "Claims",
      },
    },
    {
      _id: "4",
      title: "Document Upload Successful",
      message:
        "Your document 'Monthly Compliance Report' has been successfully uploaded and is now available for review.",
      type: "document",
      priority: "low",
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      sender: {
        name: "System",
        email: "system@company.com",
        avatar: "SYS",
      },
      document: {
        title: "Monthly Compliance Report",
        reference: "DOC-2024-002",
      },
      actionUrl: "/dashboard/documents",
      metadata: {
        fileSize: "2.4 MB",
        uploadTime: "2 minutes",
        category: "Compliance",
      },
    },
    {
      _id: "5",
      title: "Security Alert",
      message:
        "Multiple failed login attempts detected from an unrecognized IP address. Please verify your account security.",
      type: "warning",
      priority: "high",
      read: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      sender: {
        name: "Security Team",
        email: "security@company.com",
        avatar: "SEC",
      },
      actionUrl: "/dashboard/settings",
      metadata: {
        ipAddress: "192.168.1.100",
        location: "Unknown",
        attempts: 5,
        timeWindow: "10 minutes",
      },
    },
  ];

  const markAsRead = async (notificationId, event) => {
    // Prevent event bubbling if called from button click
    if (event) {
      event.stopPropagation();
    }

    try {
      setMarkingAsRead(notificationId);

      // Call the backend API
      await notificationService.markAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );

      // Show beautiful success toast with blue tick
      toast.success(
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="text-blue-500"
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
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read. Please try again.");
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Call the backend API
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );

      // Show beautiful success toast
      toast.success(
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="text-blue-500"
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
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read. Please try again.");
    }
  };

  const deleteNotification = async (notificationId, event) => {
    // Prevent event bubbling if called from button click
    if (event) {
      event.stopPropagation();
    }

    try {
      // Call the backend API
      await notificationService.deleteNotification(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );

      // Close modal if the deleted notification was selected
      if (selectedNotification && selectedNotification._id === notificationId) {
        setSelectedNotification(null);
      }

      toast.success("Notification deleted successfully!");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification. Please try again.");
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "document":
        return <MdDescription className="text-blue-600" size={24} />;
      case "approval":
        return <MdApproval className="text-green-600" size={24} />;
      case "warning":
        return <MdWarning className="text-orange-600" size={24} />;
      case "system":
        return <MdSchedule className="text-purple-600" size={24} />;
      case "info":
        return <MdInfo className="text-cyan-600" size={24} />;
      default:
        return <MdNotifications className="text-gray-600" size={24} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100/80 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-100/80 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-100/80 border-green-200";
      default:
        return "text-gray-600 bg-gray-100/80 border-gray-200";
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

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.sender?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !notification.read) ||
      (filter === "read" && notification.read) ||
      (filter === "high" && (notification.priority || "low") === "high");

    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const highPriorityCount = notifications.filter(
    (n) => (n.priority || "low") === "high" && !n.read
  ).length;

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
<<<<<<< HEAD
      <div className="w-full max-w-4xl mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-900 font-[Poppins]">
          Notifications
        </h1>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
=======
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading notifications...</p>
        </motion.div>
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-xl"
              >
                <MdNotifications size={32} />
              </motion.div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Notifications
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Stay updated with important alerts and updates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center gap-2"
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
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {notifications.length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white group-hover:scale-110 transition-transform duration-300">
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
                <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {unreadCount}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white group-hover:scale-110 transition-transform duration-300">
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
                <p className="text-gray-600 text-sm font-medium mb-1">
                  High Priority
                </p>
                <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  {highPriorityCount}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white group-hover:scale-110 transition-transform duration-300">
                <MdWarning size={28} />
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
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-gray-700"
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
                className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors bg-white/50 backdrop-blur-sm"
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
                  !notification.read ? "ring-2 ring-blue-200" : ""
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
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                              {notification.sender?.avatar || "?"}
                            </div>
                            <span>
                              {notification.sender?.name || "Unknown"}
                            </span>
                          </div>
                          <span>{formatTimestamp(notification.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => markAsRead(notification._id, e)}
                              disabled={markingAsRead === notification._id}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Mark as read"
                            >
                              {markingAsRead === notification._id ? (
                                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <MdMarkEmailRead size={18} />
                              )}
                            </motion.button>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) =>
                              deleteNotification(notification._id, e)
                            }
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            onClick={() => setSelectedNotification(null)}
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
                    onClick={() => setSelectedNotification(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                    title="Close"
                  >
                    <MdDelete size={24} />
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                          {selectedNotification.sender?.avatar || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedNotification.sender?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedNotification.sender?.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Priority
                      </h3>
                      <span
                        className={`px-3 py-2 rounded-full text-sm font-semibold border ${getPriorityColor(
                          selectedNotification.priority || "low"
                        )}`}
                      >
                        {(selectedNotification.priority || "low").toUpperCase()}
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
                            setSelectedNotification(null);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300"
                        >
                          Mark as Read
                        </motion.button>
                      )}

                      {selectedNotification.actionUrl && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            // Navigate to action URL
                            window.location.href =
                              selectedNotification.actionUrl;
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300"
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
                        setSelectedNotification(null);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300"
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
    </div>
  );
};

export default Notifications;
