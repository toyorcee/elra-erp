import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiTicket,
  HiUser,
  HiCalendar,
  HiClock,
  HiCheckCircle,
  HiExclamationTriangle,
  HiChatBubbleOvalLeftEllipsis,
  HiEye,
  HiPencil,
  HiTrash,
  HiArrowPath,
} from "react-icons/hi2";
import {
  complaintAPI,
  complaintUtils,
} from "../../../../services/customerCareAPI";
import { toast } from "react-toastify";

const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const response = await complaintAPI.getComplaints({
          page: 1,
          limit: 20,
          sortBy: "submittedAt",
          sortOrder: "desc",
        });

        if (response.success) {
          setComplaints(response.data.complaints);
        } else {
          toast.error("Failed to load complaints");
        }
      } catch (error) {
        console.error("Error fetching complaints:", error);
        toast.error("Failed to load complaints");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const getStatusColor = (status) => {
    const statusInfo = complaintUtils.formatStatus(status);
    return statusInfo.bgColor;
  };

  const handleStatusUpdate = async (
    complaintId,
    newStatus,
    resolution = null
  ) => {
    try {
      const response = await complaintAPI.updateComplaintStatus(complaintId, {
        status: newStatus,
        resolution: resolution,
      });

      if (response.success) {
        toast.success("Complaint status updated successfully");
        // Refresh complaints list
        const refreshResponse = await complaintAPI.getComplaints({
          page: 1,
          limit: 20,
          sortBy: "submittedAt",
          sortOrder: "desc",
        });
        if (refreshResponse.success) {
          setComplaints(refreshResponse.data.complaints);
        }
      } else {
        toast.error("Failed to update complaint status");
      }
    } catch (error) {
      console.error("Error updating complaint status:", error);
      toast.error("Failed to update complaint status");
    }
  };

  const handleAddNote = async (complaintId, note) => {
    try {
      const response = await complaintAPI.addComplaintNote(complaintId, {
        note,
      });

      if (response.success) {
        toast.success("Note added successfully");
        // Refresh complaints list
        const refreshResponse = await complaintAPI.getComplaints({
          page: 1,
          limit: 20,
          sortBy: "submittedAt",
          sortOrder: "desc",
        });
        if (refreshResponse.success) {
          setComplaints(refreshResponse.data.complaints);
        }
      } else {
        toast.error("Failed to add note");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  const getPriorityColor = (priority) => {
    const priorityInfo = complaintUtils.formatPriority(priority);
    return priorityInfo.bgColor;
  };

  const handleStatusChange = (complaintId, newStatus) => {
    setComplaints((prev) =>
      prev.map((complaint) =>
        complaint.id === complaintId
          ? {
              ...complaint,
              status: newStatus,
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : complaint
      )
    );
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
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Complaint Management</h1>
        <p className="text-white/80">
          Manage and resolve staff complaints efficiently
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Total Complaints
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {complaints.length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <HiTicket className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg border border-yellow-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-900 mt-2">
                {complaints.filter((c) => c.status === "pending").length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl">
              <HiClock className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                In Progress
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {complaints.filter((c) => c.status === "in_progress").length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <HiArrowPath className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                Resolved
              </p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {complaints.filter((c) => c.status === "resolved").length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <HiCheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Complaints Management Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Complaints Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and update complaint status
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((complaint, index) => (
                <motion.tr
                  key={complaint.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                        <HiTicket className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {complaint.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {complaint.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {complaint.reporter}
                    </div>
                    <div className="text-sm text-gray-500">
                      {complaint.createdAt}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {complaint.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={complaint.status}
                      onChange={(e) =>
                        handleStatusChange(complaint.id, e.target.value)
                      }
                      className={`px-3 py-1 text-sm font-semibold rounded-full border-0 ${getStatusColor(
                        complaint.status
                      )}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(
                        complaint.priority
                      )}`}
                    >
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {complaint.assignedTo}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors">
                        <HiEye className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors">
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors">
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default ComplaintManagement;
