import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { MdClose, MdDelete } from "react-icons/md";
import AttachmentModal from "./common/AttachmentModal";

const NotificationModal = ({
  notification,
  onClose,
  onMarkAsRead,
  onDelete,
}) => {
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  console.log("🔔 NotificationModal rendering with:", notification);
  if (!notification) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "PROJECT_CREATED":
        return "📋";
      case "PROJECT_UPDATED":
        return "📝";
      case "PROJECT_DELETED":
        return "🗑️";
      case "DOCUMENT_UPLOADED":
        return "📎";
      case "DOCUMENT_APPROVED":
        return "✅";
      case "DOCUMENT_REJECTED":
        return "❌";
      case "BUDGET_ALLOCATED":
        return "💰";
      case "BUDGET_EXCEEDED":
        return "⚠️";
      case "TASK_ASSIGNED":
        return "📋";
      case "TASK_STARTED":
        return "🚀";
      case "TASK_COMPLETED":
        return "✅";
      case "TASK_UPDATED":
        return "📝";
      case "TASK_OVERDUE":
        return "⏰";
      case "DEADLINE_APPROACHING":
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
      case "FUND_ADDITION":
        return "💰";
      case "ANNOUNCEMENT_CREATED":
        return "📢";
      case "ANNOUNCEMENT_UPDATED":
        return "📝";
      case "ANNOUNCEMENT_DELETED":
        return "🗑️";
      case "EVENT_CREATED":
        return "📅";
      case "EVENT_UPDATED":
        return "📝";
      case "EVENT_CANCELLED":
        return "❌";
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

  const getSenderDisplay = (sender) => {
    if (!sender) {
      return {
        name: "System",
        email: "system@elra.com",
        avatar: "ES",
      };
    }

    if (typeof sender === "string") {
      return {
        name: sender,
        email: "unknown@elra.com",
        avatar: sender.charAt(0).toUpperCase(),
      };
    }

    return {
      name:
        `${sender.firstName || ""} ${sender.lastName || ""}`.trim() ||
        "Unknown User",
      email: sender.email || "unknown@elra.com",
      avatar:
        `${sender.firstName?.[0] || ""}${
          sender.lastName?.[0] || ""
        }`.toUpperCase() || "U",
    };
  };

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
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
                <span className="text-3xl">
                  {getNotificationIcon(notification.type)}
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {notification.title}
                  </h2>
                  <p className="text-gray-600">
                    {formatTimestamp(notification.createdAt)}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 cursor-pointer"
                title="Close"
              >
                <MdClose size={24} />
              </motion.button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
                <p className="text-gray-700 leading-relaxed">
                  {notification.message}
                </p>
              </div>

              {/* Attachments Section */}
              {notification.data?.attachments &&
                notification.data.attachments.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">
                        Attachments ({notification.data.attachments.length})
                      </h3>
                      <button
                        onClick={() => setShowAttachmentModal(true)}
                        className="px-4 py-2 text-sm bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                      >
                        View All
                      </button>
                    </div>

                    {/* Quick preview of first 2 attachments */}
                    <div className="space-y-2">
                      {notification.data.attachments
                        .slice(0, 2)
                        .map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {attachment.type === "application/pdf" ? (
                                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                    <span className="text-red-600 font-bold text-sm">
                                      PDF
                                    </span>
                                  </div>
                                ) : attachment.type?.startsWith("image/") ? (
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600 font-bold text-sm">
                                      IMG
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-600 font-bold text-sm">
                                      DOC
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {attachment.name || `Attachment ${index + 1}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {attachment.size
                                    ? `${(attachment.size / 1024).toFixed(
                                        1
                                      )} KB`
                                    : "Unknown size"}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (attachment.url) {
                                  window.open(attachment.url, "_blank");
                                }
                              }}
                              className="px-3 py-1 text-sm bg-[var(--elra-primary)] text-white rounded-md hover:bg-[var(--elra-primary-dark)] transition-colors"
                            >
                              View
                            </button>
                          </div>
                        ))}

                      {/* Show "and X more" if there are more than 2 attachments */}
                      {notification.data.attachments.length > 2 && (
                        <div className="text-center py-2">
                          <span className="text-sm text-gray-500">
                            and {notification.data.attachments.length - 2} more
                            attachment
                            {notification.data.attachments.length - 2 > 1
                              ? "s"
                              : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sender</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--elra-primary)] flex items-center justify-center text-white font-bold">
                      {getSenderDisplay(notification.sender).avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getSenderDisplay(notification.sender).name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {getSenderDisplay(notification.sender).email}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                  <span className="px-3 py-2 rounded-full text-sm font-semibold border text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 border-[var(--elra-primary)]/20">
                    {notification.read ? "READ" : "UNREAD"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex gap-3">
                  {!notification.read && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onMarkAsRead(notification._id);
                        onClose();
                      }}
                      className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-300 cursor-pointer"
                    >
                      Mark as Read
                    </motion.button>
                  )}

                  {notification.actionUrl && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        window.location.href = notification.actionUrl;
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
                    onDelete(notification._id);
                    onClose();
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
    </AnimatePresence>
  );

  return createPortal(
    <>
      {modalContent}
      {/* Attachment Modal */}
      <AttachmentModal
        isOpen={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        attachments={notification.data?.attachments || []}
        title={`${notification.title} - Attachments`}
      />
    </>,
    document.body
  );
};

export default NotificationModal;
