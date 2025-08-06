import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import {
  canViewWorkflows,
  canCreateWorkflows,
  canStartWorkflows,
  canApproveWorkflows,
  canRejectWorkflows,
  canDelegateWorkflows,
} from "../../constants/userRoles";
import {
  MdAssignment,
  MdDescription,
  MdSecurity,
  MdTrendingUp,
  MdPeople,
  MdSpeed,
  MdWork,
  MdStar,
  MdSchedule,
  MdPerson,
  MdArrowForward,
  MdAdd,
  MdSearch,
  MdRefresh,
  MdError,
} from "react-icons/md";

const Workflows = () => {
  const { user } = useAuth();

  // Permission checks
  const hasViewPermission = canViewWorkflows(user);
  const hasCreatePermission = canCreateWorkflows(user);
  const hasStartPermission = canStartWorkflows(user);
  const hasApprovePermission = canApproveWorkflows(user);
  const hasRejectPermission = canRejectWorkflows(user);
  const hasDelegatePermission = canDelegateWorkflows(user);

  // Redirect if user doesn't have view permission
  if (!hasViewPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl text-center">
          <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to view workflows.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator to request workflow access.
          </p>
        </div>
      </div>
    );
  }

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");

  const departmentConfig = {
    CLAIMS: {
      name: "Claims Department",
      icon: MdDescription,
      color: "from-blue-500 to-cyan-500",
      workflows: [
        {
          id: 1,
          title: "Claims Processing Workflow",
          description: "Standard workflow for processing insurance claims",
          status: "active",
          priority: "high",
          assignedTo: "Claims Team",
          dueDate: "2024-01-15",
          progress: 75,
          steps: [
            { name: "Initial Review", status: "completed" },
            { name: "Documentation", status: "completed" },
            { name: "Assessment", status: "in-progress" },
            { name: "Approval", status: "pending" },
          ],
        },
        {
          id: 2,
          title: "Damage Assessment Workflow",
          description: "Workflow for assessing property damage claims",
          status: "pending",
          priority: "medium",
          assignedTo: "Assessment Team",
          dueDate: "2024-01-20",
          progress: 30,
          steps: [
            { name: "Site Visit", status: "completed" },
            { name: "Documentation", status: "in-progress" },
            { name: "Evaluation", status: "pending" },
            { name: "Report", status: "pending" },
          ],
        },
      ],
    },
    UNDERWRITE: {
      name: "Underwriting Department",
      icon: MdSecurity,
      color: "from-purple-500 to-pink-500",
      workflows: [
        {
          id: 1,
          title: "Policy Underwriting Workflow",
          description: "Workflow for underwriting new insurance policies",
          status: "active",
          priority: "high",
          assignedTo: "Underwriting Team",
          dueDate: "2024-01-18",
          progress: 60,
          steps: [
            { name: "Application Review", status: "completed" },
            { name: "Risk Assessment", status: "in-progress" },
            { name: "Policy Creation", status: "pending" },
            { name: "Final Approval", status: "pending" },
          ],
        },
      ],
    },
    FINANCE: {
      name: "Finance Department",
      icon: MdTrendingUp,
      color: "from-green-500 to-emerald-500",
      workflows: [
        {
          id: 1,
          title: "Budget Approval Workflow",
          description: "Workflow for approving department budgets",
          status: "active",
          priority: "urgent",
          assignedTo: "Finance Team",
          dueDate: "2024-01-10",
          progress: 90,
          steps: [
            { name: "Budget Review", status: "completed" },
            { name: "Department Approval", status: "completed" },
            { name: "Finance Review", status: "completed" },
            { name: "Executive Approval", status: "in-progress" },
          ],
        },
      ],
    },
    COMPLIANCE: {
      name: "Compliance Department",
      icon: MdSecurity,
      color: "from-red-500 to-orange-500",
      workflows: [
        {
          id: 1,
          title: "Compliance Review Workflow",
          description: "Workflow for reviewing regulatory compliance",
          status: "active",
          priority: "high",
          assignedTo: "Compliance Team",
          dueDate: "2024-01-25",
          progress: 45,
          steps: [
            { name: "Document Review", status: "completed" },
            { name: "Compliance Check", status: "in-progress" },
            { name: "Risk Assessment", status: "pending" },
            { name: "Final Report", status: "pending" },
          ],
        },
      ],
    },
    HR: {
      name: "HR Department",
      icon: MdPeople,
      color: "from-indigo-500 to-purple-500",
      workflows: [
        {
          id: 1,
          title: "Employee Onboarding Workflow",
          description: "Workflow for new employee onboarding process",
          status: "active",
          priority: "medium",
          assignedTo: "HR Team",
          dueDate: "2024-01-22",
          progress: 80,
          steps: [
            { name: "Documentation", status: "completed" },
            { name: "System Setup", status: "completed" },
            { name: "Training", status: "in-progress" },
            { name: "Final Review", status: "pending" },
          ],
        },
      ],
    },
    IT: {
      name: "IT Department",
      icon: MdSpeed,
      color: "from-cyan-500 to-blue-500",
      workflows: [
        {
          id: 1,
          title: "System Maintenance Workflow",
          description: "Workflow for system maintenance and updates",
          status: "active",
          priority: "high",
          assignedTo: "IT Team",
          dueDate: "2024-01-12",
          progress: 70,
          steps: [
            { name: "System Check", status: "completed" },
            { name: "Update Preparation", status: "completed" },
            { name: "Implementation", status: "in-progress" },
            { name: "Testing", status: "pending" },
          ],
        },
      ],
    },
    REGIONAL: {
      name: "Regional Operations",
      icon: MdWork,
      color: "from-amber-500 to-orange-500",
      workflows: [
        {
          id: 1,
          title: "Regional Report Workflow",
          description: "Workflow for regional operations reporting",
          status: "active",
          priority: "medium",
          assignedTo: "Regional Team",
          dueDate: "2024-01-28",
          progress: 55,
          steps: [
            { name: "Data Collection", status: "completed" },
            { name: "Analysis", status: "in-progress" },
            { name: "Report Creation", status: "pending" },
            { name: "Submission", status: "pending" },
          ],
        },
      ],
    },
    EXECUTIVE: {
      name: "Executive Management",
      icon: MdStar,
      color: "from-gray-600 to-gray-800",
      workflows: [
        {
          id: 1,
          title: "Strategic Planning Workflow",
          description: "Workflow for strategic planning and decision making",
          status: "active",
          priority: "urgent",
          assignedTo: "Executive Team",
          dueDate: "2024-01-30",
          progress: 40,
          steps: [
            { name: "Data Analysis", status: "completed" },
            { name: "Strategy Development", status: "in-progress" },
            { name: "Stakeholder Review", status: "pending" },
            { name: "Final Approval", status: "pending" },
          ],
        },
      ],
    },
  };

  const currentDept = departmentConfig[user?.department?.code] || {
    name: "Workflows",
    icon: MdAssignment,
    color: "from-gray-500 to-gray-700",
    workflows: [],
  };

  const DeptIcon = currentDept.icon;
  const workflows = currentDept.workflows;

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "completed":
        return "text-blue-600 bg-blue-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-blue-600 bg-blue-100";
      case "low":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStepStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in-progress":
        return "text-blue-600";
      case "pending":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const filteredWorkflows = workflows.filter((workflow) => {
    if (selectedStatus !== "all" && workflow.status !== selectedStatus) {
      return false;
    }
    if (selectedPriority !== "all" && workflow.priority !== selectedPriority) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-r ${currentDept.color} text-white shadow-lg`}
              >
                <DeptIcon size={28} />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {currentDept.name} Workflows
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and track workflow processes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center gap-2">
                <MdAdd size={20} />
                New Workflow
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MdSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search workflows..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <button className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <MdRefresh size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Workflows Grid */}
        {filteredWorkflows.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-12 border border-white/20 shadow-xl text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Workflows Found
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedStatus !== "all" || selectedPriority !== "all"
                ? "Try adjusting your filters."
                : "No workflows are currently active for your department."}
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300">
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredWorkflows.map((workflow, index) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {workflow.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {workflow.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          workflow.status
                        )}`}
                      >
                        {workflow.status}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                          workflow.priority
                        )}`}
                      >
                        {workflow.priority}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{workflow.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${workflow.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Workflow Steps */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Workflow Steps
                    </h4>
                    <div className="space-y-2">
                      {workflow.steps.map((step, stepIndex) => (
                        <div
                          key={stepIndex}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              step.status === "completed"
                                ? "bg-green-500"
                                : step.status === "in-progress"
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          />
                          <span
                            className={`text-sm ${getStepStatusColor(
                              step.status
                            )}`}
                          >
                            {step.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MdPerson size={16} />
                        <span>{workflow.assignedTo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MdSchedule size={16} />
                        <span>
                          Due: {new Date(workflow.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <MdArrowForward size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Workflows;
