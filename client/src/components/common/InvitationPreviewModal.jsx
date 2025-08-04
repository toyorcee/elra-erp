import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiX,
  HiOfficeBuilding,
  HiUserGroup,
  HiShieldCheck,
  HiSparkles,
  HiCheckCircle,
  HiArrowRight,
  HiUser,
} from "react-icons/hi";
import { invitationAPI } from "../../services/api";

const InvitationPreviewModal = ({
  isOpen,
  onClose,
  onProceed,
  invitationCode,
  previewData,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleProceed = () => {
    if (previewData) {
      onProceed(previewData);
    }
  };

  if (!previewData) {
    return null;
  }

  const { invitation } = previewData.data;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl border border-purple-500/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                    <HiSparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Welcome to {invitation.company.name}!
                    </h2>
                    <p className="text-purple-200 text-sm">
                      You're about to join our amazing team
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <HiX className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Company Info */}
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                    <HiOfficeBuilding className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">
                      {invitation.company.name}
                    </h3>
                    <p className="text-purple-200 text-sm">
                      {invitation.company.description ||
                        "Document Management System"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                      <HiShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-emerald-200 text-sm font-medium">
                        Your Role
                      </p>
                      <p className="text-white font-bold">
                        {invitation.role.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Department */}
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <HiUserGroup className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-blue-200 text-sm font-medium">
                        Department
                      </p>
                      <p className="text-white font-bold">
                        {invitation.department.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Position */}
              {invitation.position && (
                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                      <HiUser className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-orange-200 text-sm font-medium">
                        Position
                      </p>
                      <p className="text-white font-bold">
                        {invitation.position}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Features Preview */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-indigo-500/20">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <HiSparkles className="w-5 h-5 text-purple-400" />
                  <span>What you'll get access to:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <HiCheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-purple-200 text-sm">
                      Document Management
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HiCheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-purple-200 text-sm">
                      Team Collaboration
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HiCheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-purple-200 text-sm">
                      Workflow Automation
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HiCheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-purple-200 text-sm">
                      Secure Access
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invitation.notes && (
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20">
                  <p className="text-yellow-200 text-sm">
                    <strong>Note:</strong> {invitation.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-purple-500/20">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-transparent border border-purple-500/30 text-purple-200 rounded-xl hover:bg-purple-500/10 transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceed}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Proceed to Setup</span>
                      <HiArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InvitationPreviewModal;
