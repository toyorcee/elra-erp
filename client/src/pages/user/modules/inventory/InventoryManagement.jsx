import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  HiOutlineClipboardCheck,
  HiOutlineCube,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineDocumentText,
  HiOutlineQrcode,
  HiOutlineChartBar,
} from "react-icons/hi";

const InventoryManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workflowTasks, setWorkflowTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("workflow");

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Inventory Management.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is from Operations department
  const isOperationsDept = user.department?.name === "Operations";

  useEffect(() => {
    if (isOperationsDept) {
      fetchWorkflowTasks();
    } else {
      // For non-Operations departments, redirect to inventory list
      navigate("/dashboard/modules/inventory/list", { replace: true });
    }
  }, [isOperationsDept, navigate]);

  const fetchWorkflowTasks = async () => {
    try {
      const response = await fetch("/api/workflow-tasks/operations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflowTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching workflow tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId) => {
    try {
      const response = await fetch(`/api/workflow-tasks/${taskId}/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Refresh tasks
        fetchWorkflowTasks();
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <HiOutlineExclamation className="text-red-500" />;
      case "medium":
        return <HiOutlineClock className="text-yellow-500" />;
      case "low":
        return <HiOutlineCheckCircle className="text-green-500" />;
      default:
        return <HiOutlineClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  if (!isOperationsDept) {
    return null; // Will redirect
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Operations Dashboard
        </h1>
        <p className="text-gray-600">
          Manage inventory creation and workflow tasks for approved projects
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("workflow")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "workflow"
                ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <HiOutlineClipboardCheck className="inline mr-2" />
            Workflow Tasks
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "inventory"
                ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <HiOutlineCube className="inline mr-2" />
            Inventory Management
          </button>
        </nav>
      </div>

      {/* Workflow Tasks Tab */}
      {activeTab === "workflow" && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pending Workflow Tasks
            </h2>
            <p className="text-gray-600">
              Complete these tasks to proceed with inventory creation for
              approved projects
            </p>
          </div>

          {workflowTasks.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Pending Tasks
              </h3>
              <p className="text-gray-600">
                All workflow tasks are completed. You can manage inventory items
                below.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {workflowTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {getPriorityIcon(task.priority)}
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {task.title}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    {task.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Action Items:
                    </h4>
                    <ul className="space-y-1">
                      {task.actionItems?.map((item, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 flex items-center"
                        >
                          <HiOutlineCheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    <span>{task.estimatedHours}h estimated</span>
                  </div>

                  {task.status === "pending" && (
                    <button
                      onClick={() => handleTaskComplete(task._id)}
                      className="w-full bg-[var(--elra-primary)] text-white py-2 px-4 rounded-md hover:bg-[var(--elra-primary-dark)] transition-colors"
                    >
                      Start Task
                    </button>
                  )}

                  {task.status === "in_progress" && (
                    <button
                      onClick={() => handleTaskComplete(task._id)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Complete Task
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inventory Management Tab */}
      {activeTab === "inventory" && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Inventory Management
            </h2>
            <p className="text-gray-600">
              Manage inventory items, create equipment records, and track assets
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Core Workflow Task 1: Create Equipment Inventory Records */}
            <div
              onClick={() => navigate("/dashboard/modules/inventory/list")}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <HiOutlineCube className="h-8 w-8 text-[var(--elra-primary)] mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Equipment Inventory
              </h3>
              <p className="text-gray-600 text-sm">
                Create and manage equipment inventory records
              </p>
            </div>

            {/* Core Workflow Task 3: Set Up Asset Tracking System */}
            <div
              onClick={() => navigate("/dashboard/modules/inventory/assets")}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <HiOutlineQrcode className="h-8 w-8 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Asset Tracking
              </h3>
              <p className="text-gray-600 text-sm">
                Configure tracking and monitoring systems
              </p>
            </div>

            {/* Supporting Features */}
            <div
              onClick={() => navigate("/dashboard/modules/inventory/available")}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <HiOutlineCheckCircle className="h-8 w-8 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Available Items
              </h3>
              <p className="text-gray-600 text-sm">
                Check available inventory items
              </p>
            </div>

            <div
              onClick={() =>
                navigate("/dashboard/modules/inventory/maintenance")
              }
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <HiOutlineClock className="h-8 w-8 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Maintenance Schedule
              </h3>
              <p className="text-gray-600 text-sm">
                Manage equipment maintenance schedules
              </p>
            </div>

            <div
              onClick={() => navigate("/dashboard/modules/inventory/reports")}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <HiOutlineChartBar className="h-8 w-8 text-purple-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Reports
              </h3>
              <p className="text-gray-600 text-sm">
                View inventory reports and analytics
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
