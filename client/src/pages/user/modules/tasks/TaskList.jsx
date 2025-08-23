import React, { useState, useEffect } from "react";
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { fetchTasks, createTask, updateTask, deleteTask } from "../../../../services/taskAPI.js";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";

const TaskList = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    assignedTo: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    assignedTo: "",
    priority: "medium",
    status: "pending",
    project: "",
  });

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access Task List.</p>
        </div>
      </div>
    );
  }

  const taskPriorities = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High", color: "bg-red-100 text-red-800" },
  ];

  const taskStatuses = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending", color: "bg-gray-100 text-gray-800" },
    { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-800" },
    { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
    { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-800" },
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetchTasks();
      if (response.success) {
        setTasks(response.data);
      } else {
        toast.error("Failed to load tasks");
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Error loading tasks");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = taskPriorities.find(p => p.value === priority);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig?.color || 'bg-gray-100 text-gray-800'}`}>
        {priorityConfig?.label || priority}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = taskStatuses.find(s => s.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusConfig?.label || status}
      </span>
    );
  };

  const columns = [
    {
      header: "Task",
      accessor: "title",
      cell: (task) => (
        <div className="flex items-center">
          <ClipboardDocumentListIcon className="h-5 w-5 text-blue-500 mr-2" />
          <div>
            <div className="font-medium text-gray-900">{task.title}</div>
            <div className="text-sm text-gray-500">{task.description?.substring(0, 50)}...</div>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (task) => getStatusBadge(task.status),
    },
    {
      header: "Priority",
      accessor: "priority",
      cell: (task) => getPriorityBadge(task.priority),
    },
    {
      header: "Assigned To",
      accessor: "assignedTo",
      cell: (task) => (
        <div className="flex items-center">
          <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{task.assignedTo?.name || "Unassigned"}</span>
        </div>
      ),
    },
    {
      header: "Due Date",
      accessor: "dueDate",
      cell: (task) => (
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm text-gray-900">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (task) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedTask(task);
              setFormData({
                title: task.title,
                description: task.description,
                dueDate: task.dueDate.split('T')[0],
                assignedTo: task.assignedTo?._id || "",
                priority: task.priority,
                status: task.status,
                project: task.project?._id || "",
              });
              setShowEditModal(true);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Edit Task"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteTask(task._id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete Task"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await deleteTask(taskId);
      if (response.success) {
        toast.success("Task deleted successfully");
        loadTasks();
      } else {
        toast.error(response.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Error deleting task");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Task List</h1>
            <p className="text-gray-600">Create, assign, and track tasks across projects</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Task
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              >
                {taskStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              >
                {taskPriorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <DataTable
            data={tasks}
            columns={columns}
            searchTerm={searchTerm}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskList;
