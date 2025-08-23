import React, { useState, useEffect } from "react";
import {
  HiTicket,
  HiClock,
  HiCheckCircle,
  HiExclamationTriangle,
  HiEye,
  HiQuestionMarkCircle,
  HiCog6Tooth,
  HiCube,
  HiUser,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    priority: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "open", label: "Open", color: "text-blue-600" },
    { value: "in_progress", label: "In Progress", color: "text-yellow-600" },
    { value: "resolved", label: "Resolved", color: "text-green-600" },
    { value: "closed", label: "Closed", color: "text-gray-600" },
  ];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "technical", label: "Technical Support", icon: HiCog6Tooth },
    { value: "equipment", label: "Equipment Request", icon: HiCube },
    { value: "access", label: "Access Request", icon: HiUser },
    { value: "general", label: "General Inquiry", icon: HiQuestionMarkCircle },
  ];

  const priorities = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low", color: "text-green-600" },
    { value: "medium", label: "Medium", color: "text-yellow-600" },
    { value: "high", label: "High", color: "text-orange-600" },
    { value: "urgent", label: "Urgent", color: "text-red-600" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "updatedAt", label: "Last Updated" },
    { value: "priority", label: "Priority" },
    { value: "status", label: "Status" },
    { value: "title", label: "Title" },
  ];

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      // Mock data for demonstration
      const mockTickets = [
        {
          id: "1",
          title: "Laptop not connecting to WiFi",
          category: "technical",
          priority: "high",
          status: "in_progress",
          description: "My laptop cannot connect to the office WiFi network",
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-16T14:20:00Z",
          assignedTo: "IT Support Team",
          comments: 3,
        },
        {
          id: "2",
          title: "Request for additional monitor",
          category: "equipment",
          priority: "medium",
          status: "open",
          description: "Need an additional monitor for better productivity",
          createdAt: "2024-01-14T09:15:00Z",
          updatedAt: "2024-01-14T09:15:00Z",
          assignedTo: "Facilities Team",
          comments: 1,
        },
        {
          id: "3",
          title: "Access to project management tool",
          category: "access",
          priority: "low",
          status: "resolved",
          description: "Need access to the new project management software",
          createdAt: "2024-01-10T16:45:00Z",
          updatedAt: "2024-01-12T11:30:00Z",
          assignedTo: "IT Support Team",
          comments: 5,
        },
      ];

      setTickets(mockTickets);
      toast.success("Tickets loaded successfully");
    } catch (error) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "text-blue-600 bg-blue-50";
      case "in_progress":
        return "text-yellow-600 bg-yellow-50";
      case "resolved":
        return "text-green-600 bg-green-50";
      case "closed":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "high":
        return "text-orange-600";
      case "urgent":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "technical":
        return HiCog6Tooth;
      case "equipment":
        return HiCube;
      case "access":
        return HiUser;
      case "general":
        return HiQuestionMarkCircle;
      default:
        return HiTicket;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns = [
    {
      header: "Ticket",
      accessor: "title",
      cell: (ticket) => (
        <div>
          <div className="font-medium text-gray-900">{ticket.title}</div>
          <div className="text-sm text-gray-500">#{ticket.id}</div>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      cell: (ticket) => {
        const Icon = getCategoryIcon(ticket.category);
        const categoryLabel =
          categories.find((c) => c.value === ticket.category)?.label ||
          ticket.category;
        return (
          <div className="flex items-center space-x-2">
            <Icon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">{categoryLabel}</span>
          </div>
        );
      },
    },
    {
      header: "Priority",
      accessor: "priority",
      cell: (ticket) => (
        <span
          className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}
        >
          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (ticket) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            ticket.status
          )}`}
        >
          {ticket.status.replace("_", " ").charAt(0).toUpperCase() +
            ticket.status.replace("_", " ").slice(1)}
        </span>
      ),
    },
    {
      header: "Assigned To",
      accessor: "assignedTo",
      cell: (ticket) => (
        <div className="text-sm text-gray-700">{ticket.assignedTo}</div>
      ),
    },
    {
      header: "Created",
      accessor: "createdAt",
      cell: (ticket) => (
        <div className="text-sm text-gray-500">
          {formatDate(ticket.createdAt)}
        </div>
      ),
    },
    {
      header: "Updated",
      accessor: "updatedAt",
      cell: (ticket) => (
        <div className="text-sm text-gray-500">
          {formatDate(ticket.updatedAt)}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (ticket) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewTicket(ticket.id)}
            className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] p-1 rounded hover:bg-gray-100 cursor-pointer"
            title="View Ticket"
          >
            <HiEye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAddComment(ticket.id)}
            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-gray-100 cursor-pointer"
            title="Add Comment"
          >
            <HiDocumentText className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleViewTicket = (ticketId) => {
    // TODO: Implement ticket view modal/page
    toast.info(`Viewing ticket #${ticketId}`);
  };

  const handleAddComment = (ticketId) => {
    // TODO: Implement comment modal
    toast.info(`Adding comment to ticket #${ticketId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Support Tickets
            </h1>
            <p className="text-gray-600 mt-1">
              View and track your submitted support tickets
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <HiClock
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Filter Tickets
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, priority: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Tickets</h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} found
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
            <span className="ml-2 text-gray-600">Loading your tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <HiTicket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Tickets Found
            </h3>
            <p className="text-gray-600">
              You haven't submitted any support tickets yet.
            </p>
          </div>
        ) : (
          <DataTable
            data={tickets}
            columns={columns}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            sortOptions={sortOptions}
          />
        )}
      </div>
    </div>
  );
};

export default MyTickets;
