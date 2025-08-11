import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdLogout, MdWarning, MdClose } from "react-icons/md";

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm, user }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getUserInitial = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.name) return user.name[0].toUpperCase();
    return "U";
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.name || "User";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center"
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {/* White Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/95 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-200"
          style={{
            position: "relative",
            zIndex: 100000,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Header */}
          <div className="relative bg-[var(--elra-primary)] p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors duration-200"
            >
              <MdClose size={20} />
            </button>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <MdLogout size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Sign Out</h2>
                <p className="text-white/80 text-sm">Confirm your action</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* User Info */}
            <div className="flex items-center space-x-4 mb-6 p-4 bg-[var(--elra-secondary-3)] rounded-xl">
              <div className="w-12 h-12 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div className={user?.avatar ? "hidden" : ""}>
                  {getUserInitial()}
                </div>
              </div>
              <div>
                <div className="font-semibold text-[var(--elra-text-primary)]">
                  {getUserName()}
                </div>
                <div className="text-sm text-[var(--elra-text-secondary)]">
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="flex items-start space-x-3 p-4 bg-[var(--elra-secondary-3)] border border-[var(--elra-border-primary)] rounded-xl mb-6">
              <div className="w-6 h-6 bg-[var(--elra-primary)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <MdWarning size={14} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--elra-text-primary)] mb-1">
                  Are you sure you want to sign out?
                </h3>
                <p className="text-sm text-[var(--elra-text-secondary)]">
                  You will be logged out of your account and redirected to the
                  login page. Any unsaved work will be lost.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-[var(--elra-text-primary)] bg-[var(--elra-secondary-3)] hover:bg-[var(--elra-secondary-2)] rounded-xl font-medium transition-all duration-200 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <MdLogout size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LogoutConfirmationModal;
