import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const AttachmentModal = ({
  isOpen,
  onClose,
  attachments = [],
  title = "Attachments",
}) => {
  if (!isOpen || !attachments || attachments.length === 0) return null;

  const getFileIcon = (type) => {
    if (type === "application/pdf") {
      return <DocumentTextIcon className="h-6 w-6 text-red-600" />;
    } else if (type?.startsWith("image/")) {
      return <PhotoIcon className="h-6 w-6 text-blue-600" />;
    } else {
      return <DocumentIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const getFileTypeColor = (type) => {
    if (type === "application/pdf") {
      return "bg-red-50 border-red-200 hover:bg-red-100";
    } else if (type?.startsWith("image/")) {
      return "bg-blue-50 border-blue-200 hover:bg-blue-100";
    } else {
      return "bg-gray-50 border-gray-200 hover:bg-gray-100";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleOpenAttachment = (attachment) => {
    if (attachment.documentId || attachment._id) {
      const documentId = attachment.documentId || attachment._id;
      window.open(`/api/documents/${documentId}/view`, "_blank");
    }
  };

  const handleDownloadAttachment = (attachment, e) => {
    e.stopPropagation();
    if (attachment.documentId || attachment._id) {
      const documentId = attachment.documentId || attachment._id;
      window.open(`/api/documents/${documentId}/view`, "_blank");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-6 w-6" />
                  <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-sm opacity-90">
                      {attachments.length} file
                      {attachments.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-3">
                  {attachments.map((attachment, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${getFileTypeColor(
                        attachment.type
                      )}`}
                      onClick={() => handleOpenAttachment(attachment)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {getFileIcon(attachment.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {attachment.name || `Attachment ${index + 1}`}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                              <span className="font-medium">
                                {attachment.type === "application/pdf"
                                  ? "PDF Document"
                                  : attachment.type?.startsWith("image/")
                                  ? "Image"
                                  : "Document"}
                              </span>
                              <span>•</span>
                              <span>
                                {attachment.size
                                  ? formatFileSize(attachment.size)
                                  : "Unknown size"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) =>
                              handleDownloadAttachment(attachment, e)
                            }
                            className="p-2 text-gray-500 hover:text-[var(--elra-primary)] hover:bg-white rounded-lg transition-colors"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                          <div className="px-3 py-1 bg-[var(--elra-primary)] text-white text-sm font-medium rounded-lg">
                            View
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        How to view attachments
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Click on any attachment to open it in a new tab, or use
                        the download button to save it to your device.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AttachmentModal;
