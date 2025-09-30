import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiClipboardDocumentList,
  HiChatBubbleOvalLeftEllipsis,
  HiEye,
  HiPencil,
  HiArrowPath,
  HiUser,
  HiXMark,
  HiCheckCircle,
  HiExclamationTriangle,
} from "react-icons/hi2";
import {
  complaintAPI,
  complaintUtils,
} from "../../../../services/customerCareAPI";
import { toast } from "react-toastify";

const MyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSendToHODModal, setShowSendToHODModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sendingToHOD, setSendingToHOD] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const assignmentsResponse = await complaintAPI.getComplaints({
          page: 1,
          limit: 20,
          sortBy: "submittedAt",
          sortOrder: "desc",
          assignedToMe: true,
        });

        if (assignmentsResponse.success) {
          setAssignments(assignmentsResponse.data.complaints);
        } else {
          toast.error("Failed to load assignments");
        }

        const departmentsResponse = await complaintAPI.getDepartmentsWithHODs();
        if (departmentsResponse.success) {
          setDepartments(departmentsResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status) => {
    const statusInfo = complaintUtils.formatStatus(status);
    return statusInfo.bgColor;
  };

  const getPriorityColor = (priority) => {
    const priorityInfo = complaintUtils.formatPriority(priority);
    return priorityInfo.bgColor;
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = (complaint) => {
    setSelectedComplaint(complaint);
    setShowStatusModal(true);
  };

  const handleSendToHOD = (complaint) => {
    setSelectedComplaint(complaint);
    setShowSendToHODModal(true);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedComplaint) return;

    try {
      setUpdatingStatus(true);
      const response = await complaintAPI.updateComplaintStatus(
        selectedComplaint._id,
        {
          status: newStatus,
        }
      );

      if (response.success) {
        toast.success(`Complaint status updated to ${newStatus}`);
        setAssignments((prev) =>
          prev.map((complaint) =>
            complaint._id === selectedComplaint._id
              ? { ...complaint, status: newStatus }
              : complaint
          )
        );
        setShowStatusModal(false);
        setSelectedComplaint(null);
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendToHODSubmit = async () => {
    if (!selectedComplaint || !selectedDepartment) return;

    try {
      setSendingToHOD(true);

      const selectedDept = departments.find(
        (dept) => dept._id === selectedDepartment
      );
      if (!selectedDept || !selectedDept.hod) {
        toast.error("Selected department has no HOD");
        return;
      }

      const response = await complaintAPI.sendComplaintToHOD(
        selectedComplaint._id,
        {
          targetDepartmentId: selectedDepartment,
          targetHODId: selectedDept.hod._id,
          message: `Complaint #${selectedComplaint.complaintNumber} has been forwarded to your department for review.`,
        }
      );

      if (response.success) {
        toast.success(
          `Complaint details sent to ${selectedDept.hod.firstName} ${selectedDept.hod.lastName} (${selectedDept.name} HOD)`
        );
        setShowSendToHODModal(false);
        setSelectedComplaint(null);
        setSelectedDepartment("");
      } else {
        toast.error("Failed to send complaint to HOD");
      }
    } catch (error) {
      console.error("Error sending to HOD:", error);
      toast.error("Failed to send to HOD");
    } finally {
      setSendingToHOD(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-full">
            <HiClipboardDocumentList className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">My Assignments</h1>
            <p className="text-white/80">
              Complaints assigned to you by Customer Care HODs
            </p>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Assigned Complaints ({assignments.length})
        </h2>

        {assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment, index) => (
              <motion.div
                key={assignment._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <HiChatBubbleOvalLeftEllipsis className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Submitted by: {assignment.submittedBy?.firstName}{" "}
                      {assignment.submittedBy?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Department: {assignment.department?.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Assigned:{" "}
                      {new Date(
                        assignment.assignedAt || assignment.submittedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                      assignment.status
                    )}`}
                  >
                    {complaintUtils.formatStatus(assignment.status).label}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(
                      assignment.priority
                    )}`}
                  >
                    {complaintUtils.formatPriority(assignment.priority).label}
                  </span>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={() => handleViewDetails(assignment)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-[var(--elra-primary)] transition-colors bg-gray-100 hover:bg-blue-100 rounded-lg"
                      title="View Details"
                    >
                      <HiEye className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleUpdateStatus(assignment)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors bg-gray-100 hover:bg-green-100 rounded-lg"
                      title="Update Status"
                    >
                      <HiArrowPath className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleSendToHOD(assignment)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-purple-600 transition-colors bg-gray-100 hover:bg-purple-100 rounded-lg"
                      title="Send to HOD"
                    >
                      <HiUser className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
              <HiClipboardDocumentList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No assignments yet
            </h3>
            <p className="text-gray-600 mb-4">
              You don't have any complaints assigned to you yet. Your HOD will
              assign complaints to you as they come in.
            </p>
          </div>
        )}
      </motion.div>

      {/* View Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-full">
                    <HiChatBubbleOvalLeftEllipsis className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Complaint Details</h2>
                    <p className="text-white/80">
                      #{selectedComplaint.complaintNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status and Priority Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-semibold text-yellow-800">
                      Status
                    </span>
                  </div>
                  <p className="text-lg font-bold text-yellow-900 mt-1">
                    {
                      complaintUtils.formatStatus(selectedComplaint.status)
                        .label
                    }
                  </p>
                </div>
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-semibold text-red-800">Priority</span>
                  </div>
                  <p className="text-lg font-bold text-red-900 mt-1">
                    {
                      complaintUtils.formatPriority(selectedComplaint.priority)
                        .label
                    }
                  </p>
                </div>
              </div>

              {/* Complaint Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Title
                  </h3>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
                    {selectedComplaint.title}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Submitted By
                  </h3>
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {selectedComplaint.submittedBy?.firstName?.charAt(0)}
                        {selectedComplaint.submittedBy?.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedComplaint.submittedBy?.firstName}{" "}
                        {selectedComplaint.submittedBy?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedComplaint.department?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Submitted Date
                  </h3>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
                    {new Date(selectedComplaint.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 rounded-b-2xl p-4 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedComplaint && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Update Status
              </h3>
              <p className="text-gray-600 mb-6">
                Current status:{" "}
                <span className="font-semibold">
                  {selectedComplaint.status}
                </span>
              </p>

              <div className="space-y-3">
                {["in_progress", "pending", "resolved", "closed"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={updatingStatus}
                      className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            status === "resolved"
                              ? "bg-green-500"
                              : status === "closed"
                              ? "bg-gray-500"
                              : status === "in_progress"
                              ? "bg-blue-500"
                              : "bg-yellow-500"
                          }`}
                        ></div>
                        <span className="font-medium capitalize">
                          {status.replace("_", " ")}
                        </span>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-b-2xl p-4 flex justify-end">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Send to HOD Modal */}
      {showSendToHODModal && selectedComplaint && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Send to Department HOD
              </h3>
              <p className="text-gray-600 mb-6">
                Send complaint details to a department HOD for review.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  >
                    <option value="">Choose a department...</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}{" "}
                        {dept.hod
                          ? `(HOD: ${dept.hod.firstName} ${dept.hod.lastName})`
                          : "(No HOD)"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-b-2xl p-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowSendToHODModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendToHODSubmit}
                disabled={!selectedDepartment || sendingToHOD}
                className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50"
              >
                {sendingToHOD ? "Sending..." : "Send"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MyAssignments;
