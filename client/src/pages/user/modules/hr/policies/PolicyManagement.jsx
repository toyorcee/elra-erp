import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useAuth } from "../../../../../context/AuthContext";
import { userModulesAPI } from "../../../../../services/userModules.js";
import { getActiveDepartments } from "../../../../../services/departments.js";

const PolicyManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    search: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    status: "Draft",
    version: "1.0",
    effectiveDate: "",
    description: "",
    content: "",
    department: "",
    isCompanyWide: false,
  });
  const [stats, setStats] = useState({
    Active: 0,
    Draft: 0,
    Inactive: 0,
    "Under Review": 0,
    Total: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [categories, setCategories] = useState(["All"]);
  const [statuses, setStatuses] = useState(["All"]);

  // Helper function to reset form data
  const resetFormData = () => {
    setFormData({
      title: "",
      category: "",
      status: "Draft",
      version: "1.0",
      effectiveDate: "",
      description: "",
      content: "",
      department: "",
      isCompanyWide: false,
    });
  };

  const canCreatePolicy = user?.role?.level >= 700;
  const canEditPolicy = user?.role?.level >= 700;
  const canDeletePolicy = user?.role?.level >= 1000;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [policiesRes, statsRes, departmentsRes, optionsRes] =
        await Promise.all([
          userModulesAPI.policies.getAll(),
          userModulesAPI.policies.getStats(),
          getActiveDepartments(),
          userModulesAPI.policies.getOptions(),
        ]);

      setPolicies(policiesRes.data.policies || []);
      setFilteredPolicies(policiesRes.data.policies || []);
      setStats(statsRes.data || stats);
      setDepartments(departmentsRes.data.departments || []);

      if (optionsRes.success && optionsRes.data) {
        setCategories(["All", ...optionsRes.data.categories]);
        setStatuses(["All", ...optionsRes.data.statuses]);
      }
    } catch (error) {
      console.error("Error fetching policies:", error);
      toast.error("Failed to fetch policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterPolicies();
  }, [policies, filters]);

  const filterPolicies = () => {
    let filtered = policies;

    if (filters.status && filters.status !== "All") {
      filtered = filtered.filter((policy) => policy.status === filters.status);
    }

    if (filters.category && filters.category !== "All") {
      filtered = filtered.filter(
        (policy) => policy.category === filters.category
      );
    }

    if (filters.search) {
      filtered = filtered.filter(
        (policy) =>
          policy.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          policy.description
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          policy.department?.name
            ?.toLowerCase()
            .includes(filters.search.toLowerCase())
      );
    }

    setFilteredPolicies(filtered);
  };

  const handleCreatePolicy = () => {
    setFormData({
      title: "",
      category: "",
      status: "Draft",
      version: "1.0",
      effectiveDate: "",
      description: "",
      content: "",
      department: "",
      isCompanyWide: false,
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        department: formData.isCompanyWide ? null : formData.department,
      };

      if (showEditModal && selectedPolicy) {
        const response = await userModulesAPI.policies.update(
          selectedPolicy._id,
          submitData
        );
        if (response.success) {
          toast.success("Policy updated successfully");
          setShowEditModal(false);
          setSelectedPolicy(null);
          setFormData({
            title: "",
            category: "",
            status: "Draft",
            version: "1.0",
            effectiveDate: "",
            description: "",
            content: "",
            department: "",
            isCompanyWide: false,
          });
          await fetchData();
        }
      } else {
        const response = await userModulesAPI.policies.create(submitData);
        if (response.success) {
          toast.success("Policy created successfully");
          setShowCreateModal(false);
          setFormData({
            title: "",
            category: "",
            status: "Draft",
            version: "1.0",
            effectiveDate: "",
            description: "",
            content: "",
            department: "",
            isCompanyWide: false,
          });
          await fetchData();
        }
      }
    } catch (error) {
      console.error("Error saving policy:", error);
      toast.error("Failed to save policy");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPolicy = (policy) => {
    setSelectedPolicy(policy);
    setShowViewModal(true);
  };

  const handleEditPolicy = (policy) => {
    setSelectedPolicy(policy);
    setFormData({
      title: policy.title,
      category: policy.category,
      status: policy.status,
      version: policy.version,
      effectiveDate: policy.effectiveDate
        ? new Date(policy.effectiveDate).toISOString().split("T")[0]
        : "",
      description: policy.description,
      content: policy.content,
      department: policy.department?._id || policy.department || "",
      isCompanyWide: !policy.department,
    });
    setShowEditModal(true);
  };

  const handleDeletePolicy = (policy) => {
    setSelectedPolicy(policy);
    setShowDeleteModal(true);
  };

  const confirmDeletePolicy = async () => {
    if (!selectedPolicy) return;

    setIsDeleting(true);
    try {
      await userModulesAPI.policies.delete(selectedPolicy._id);
      toast.success("Policy deleted successfully");
      setShowDeleteModal(false);
      setSelectedPolicy(null);
      await fetchData();
    } catch (error) {
      console.error("Error deleting policy:", error);
      toast.error("Failed to delete policy");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      case "Under Review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Active":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "Draft":
        return <ClockIcon className="h-4 w-4" />;
      case "Inactive":
        return <XCircleIcon className="h-4 w-4" />;
      case "Under Review":
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <DocumentIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading policies...</p>
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
                Policy Management
              </h1>
              <p className="mt-2 text-[var(--elra-text-muted)]">
                Manage HR policies, procedures, and compliance documents
              </p>
            </div>
            {canCreatePolicy && (
              <button
                onClick={handleCreatePolicy}
                className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors duration-200 shadow-sm"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Policy
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
                <p className="text-sm font-medium text-gray-600">
                  Active Policies
                </p>
                <p className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  {stats.Active}
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
                  Draft Policies
                </p>
                <p className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  {stats.Draft}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Under Review
                </p>
                <p className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  {stats["Under Review"]}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Policies
                </p>
                <p className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  {stats.Total}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)]"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)]"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[300px] flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search policies..."
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

        {/* Policies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolicies.map((policy) => (
            <div
              key={policy._id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => handleViewPolicy(policy)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--elra-text-primary)] mb-2">
                      {policy.title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          policy.status
                        )}`}
                      >
                        {getStatusIcon(policy.status)}
                        <span className="ml-1">{policy.status}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        v{policy.version}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[var(--elra-text-muted)] mb-4 line-clamp-2">
                  {policy.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    {policy.department?.name || "Company-wide"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Effective:{" "}
                    {new Date(policy.effectiveDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {policy.createdBy?.firstName} {policy.createdBy?.lastName}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewPolicy(policy)}
                      className="p-2 text-[var(--elra-primary)] hover:bg-[var(--elra-secondary-3)] rounded-lg transition-colors"
                      title="View Policy"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    {canEditPolicy && (
                      <button
                        onClick={() => handleEditPolicy(policy)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Policy"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    {canDeletePolicy && (
                      <button
                        onClick={() => handleDeletePolicy(policy)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Policy"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    Updated {new Date(policy.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPolicies.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-[var(--elra-primary)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No policies found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or create a new policy.
            </p>
          </div>
        )}
      </div>

      {/* View Policy Modal */}
      {showViewModal && selectedPolicy && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  {selectedPolicy.title}
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Policy Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      {selectedPolicy.status}
                    </div>
                    <div>
                      <span className="font-medium">Version:</span>{" "}
                      {selectedPolicy.version}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>{" "}
                      {selectedPolicy.category}
                    </div>
                    <div>
                      <span className="font-medium">Department:</span>{" "}
                      {selectedPolicy.department?.name || "Company-wide"}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Effective Date:</span>{" "}
                      {new Date(
                        selectedPolicy.effectiveDate
                      ).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>{" "}
                      {new Date(
                        selectedPolicy.lastUpdated
                      ).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Created By:</span>{" "}
                      {selectedPolicy.createdBy?.firstName}{" "}
                      {selectedPolicy.createdBy?.lastName}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-700">{selectedPolicy.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Content</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-gray-700 whitespace-pre-wrap font-sans">
                    {selectedPolicy.content}
                  </pre>
                </div>
              </div>

              {selectedPolicy.attachments &&
                selectedPolicy.attachments.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Attachments
                    </h3>
                    <div className="space-y-2">
                      {selectedPolicy.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-sm text-gray-700">
                            {attachment.originalName || attachment.filename}
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

      {/* Create/Edit Policy Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  {showEditModal ? "Edit Policy" : "Create Policy"}
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
                    placeholder="Enter policy title"
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
                    {categories
                      .filter((cat) => cat !== "All")
                      .map((category) => (
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
                    {statuses
                      .filter((status) => status !== "All")
                      .map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        version: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)]"
                    placeholder="e.g., 1.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        effectiveDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)]"
                  />
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="isCompanyWide"
                      checked={formData.isCompanyWide}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isCompanyWide: e.target.checked,
                          department: e.target.checked ? "" : prev.department,
                        }))
                      }
                      className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded cursor-pointer"
                    />
                    <label
                      htmlFor="isCompanyWide"
                      className="ml-2 text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Company-wide Policy
                    </label>
                  </div>
                  {!formData.isCompanyWide && (
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          department: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)] cursor-pointer"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  )}
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
                  placeholder="Enter policy description"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-border-focus)]"
                  placeholder="Enter policy content"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPolicy && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 shadow-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Delete Policy
                </h2>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{" "}
                <strong>"{selectedPolicy.title}"</strong>? This action cannot be
                undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPolicy(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePolicy}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Policy"
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

export default PolicyManagement;
