import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiUserGroup,
  HiArrowLeft,
  HiHome,
  HiUser,
  HiCalendar,
  HiClock,
  HiCheckCircle,
  HiExclamationTriangle,
  HiChatBubbleOvalLeftEllipsis,
  HiEye,
  HiPencil,
  HiArrowRight,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch unassigned complaints
        const complaintsResponse = await complaintAPI.getComplaints({
          page: 1,
          limit: 50,
          sortBy: "submittedAt",
          sortOrder: "desc",
          status: "pending", // Only show pending complaints
        });

        if (complaintsResponse.success) {
          // Filter for unassigned complaints
          const unassigned = complaintsResponse.data.complaints.filter(
            (complaint) => !complaint.assignedTo
          );
          setUnassignedComplaints(unassigned);
        }

        // Fetch team members (Customer Care staff)
        const teamResponse = await complaintAPI.getTeamMembers();
        if (teamResponse.success) {
          setTeamMembers(teamResponse.data);
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
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <Link
          to="/dashboard/modules/customer-care"
          className="flex items-center space-x-1 hover:text-[var(--elra-primary)] transition-colors"
        >
          <HiHome className="w-4 h-4" />
          <span>Customer Care</span>
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Assign Complaints</span>
      </div>

      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
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
          <Link
            to="/dashboard/modules/customer-care"
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Team Members Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Team Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <div
              key={member._id}
              className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl"
            >
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <HiUser className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {member.firstName} {member.lastName}
                </h3>
                <p className="text-sm text-gray-600">{member.role?.name}</p>
                <p className="text-xs text-gray-500">
                  Level {member.role?.level} • {member.assignedComplaints || 0}{" "}
                  assigned
                </p>
              </div>
            </div>
          ))}
        </div>
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
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
                  <div className="flex items-center space-x-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignComplaint(complaint._id, e.target.value);
                        }
                      }}
                      disabled={assigning}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    >
                      <option value="">Assign to...</option>
                      {teamMembers.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.firstName} {member.lastName} (
                          {member.role?.name || "Staff"})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        // View complaint details
                        console.log("View complaint:", complaint._id);
                      }}
                      className="p-2 text-gray-400 hover:text-[var(--elra-primary)] transition-colors"
                      title="View Details"
                    >
                      <HiEye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
              <HiCheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              All complaints assigned!
            </h3>
            <p className="text-gray-600 mb-4">
              There are no unassigned complaints at the moment. All pending
              complaints have been assigned to team members.
            </p>
            <Link
              to="/dashboard/modules/customer-care"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-colors"
            >
              <HiHome className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AssignComplaints;
