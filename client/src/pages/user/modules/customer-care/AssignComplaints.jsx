import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiUserGroup,
  HiUser,
  HiCheckCircle,
  HiChatBubbleOvalLeftEllipsis,
  HiEye,
  HiXMark,
} from "react-icons/hi2";
import {
  complaintAPI,
  complaintUtils,
} from "../../../../services/customerCareAPI";
import { toast } from "react-toastify";

const AssignComplaints = () => {
  const [unassignedComplaints, setUnassignedComplaints] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const complaintsResponse = await complaintAPI.getComplaints({
          page: 1,
          limit: 50,
          sortBy: "submittedAt",
          sortOrder: "desc",
          status: "pending",
        });

        if (complaintsResponse.success) {
          const unassigned = complaintsResponse.data.complaints.filter(
            (complaint) => !complaint.assignedTo
          );
          setUnassignedComplaints(unassigned);
        } else {
          toast.error("Failed to load complaints");
        }

        const teamResponse = await complaintAPI.getTeamMembers();

        if (teamResponse.success) {
          setTeamMembers(teamResponse.data);
        } else {
          toast.error("Failed to load team members");
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

  const handleAssignComplaint = async (complaintId, assigneeId) => {
    try {
      setAssigning(true);

      const response = await complaintAPI.assignComplaint(complaintId, {
        assignedTo: assigneeId,
        assignedBy: "current_user", // This will be set by the backend
      });

      if (response.success) {
        toast.success("Complaint assigned successfully!");

        // Remove the assigned complaint from the list
        setUnassignedComplaints((prev) =>
          prev.filter((complaint) => complaint._id !== complaintId)
        );
      } else {
        toast.error("Failed to assign complaint");
      }
    } catch (error) {
      console.error("Error assigning complaint:", error);
      toast.error("Failed to assign complaint");
    } finally {
      setAssigning(false);
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    const statusInfo = complaintUtils.formatStatus(status);
    return statusInfo.bgColor;
  };

  const getPriorityColor = (priority) => {
    const priorityInfo = complaintUtils.formatPriority(priority);
    return priorityInfo.bgColor;
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
            <HiUserGroup className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Assign Complaints</h1>
            <p className="text-white/80">
              Assign pending complaints to your team members
            </p>
          </div>
        </div>
      </div>

      {/* Team Members Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Available Team Members
          </h2>
          <div className="text-sm text-gray-500">
            {teamMembers.length} assignable staff
          </div>
        </div>
        {teamMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.2 + index * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                whileHover={{
                  scale: 1.02,
                  y: -2,
                  transition: { duration: 0.2 },
                }}
                className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
              >
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <HiUser className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{member.role?.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Level {member.role?.level}
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {member.assignedComplaints || 0} assigned
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
          >
            <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4">
              <HiUser className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Team Members Available
            </h3>
            <p className="text-gray-600 mb-4">
              There are no Customer Care staff members below your level to
              assign complaints to.
            </p>
            <p className="text-sm text-gray-500">
              You may need to add Customer Care staff members to your
              department.
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Unassigned Complaints */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Unassigned Complaints ({unassignedComplaints.length})
        </h2>

        {unassignedComplaints.length > 0 ? (
          <div className="space-y-4">
            {unassignedComplaints.map((complaint, index) => (
              <motion.div
                key={complaint._id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  delay: 0.3 + index * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                whileHover={{
                  scale: 1.01,
                  y: -2,
                  transition: { duration: 0.2 },
                }}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <HiChatBubbleOvalLeftEllipsis className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {complaint.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Submitted by: {complaint.submittedBy?.firstName}{" "}
                      {complaint.submittedBy?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Department: {complaint.department?.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted:{" "}
                      {new Date(complaint.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                      complaint.status
                    )}`}
                  >
                    {complaintUtils.formatStatus(complaint.status).label}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(
                      complaint.priority
                    )}`}
                  >
                    {complaintUtils.formatPriority(complaint.priority).label}
                  </span>

                  {/* Assignment Dropdown */}
                  <motion.div
                    className="flex items-center space-x-3"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignComplaint(complaint._id, e.target.value);
                        }
                      }}
                      disabled={assigning}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all duration-200 min-w-[200px]"
                    >
                      <option value="">🎯 Assign to...</option>
                      {teamMembers.map((member) => (
                        <option key={member._id} value={member._id}>
                          👤 {member.firstName} {member.lastName} (
                          {member.role?.name || "Staff"})
                        </option>
                      ))}
                    </select>

                    <motion.button
                      onClick={() => handleViewDetails(complaint)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-[var(--elra-primary)] transition-colors bg-gray-100 hover:bg-blue-100 rounded-lg"
                      title="View Details"
                    >
                      <HiEye className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.5,
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
          >
            <motion.div
              className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <HiCheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🎉 All complaints assigned!
            </h3>
            <p className="text-gray-600 mb-4">
              There are no unassigned complaints at the moment. All pending
              complaints have been assigned to team members.
            </p>
            <motion.div
              className="text-sm text-gray-500"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Great job managing the workload! 👏
            </motion.div>
          </motion.div>
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
    </div>
  );
};

export default AssignComplaints;
