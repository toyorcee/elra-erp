import React, { useState, useEffect } from "react";
import {
  ShieldCheckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  FlagIcon,
  CheckBadgeIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useAuth } from "../../../../../context/AuthContext";
import { userModulesAPI } from "../../../../../services/userModules";

const ComplianceManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complianceItems, setComplianceItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    search: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    status: "Pending",
    priority: "Medium",
    dueDate: "",
    nextAudit: "",
    description: "",
    requirements: [""],
    findings: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const categories = [
    "Legal",
    "Safety",
    "Privacy",
    "Environmental",
    "Financial",
    "Other",
  ];
  const statuses = ["Compliant", "Non-Compliant", "Under Review", "Pending"];
  const priorities = ["Critical", "High", "Medium", "Low"];

  const canCreateCompliance = user?.role?.level >= 1000;
  const canEditCompliance = user?.role?.level >= 1000;
  const canDeleteCompliance = user?.role?.level >= 1000;

  const resetFormData = () => {
    setFormData({
      title: "",
      category: "",
      status: "Pending",
      priority: "Medium",
      dueDate: "",
      nextAudit: "",
      description: "",
      requirements: [""],
      findings: "",
    });
  };

  useEffect(() => {
    fetchData();
    fetchDepartments();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await userModulesAPI.compliance.getAll();
      if (response.success) {
        setComplianceItems(response.data.complianceItems || []);
        setFilteredItems(response.data.complianceItems || []);
      }
    } catch (error) {
      console.error("Error fetching compliance items:", error);
      toast.error("Failed to fetch compliance data");
      setComplianceItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await userModulesAPI.departments.getAllDepartments();
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userModulesAPI.users.getAllUsers();
      if (response.success) {
        setUsers(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    filterItems();
  }, [complianceItems, filters]);

  const filterItems = () => {
    let filtered = complianceItems;

    if (filters.status && filters.status !== "All") {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    if (filters.category && filters.category !== "All") {
      filtered = filtered.filter((item) => item.category === filters.category);
    }

    if (filters.priority && filters.priority !== "All") {
      filtered = filtered.filter((item) => item.priority === filters.priority);
    }

    if (filters.search) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const handleCreateCompliance = () => {
    resetFormData();
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const complianceData = {
        ...formData,
        requirements: formData.requirements.filter((req) => req.trim() !== ""),
      };

      if (showEditModal && selectedItem) {
        const response = await userModulesAPI.compliance.update(
          selectedItem._id,
          complianceData
        );
        if (response.success) {
          toast.success("Compliance item updated successfully");
          setShowEditModal(false);
          setSelectedItem(null);
          resetFormData();
          await fetchData();
        }
      } else {
        const response = await userModulesAPI.compliance.create(complianceData);
        if (response.success) {
          toast.success("Compliance item created successfully");
          setShowCreateModal(false);
          resetFormData();
          await fetchData();
        }
      }
    } catch (error) {
      console.error("Error saving compliance item:", error);
      toast.error("Failed to save compliance item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewCompliance = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEditCompliance = (item) => {
    setSelectedItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      status: item.status,
      priority: item.priority,
      dueDate: item.dueDate
        ? new Date(item.dueDate).toISOString().split("T")[0]
        : "",
      nextAudit: item.nextAudit
        ? new Date(item.nextAudit).toISOString().split("T")[0]
        : "",
      description: item.description,
      requirements:
        item.requirements && item.requirements.length > 0
          ? item.requirements
          : [""],
      findings: item.findings || "",
    });
    setShowEditModal(true);
  };

  const handleDeleteCompliance = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteCompliance = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);
    try {
      const response = await userModulesAPI.compliance.delete(selectedItem._id);
      if (response.success) {
        toast.success("Compliance item deleted successfully");
        setShowDeleteModal(false);
        setSelectedItem(null);
        await fetchData();
      }
    } catch (error) {
      console.error("Error deleting compliance item:", error);
      toast.error("Failed to delete compliance item");
    } finally {
      setIsDeleting(false);
    }
  };

  const addRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }));
  };

  const removeRequirement = (index) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const updateRequirement = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req, i) =>
        i === index ? value : req
      ),
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Compliant":
        return "bg-green-100 text-green-800";
      case "Non-Compliant":
        return "bg-red-100 text-red-800";
      case "Under Review":
        return "bg-yellow-100 text-yellow-800";
      case "Pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Compliant":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "Non-Compliant":
        return <XCircleIcon className="h-4 w-4" />;
      case "Under Review":
        return <ClockIcon className="h-4 w-4" />;
      case "Pending":
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <DocumentIcon className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--elra-text-primary)]">
                Compliance Management
              </h1>
              <p className="mt-2 text-[var(--elra-text-muted)]">
                Monitor and manage HR compliance requirements and audits
              </p>
            </div>
            {canCreateCompliance && (
              <button
                onClick={handleCreateCompliance}
                className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors duration-200 shadow-sm cursor-pointer"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Compliance Item
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Compliant</p>
                <p className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  {
                    complianceItems.filter((i) => i.status === "Compliant")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Non-Compliant
                </p>
                <p className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  {
                    complianceItems.filter((i) => i.status === "Non-Compliant")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Under Review
                </p>
                <p className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  {
                    complianceItems.filter((i) => i.status === "Under Review")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  {complianceItems.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)] cursor-pointer"
              >
                <option value="">All</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)] cursor-pointer"
              >
                <option value="">All</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, priority: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)] cursor-pointer"
              >
                <option value="">All</option>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[250px] flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search compliance items..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const daysUntilDue = getDaysUntilDue(item.dueDate);
            const isOverdue = daysUntilDue < 0;
            const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

            return (
              <div
                key={item._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => handleViewCompliance(item)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[var(--elra-text-primary)] mb-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-2 mb-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{item.status}</span>
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--elra-text-muted)] mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                      {item.department?.name || "Company-wide"}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Due: {new Date(item.dueDate).toLocaleDateString()}
                      {isOverdue && (
                        <span className="ml-2 text-red-600 text-xs font-medium">
                          OVERDUE
                        </span>
                      )}
                      {isDueSoon && !isOverdue && (
                        <span className="ml-2 text-orange-600 text-xs font-medium">
                          DUE SOON
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCompliance(item);
                        }}
                        className="p-2 text-[var(--elra-primary)] hover:bg-[var(--elra-secondary-3)] rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {canEditCompliance && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCompliance(item);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Item"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                      {canDeleteCompliance && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCompliance(item);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      Next: {new Date(item.nextAudit).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <ShieldCheckIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No compliance items found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or add a new compliance item.
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Compliance Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  {showEditModal
                    ? "Edit Compliance Item"
                    : "Create Compliance Item"}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)]"
                    placeholder="e.g., GDPR Data Protection Compliance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)] cursor-pointer"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)] cursor-pointer"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)] cursor-pointer"
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next Audit Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.nextAudit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nextAudit: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)]"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)]"
                  placeholder="e.g., Ensure compliance with GDPR data protection regulations across the entire organization. This includes implementing data processing agreements, establishing data subject rights procedures, and conducting privacy impact assessments."
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)]"
                      placeholder="e.g., Implement data processing agreements with all third-party vendors"
                    />
                    {formData.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRequirement}
                  className="mt-2 text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] cursor-pointer"
                >
                  + Add Requirement
                </button>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Findings
                </label>
                <textarea
                  value={formData.findings}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      findings: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)]"
                  placeholder="e.g., Initial assessment shows gaps in data processing documentation. Need to establish clear procedures for data subject requests."
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {showEditModal ? "Updating..." : "Creating..."}
                    </>
                  ) : showEditModal ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Compliance Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  {selectedItem.title}
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Compliance Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      {selectedItem.status}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>{" "}
                      {selectedItem.category}
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span>{" "}
                      {selectedItem.priority}
                    </div>
                    <div>
                      <span className="font-medium">Department:</span>{" "}
                      {selectedItem.department?.name || "Company-wide"}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Due Date:</span>{" "}
                      {new Date(selectedItem.dueDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Audit:</span>{" "}
                      {selectedItem.lastAudit
                        ? new Date(selectedItem.lastAudit).toLocaleDateString()
                        : "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Next Audit:</span>{" "}
                      {new Date(selectedItem.nextAudit).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-700">{selectedItem.description}</p>
              </div>

              {selectedItem.requirements &&
                selectedItem.requirements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Requirements
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <ul className="space-y-1">
                        {selectedItem.requirements.map((req, index) => (
                          <li
                            key={index}
                            className="flex items-center text-sm text-gray-700"
                          >
                            <CheckBadgeIcon className="h-4 w-4 text-green-500 mr-2" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

              {selectedItem.findings && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Findings</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedItem.findings}</p>
                  </div>
                </div>
              )}

              {selectedItem.attachments &&
                selectedItem.attachments.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Attachments
                    </h3>
                    <div className="space-y-2">
                      {selectedItem.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-sm text-gray-700">
                            {attachment.filename || attachment}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 shadow-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Delete Compliance Item
                </h2>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{" "}
                <strong>"{selectedItem.title}"</strong>? This action cannot be
                undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedItem(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCompliance}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Compliance Item"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceManagement;
