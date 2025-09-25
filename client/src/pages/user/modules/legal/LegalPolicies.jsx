import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  DocumentTextIcon,
  SparklesIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import AnimatedBubbles from "../../../../components/ui/AnimatedBubbles";
import ELRALogo from "../../../../components/ELRALogo";
import { legalPolicyAPI } from "../../../../services/legalAPI";

const LegalPolicies = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [policyData, setPolicyData] = useState({
    title: "",
    category: "",
    status: "Draft",
    version: "1.0",
    effectiveDate: "",
    description: "",
    content: "",
    applicableProjectScopes: [],
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [policyCategories, setPolicyCategories] = useState([]);
  const [customCategory, setCustomCategory] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [isProjectSpecific, setIsProjectSpecific] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const policyStatuses = ["Active", "Draft", "Inactive", "Under Review"];

  const projectScopes = [
    { value: "personal", label: "Personal Projects", icon: "👤" },
    { value: "departmental", label: "Departmental Projects", icon: "🏢" },
    { value: "external", label: "External Projects", icon: "🌐" },
  ];

  useEffect(() => {
    fetchPolicies();
    fetchPolicyCategories();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const data = await legalPolicyAPI.getPolicies();
      if (data.success) {
        setPolicies(data.data.policies || []);
        setFilteredPolicies(data.data.policies || []);
      } else {
        toast.error(data.message || "Failed to load policies");
      }
    } catch (error) {
      console.error("Error fetching policies:", error);
      toast.error("Error loading policies");
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicyCategories = async () => {
    try {
      setCategoriesLoading(true);
      const categories = await legalPolicyAPI.getPolicyCategories();
      setPolicyCategories(categories);
    } catch (error) {
      console.error("Error fetching policy categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Real-time search filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPolicies(policies);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = policies.filter(
      (policy) =>
        policy.title?.toLowerCase().includes(searchLower) ||
        policy.description?.toLowerCase().includes(searchLower) ||
        policy.category?.toLowerCase().includes(searchLower) ||
        policy.status?.toLowerCase().includes(searchLower) ||
        policy.version?.toLowerCase().includes(searchLower)
    );
    setFilteredPolicies(filtered);
  }, [searchTerm, policies]);

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    if (
      !policyData.title ||
      !policyData.category ||
      !policyData.description ||
      !policyData.content
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (isEditMode) {
        setUpdating(true);
      } else {
        setCreating(true);
      }
      setShowBubbles(true);

      const payload = {
        ...policyData,
        category: policyData.category,
        customCategory:
          policyData.category === "Other" ? customCategory : undefined,
      };

      let data;
      if (isEditMode) {
        data = await legalPolicyAPI.updatePolicy(selectedPolicy._id, payload);
      } else {
        data = await legalPolicyAPI.createPolicy(payload);
      }

      if (data.success) {
        toast.success(
          `Legal policy ${isEditMode ? "updated" : "created"} successfully`
        );
        setShowCreateModal(false);
        resetForm();
        fetchPolicies();
      } else {
        toast.error(
          data.message || `Failed to ${isEditMode ? "update" : "create"} policy`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} policy:`,
        error
      );
      toast.error(`Failed to ${isEditMode ? "update" : "create"} policy`);
    } finally {
      if (isEditMode) {
        setUpdating(false);
      } else {
        setCreating(false);
      }
      setShowBubbles(false);
    }
  };

  const handleDeletePolicy = async () => {
    try {
      setDeleting(true);

      const data = await legalPolicyAPI.deletePolicy(selectedPolicy._id);

      if (data.success) {
        toast.success("Legal policy deleted successfully");
        setShowDeleteModal(false);
        fetchPolicies();
      } else {
        toast.error(data.message || "Failed to delete policy");
      }
    } catch (error) {
      console.error("Error deleting policy:", error);
      toast.error("Failed to delete policy");
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setPolicyData({
      title: "",
      category: "",
      status: "Draft",
      version: "1.0",
      effectiveDate: "",
      description: "",
      content: "",
      applicableProjectScopes: [],
    });
    setCustomCategory("");
    setIsProjectSpecific(false);
    setIsEditMode(false);
    setSelectedPolicy(null);
  };

  const openViewModal = (policy) => {
    setSelectedPolicy(policy);
    setShowViewModal(true);
  };

  const openEditModal = (policy) => {
    setSelectedPolicy(policy);
    setPolicyData({
      title: policy.title,
      category: policy.customCategory ? "Other" : policy.category,
      status: policy.status,
      version: policy.version,
      effectiveDate: policy.effectiveDate
        ? new Date(policy.effectiveDate).toISOString().split("T")[0]
        : "",
      description: policy.description,
      content: policy.content,
      applicableProjectScopes: policy.applicableProjectScopes || [],
    });
    setCustomCategory(policy.customCategory || "");
    setIsProjectSpecific((policy.applicableProjectScopes || []).length > 0);
    setIsEditMode(true);
    setShowCreateModal(true); // Use the create modal
  };

  const openDeleteModal = (policy) => {
    setSelectedPolicy(policy);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Active: "bg-green-100 text-green-800",
      Draft: "bg-yellow-100 text-yellow-800",
      Inactive: "bg-gray-100 text-gray-800",
      "Under Review": "bg-blue-100 text-blue-800",
    };

    const statusIcons = {
      Active: <CheckCircleIcon className="h-4 w-4" />,
      Draft: <DocumentTextIcon className="h-4 w-4" />,
      Inactive: <ExclamationTriangleIcon className="h-4 w-4" />,
      "Under Review": <ClockIcon className="h-4 w-4" />,
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[status]} space-x-1`}
      >
        {statusIcons[status]}
        <span>{status}</span>
      </span>
    );
  };

  const policyColumns = [
    {
      header: "Title",
      accessor: "title",
      renderer: (policy) => (
        <div>
          <div className="font-semibold text-gray-900">{policy.title}</div>
          <div className="text-sm text-gray-500">v{policy.version}</div>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      renderer: (policy) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {policy.customCategory || policy.category}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (policy) => getStatusBadge(policy.status),
    },
    {
      header: "Effective Date",
      accessor: "effectiveDate",
      renderer: (policy) => (
        <div className="text-sm text-gray-900">
          {policy.effectiveDate
            ? new Date(policy.effectiveDate).toLocaleDateString()
            : "N/A"}
        </div>
      ),
    },
    {
      header: "Project Scopes",
      accessor: "applicableProjectScopes",
      renderer: (policy) => {
        const scopes = policy.applicableProjectScopes || [];
        return (
          <div className="flex flex-wrap gap-1">
            {scopes.length > 0 ? (
              scopes.map((scope) => {
                const scopeConfig = projectScopes.find(
                  (s) => s.value === scope
                );
                return (
                  <span
                    key={scope}
                    className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800"
                  >
                    {scopeConfig ? scopeConfig.label : scope}
                  </span>
                );
              })
            ) : (
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                Not Set
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      renderer: (policy) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openViewModal(policy)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Policy"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          {user?.role?.level >= 700 &&
            (() => {
              console.log("🔍 [DEBUG] Policy creator check:", {
                policyId: policy._id,
                policyTitle: policy.title,
                policyCreatedBy: policy.createdBy,
                policyCreatedById: policy.createdBy?._id,
                currentUser: user,
                currentUserId: user._id || user.id,
                isMatch: policy.createdBy?._id === (user._id || user.id),
              });
              return (
                policy.createdBy?._id === (user._id || user.id) ||
                policy.createdBy?.id === (user._id || user.id)
              );
            })() && (
              <>
                <button
                  onClick={() => openEditModal(policy)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit Policy"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                {(user?.role?.level >= 1000 ||
                  policy.createdBy?._id === (user._id || user.id) ||
                  policy.createdBy?.id === (user._id || user.id)) && (
                  <button
                    onClick={() => openDeleteModal(policy)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Policy"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Legal Policies</h1>
          <p className="text-gray-600 mt-1">
            Manage legal policies and procedures for project compliance
          </p>
        </div>
        {user?.role?.level >= 700 && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Policy</span>
          </button>
        )}
      </div>

      {/* Policies Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              Legal Policies
            </h3>
          </div>
          <div className="relative w-full max-w-xs">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <DataTable
          data={filteredPolicies}
          columns={policyColumns}
          loading={loading}
          searchable={false}
          pagination={true}
          pageSize={10}
          actions={{
            showEdit: false,
            showDelete: false,
          }}
        />
      </div>

      {/* Create Policy Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !creating && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Bubbles */}
              <AnimatedBubbles isVisible={showBubbles} variant="bubbles" />

              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <ELRALogo variant="dark" size="md" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isEditMode ? "Edit Legal Policy" : "Create Legal Policy"}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {isEditMode
                        ? "Update the legal policy details"
                        : "Add a new legal policy for project compliance"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                <form onSubmit={handleCreatePolicy} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Policy Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={policyData.title}
                        onChange={(e) =>
                          setPolicyData({
                            ...policyData,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                        placeholder="Enter policy title"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={policyData.category}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPolicyData({
                            ...policyData,
                            category: value,
                          });
                          if (value !== "Other") {
                            setCustomCategory("");
                          }
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      >
                        <option value="">Select category</option>
                        {policyCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {categoriesLoading && (
                        <div className="mt-2">
                          <AnimatedBubbles isVisible={true} variant="bubbles" />
                        </div>
                      )}
                      {policyData.category === "Other" && (
                        <div className="mt-3">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Specify Category
                          </label>
                          <input
                            type="text"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            placeholder="Enter custom category"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                          />
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={policyData.status}
                        onChange={(e) =>
                          setPolicyData({
                            ...policyData,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      >
                        {policyStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Version */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Version
                      </label>
                      <input
                        type="text"
                        value={policyData.version}
                        onChange={(e) =>
                          setPolicyData({
                            ...policyData,
                            version: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                        placeholder="e.g., 1.0"
                      />
                    </div>

                    {/* Effective Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Effective Date
                      </label>
                      <input
                        type="date"
                        value={policyData.effectiveDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) =>
                          setPolicyData({
                            ...policyData,
                            effectiveDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={policyData.description}
                      onChange={(e) =>
                        setPolicyData({
                          ...policyData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      placeholder="Enter policy description"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Policy Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={policyData.content}
                      onChange={(e) =>
                        setPolicyData({
                          ...policyData,
                          content: e.target.value,
                        })
                      }
                      rows={8}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      placeholder="Enter detailed policy content"
                    />
                  </div>

                  {/* Project Scopes - Optional */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Project-Specific Policy
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isProjectSpecific}
                          onChange={(e) => {
                            setIsProjectSpecific(e.target.checked);
                            if (!e.target.checked) {
                              // When unchecked, clear all scopes
                              setPolicyData({
                                ...policyData,
                                applicableProjectScopes: [],
                              });
                            }
                          }}
                          className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">
                          This policy applies to specific project types
                        </span>
                      </div>
                    </div>
                    <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>💡 Leave unchecked</strong> for general
                        organizational policies (applies to all ELRA activities)
                        <br />
                        <strong>✅ Check this box</strong> if the policy only
                        applies to specific project types
                      </p>
                    </div>
                    {isProjectSpecific && (
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Applicable Project Scopes
                      </label>
                    )}
                    {isProjectSpecific && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {projectScopes.map((scope) => (
                          <motion.label
                            key={scope.value}
                            className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                              policyData.applicableProjectScopes.includes(
                                scope.value
                              )
                                ? "border-[var(--elra-primary)] bg-[var(--elra-primary)]/10 shadow-lg"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <input
                              type="checkbox"
                              checked={policyData.applicableProjectScopes.includes(
                                scope.value
                              )}
                              onChange={(e) => {
                                const scopes = e.target.checked
                                  ? [
                                      ...policyData.applicableProjectScopes,
                                      scope.value,
                                    ]
                                  : policyData.applicableProjectScopes.filter(
                                      (s) => s !== scope.value
                                    );
                                setPolicyData({
                                  ...policyData,
                                  applicableProjectScopes: scopes,
                                });
                              }}
                              className="sr-only"
                            />
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{scope.icon}</span>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {scope.label}
                                </div>
                              </div>
                            </div>
                            {policyData.applicableProjectScopes.includes(
                              scope.value
                            ) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2"
                              >
                                <SparklesIcon className="h-5 w-5 text-[var(--elra-primary)]" />
                              </motion.div>
                            )}
                          </motion.label>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="flex space-x-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  disabled={creating || updating}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleCreatePolicy}
                  disabled={creating || updating}
                  className="flex-1 px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {creating || updating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{isEditMode ? "Updating..." : "Creating..."}</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-5 w-5" />
                      <span>
                        {isEditMode ? "Update Policy" : "Create Policy"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Policy Modal */}
      <AnimatePresence>
        {showViewModal && selectedPolicy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl">
                    <DocumentTextIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedPolicy.title}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      v{selectedPolicy.version} • {selectedPolicy.category}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-6">
                  {/* Policy Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Status
                      </div>
                      <div className="mt-1">
                        {getStatusBadge(selectedPolicy.status)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Effective Date
                      </div>
                      <div className="mt-1 text-gray-900">
                        {selectedPolicy.effectiveDate
                          ? new Date(
                              selectedPolicy.effectiveDate
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Project Scopes
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(selectedPolicy.applicableProjectScopes || []).length >
                        0 ? (
                          (selectedPolicy.applicableProjectScopes || []).map(
                            (scope) => {
                              const scopeConfig = projectScopes.find(
                                (s) => s.value === scope
                              );
                              return (
                                <span
                                  key={scope}
                                  className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800"
                                >
                                  {scopeConfig ? scopeConfig.label : scope}
                                </span>
                              );
                            }
                          )
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            Not Set - Applies to all ELRA activities
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedPolicy.description}
                    </p>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Policy Content
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {selectedPolicy.content}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedPolicy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Policy
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete "{selectedPolicy.title}"? This
                  action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePolicy}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-4 w-4" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LegalPolicies;
