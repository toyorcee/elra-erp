import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";
import { updateTaskStatus } from "../../../../services/taskAPI";
import { getMyProjectTasks } from "../../../../services/projectTaskService";
import { fetchMyProjects } from "../../../../services/projectAPI";
import {
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import DataTable from "../../../../components/common/DataTable";
import { GradientSpinner } from "../../../../components/common";

const MyProjectTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [updatingTask, setUpdatingTask] = useState(null);

  useEffect(() => {
    if (!user || !user.role || !user.department) {
      navigate("/dashboard/modules/self-service");
      return;
    }

    const userDepartment = user?.department?.name;
    const isProjectManagementHOD =
      user?.role?.level === 700 && userDepartment === "Project Management";

    if (!isProjectManagementHOD) {
      toast.error(
        "Access denied. This page is only available for Project Management HOD."
      );
      navigate("/dashboard/modules/self-service");
      return;
    }

    fetchMyProjectTasks();
    fetchMyProjectsData();
  }, [user, navigate]);

  const fetchMyProjectTasks = async () => {
    try {
      setLoading(true);
      const data = await getMyProjectTasks();
      setTasks(data.data.tasks || []);
    } catch (error) {
      console.error("Error fetching project tasks:", error);
      toast.error("Error loading project tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProjectsData = async () => {
    try {
      const data = await fetchMyProjects();
      setProjects(data.data.projects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const updateTaskStatusHandler = async (taskId, newStatus) => {
    try {
      setUpdatingTask(taskId);
      await updateTaskStatus(taskId, newStatus);
      toast.success("Task status updated successfully");

      // Optimistically update the task in the list
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId ? { ...task, status: newStatus } : task
        )
      );

      // Optionally refresh to get latest data
      setTimeout(() => {
        fetchMyProjectTasks();
      }, 500);
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Error updating task status");
    } finally {
      setUpdatingTask(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case "overdue":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && task.status === "pending") ||
      (filter === "completed" && task.status === "completed") ||
      (filter === "overdue" && task.status === "overdue");

    const matchesProject =
      selectedProject === "all" || task.project?._id === selectedProject;

    const matchesSearch =
      searchTerm === "" ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesProject && matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "dueDate", label: "Due Date" },
    { value: "title", label: "Title" },
    { value: "status", label: "Status" },
    { value: "priority", label: "Priority" },
  ];

  if (loading && tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gray-50 flex items-center justify-center"
      >
        <div className="text-center">
          <GradientSpinner size="lg" />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-gray-600"
          >
            Loading your project tasks...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    My Project Tasks
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage and track tasks from projects you're assigned to
                  </p>
                </div>
              </div>
              <div className="mt-4 lg:mt-0">
                <motion.button
                  onClick={fetchMyProjectTasks}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <motion.div
                    animate={loading ? { rotate: 360 } : {}}
                    transition={{
                      duration: 1,
                      repeat: loading ? Infinity : 0,
                      ease: "linear",
                    }}
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                  </motion.div>
                  Refresh
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="total"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <motion.div
                  className="p-3 bg-blue-100 rounded-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Tasks
                  </p>
                  <motion.p
                    key={tasks.length}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-gray-900"
                  >
                    {tasks.length}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <motion.div
                  className="p-3 bg-yellow-100 rounded-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <motion.p
                    key={tasks.filter((t) => t.status === "pending").length}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-gray-900"
                  >
                    {tasks.filter((t) => t.status === "pending").length}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <motion.div
                  className="p-3 bg-green-100 rounded-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <motion.p
                    key={tasks.filter((t) => t.status === "completed").length}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-gray-900"
                  >
                    {tasks.filter((t) => t.status === "completed").length}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            <motion.div
              key="overdue"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <motion.div
                  className="p-3 bg-red-100 rounded-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <motion.p
                    key={tasks.filter((t) => t.status === "overdue").length}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-gray-900"
                  >
                    {tasks.filter((t) => t.status === "overdue").length}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Tasks
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <motion.input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  initial={false}
                  whileFocus={{ scale: 1.02 }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Tasks Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Project Tasks ({filteredTasks.length})
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FunnelIcon className="h-4 w-4" />
                <span>Filtered results</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <DataTable
              data={filteredTasks}
              loading={loading}
              columns={[
                {
                  header: "Task",
                  accessor: "title",
                  renderer: (task) => (
                    <div className="flex items-center min-w-0 max-w-[300px]">
                      {getStatusIcon(task.status)}
                      <div className="ml-3 min-w-0 flex-1">
                        <div
                          className="font-medium text-gray-900 truncate"
                          title={task.title}
                        >
                          {task.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {task.description}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Project",
                  accessor: "project",
                  renderer: (task) => (
                    <div className="flex items-center min-w-0 max-w-[200px]">
                      <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {task.project?.code}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {task.project?.name}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Assigned To",
                  accessor: "assignedTo",
                  renderer: (task) => (
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Due Date",
                  accessor: "dueDate",
                  renderer: (task) => (
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Status",
                  accessor: "status",
                  renderer: (task) => (
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Priority",
                  accessor: "priority",
                  renderer: (task) => (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  ),
                },
                {
                  header: "Actions",
                  accessor: "actions",
                  renderer: (task) => (
                    <div className="flex space-x-2">
                      <AnimatePresence mode="wait">
                        {updatingTask === task._id ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg"
                          >
                            <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
                            Updating...
                          </motion.div>
                        ) : task.status === "pending" ? (
                          <motion.div
                            key="pending-actions"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex space-x-2"
                          >
                            <motion.button
                              onClick={() =>
                                updateTaskStatusHandler(task._id, "in_progress")
                              }
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Start
                            </motion.button>
                            <motion.button
                              onClick={() =>
                                updateTaskStatusHandler(task._id, "completed")
                              }
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                            >
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Complete
                            </motion.button>
                          </motion.div>
                        ) : task.status === "in_progress" ? (
                          <motion.button
                            key="in-progress-action"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            onClick={() =>
                              updateTaskStatusHandler(task._id, "completed")
                            }
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                          >
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Complete
                          </motion.button>
                        ) : (
                          <motion.div
                            key="completed"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-lg"
                          >
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Completed
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ),
                },
              ]}
              emptyState={{
                icon: <DocumentTextIcon className="h-12 w-12 text-gray-400" />,
                title: "No tasks found",
                description:
                  filter === "all"
                    ? "You don't have any project tasks assigned yet."
                    : `No ${filter} tasks found.`,
                actionButton: null,
              }}
              pagination={true}
              itemsPerPage={10}
              searchable={false}
              sortable={true}
              responsive={true}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MyProjectTasks;
