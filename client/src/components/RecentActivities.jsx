import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  HiDocumentText,
  HiUser,
  HiCog6Tooth,
  HiShieldCheck,
  HiCheckCircle,
  HiXCircle,
  HiEye,
  HiPencil,
  HiTrash,
  HiArrowUpTray,
  HiClock,
  HiMagnifyingGlass,
  HiDocumentDuplicate,
  HiUserPlus,
  HiArrowPath,
  HiArrowLeftOnRectangle,
  HiArrowRightOnRectangle,
  HiKey,
  HiBuildingOffice,
  HiEnvelope,
  HiArrowDownTray,
  HiShare,
  HiLockOpen,
  HiLockClosed,
  HiWrenchScrewdriver,
} from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";

const RecentActivities = ({
  userRole = "all",
  maxItems = 10,
  showFilters = true,
  compact = false,
}) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  // Activity type configurations
  const activityTypes = {
    document: {
      icon: HiDocumentText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    user: {
      icon: HiUser,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    workflow: {
      icon: HiCog6Tooth,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    approval: {
      icon: HiShieldCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    system: {
      icon: HiCog6Tooth,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
    },
  };

  // Action type configurations
  const actionTypes = {
    USER_LOGIN: {
      icon: HiArrowRightOnRectangle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      label: "User Login",
    },
    USER_LOGOUT: {
      icon: HiArrowLeftOnRectangle,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      label: "User Logout",
    },
    USER_CREATED: {
      icon: HiUserPlus,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      label: "User Created",
    },
    USER_UPDATED: {
      icon: HiPencil,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      label: "User Updated",
    },
    USER_DELETED: {
      icon: HiTrash,
      color: "text-red-600",
      bgColor: "bg-red-100",
      label: "User Deleted",
    },
    USER_ROLE_CHANGED: {
      icon: HiKey,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      label: "Role Changed",
    },
    USER_DEPARTMENT_CHANGED: {
      icon: HiBuildingOffice,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      label: "Department Changed",
    },
    INVITATION_CREATED: {
      icon: HiEnvelope,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      label: "Invitation Sent",
    },
    INVITATION_RESENT: {
      icon: HiArrowPath,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      label: "Invitation Resent",
    },
    INVITATION_USED: {
      icon: HiCheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      label: "Invitation Used",
    },
    INVITATION_CANCELLED: {
      icon: HiXCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      label: "Invitation Cancelled",
    },
    DOCUMENT_UPLOADED: {
      icon: HiArrowUpTray,
      color: "text-green-600",
      bgColor: "bg-green-100",
      label: "Document Uploaded",
    },
    DOCUMENT_DOWNLOADED: {
      icon: HiArrowDownTray,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      label: "Document Downloaded",
    },
    DOCUMENT_DELETED: {
      icon: HiTrash,
      color: "text-red-600",
      bgColor: "bg-red-100",
      label: "Document Deleted",
    },
    DOCUMENT_SHARED: {
      icon: HiShare,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      label: "Document Shared",
    },
    PERMISSION_GRANTED: {
      icon: HiLockOpen,
      color: "text-green-600",
      bgColor: "bg-green-100",
      label: "Permission Granted",
    },
    PERMISSION_REVOKED: {
      icon: HiLockClosed,
      color: "text-red-600",
      bgColor: "bg-red-100",
      label: "Permission Revoked",
    },
    SETTINGS_UPDATED: {
      icon: HiCog6Tooth,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      label: "Settings Updated",
    },
    SYSTEM_MAINTENANCE: {
      icon: HiWrenchScrewdriver,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      label: "System Maintenance",
    },
  };

  useEffect(() => {
    fetchRecentActivities();
  }, [userRole, filter]);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);

      // Use the existing audit service
      const params = {
        limit: maxItems,
        ...(userRole !== "all" && { role: userRole }),
        ...(filter !== "all" && { resourceType: filter.toUpperCase() }),
      };

      const response = await fetch(
        `/api/audit/recent?${new URLSearchParams(params)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();
      setActivities(data.data || []);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      toast.error("Failed to load recent activities");
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activity) => {
    const actionConfig = actionTypes[activity.action] || actionTypes.UPDATED;
    return actionConfig.icon;
  };

  const getActivityColor = (activity) => {
    const actionConfig = actionTypes[activity.action] || actionTypes.UPDATED;
    return actionConfig.color;
  };

  const getActivityLabel = (activity) => {
    const actionConfig = actionTypes[activity.action] || actionTypes.UPDATED;
    return actionConfig.label;
  };

  const getActivityType = (activity) => {
    if (activity.documentType) return "document";
    if (activity.userId) return "user";
    if (activity.workflowId) return "workflow";
    if (activity.approvalLevel) return "approval";
    return "system";
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredActivities = activities.filter((activity) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        activity.details?.toLowerCase().includes(searchLower) ||
        activity.userName?.toLowerCase().includes(searchLower) ||
        activity.action?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <HiClock className="mr-2 text-blue-600" />
          Recent Activities
        </h3>
        {showFilters && (
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Activities</option>
              <option value="document">Documents</option>
              <option value="user">Users</option>
              <option value="workflow">Workflows</option>
              <option value="approval">Approvals</option>
              <option value="system">System</option>
            </select>
          </div>
        )}
      </div>

      {/* Search */}
      {showFilters && (
        <div className="relative">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HiClock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activities found</p>
          </div>
        ) : (
          filteredActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity);
            const color = getActivityColor(activity);
            const label = getActivityLabel(activity);
            const activityType = getActivityType(activity);

            return (
              <div
                key={activity._id || index}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  compact ? "py-2" : "py-3"
                } ${activityTypes[activityType]?.bgColor || "bg-white"} ${
                  activityTypes[activityType]?.borderColor || "border-gray-200"
                }`}
              >
                {/* Activity Icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    activityTypes[activityType]?.bgColor || "bg-gray-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${color}`}>{label}</p>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>

                  {!compact && (
                    <>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.details}
                      </p>

                      {activity.userName && (
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <HiUser className="w-3 h-3 mr-1" />
                          <span>{activity.userName}</span>
                        </div>
                      )}

                      {activity.ipAddress && (
                        <div className="text-xs text-gray-400 mt-1">
                          IP: {activity.ipAddress}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load More Button */}
      {filteredActivities.length >= maxItems && (
        <div className="text-center pt-4">
          <button
            onClick={fetchRecentActivities}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Load More Activities
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivities;
