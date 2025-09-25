import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ShieldCheckIcon,
  SparklesIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import AnimatedBubbles from "../../../../components/ui/AnimatedBubbles";
import ELRALogo from "../../../../components/ELRALogo";
import {
  legalComplianceAPI,
  legalComplianceProgramAPI,
} from "../../../../services/legalAPI";

const ComplianceItems = () => {
  const { user } = useAuth();

  const [complianceItems, setComplianceItems] = useState([]);
  const [filteredCompliance, setFilteredCompliance] = useState([]);
  const [loading, setLoading] = useState(true);

  const [compliancePrograms, setCompliancePrograms] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);

  const [selectedCompliance, setSelectedCompliance] = useState(null);

  const [complianceData, setComplianceData] = useState({
    title: "",
    category: "",
    status: "Pending",
    priority: "Medium",
    dueDate: "",
    nextAudit: "",
    description: "",
    requirements: [""],
    findings: "",
    complianceProgram: "",
  });

  // Action states
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");

  // Categories
  const [complianceCategories, setComplianceCategories] = useState([]);
  const [customCategory, setCustomCategory] = useState("");

  const complianceStatuses = [
    "Compliant",
    "Non-Compliant",
    "Under Review",
    "Pending",
  ];

  const priorityLevels = ["Critical", "High", "Medium", "Low"];

  useEffect(() => {
    fetchComplianceItems();
    fetchCompliancePrograms();
    fetchComplianceCategories();
  }, []);

  const fetchComplianceItems = async () => {
    try {
      setLoading(true);
      const data = await legalComplianceAPI.getComplianceItems();
      if (data.success) {
        setComplianceItems(data.data.complianceItems || []);
        setFilteredCompliance(data.data.complianceItems || []);
      } else {
        toast.error(data.message || "Failed to load compliance items");
      }
    } catch (error) {
      console.error("Error fetching compliance items:", error);
      toast.error("Error loading compliance items");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompliancePrograms = async () => {
    try {
      const data = await legalComplianceProgramAPI.getCompliancePrograms();
      if (data.success) {
        setCompliancePrograms(data.data.compliancePrograms || []);
      }
    } catch (error) {
      console.error("Error fetching compliance programs:", error);
    }
  };

  const fetchComplianceCategories = async () => {
    try {
      const categories = await legalComplianceAPI.getComplianceCategories();
      setComplianceCategories(categories);
    } catch (error) {
      console.error("Error fetching compliance categories:", error);
    }
  };

  // Real-time search filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCompliance(complianceItems);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = complianceItems.filter(
      (item) =>
        item.title?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower) ||
        item.status?.toLowerCase().includes(searchLower) ||
        item.priority?.toLowerCase().includes(searchLower) ||
        item.complianceProgram?.name?.toLowerCase().includes(searchLower)
    );
    setFilteredCompliance(filtered);
  }, [searchTerm, complianceItems]);

  const handleCreateCompliance = async (e) => {
    e.preventDefault();
    if (
      !complianceData.title ||
      !complianceData.category ||
      !complianceData.description ||
      !complianceData.requirements[0] ||
      !complianceData.complianceProgram
    ) {
      toast.error(
        "Please fill in all required fields including compliance program"
      );
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
        ...complianceData,
        category: complianceData.category,
        customCategory:
          complianceData.category === "Other" ? customCategory : undefined,
        requirements: complianceData.requirements.filter(
          (req) => req.trim() !== ""
        ),
      };

      let data;
      if (isEditMode) {
        data = await legalComplianceAPI.updateCompliance(
          selectedCompliance._id,
          payload
        );
      } else {
        data = await legalComplianceAPI.createCompliance(payload);
      }

      if (data.success) {
        toast.success(
          `Compliance item ${isEditMode ? "updated" : "created"} successfully`
        );
        setShowCreateModal(false);
        resetForm();
        fetchComplianceItems();
      } else {
        toast.error(
          data.message ||
            `Failed to ${isEditMode ? "update" : "create"} compliance item`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} compliance item:`,
        error
      );
      toast.error(
        `Failed to ${isEditMode ? "update" : "create"} compliance item`
      );
    } finally {
      if (isEditMode) {
        setUpdating(false);
      } else {
        setCreating(false);
      }
      setShowBubbles(false);
    }
  };

  const handleDeleteCompliance = async () => {
    try {
      setDeleting(true);

      const data = await legalComplianceAPI.deleteCompliance(
        selectedCompliance._id
      );

      if (data.success) {
        toast.success("Compliance item deleted successfully");
        setShowDeleteModal(false);
        fetchComplianceItems();
      } else {
        toast.error(data.message || "Failed to delete compliance item");
      }
    } catch (error) {
      console.error("Error deleting compliance item:", error);
      toast.error("Failed to delete compliance item");
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setComplianceData({
      title: "",
      category: "",
      status: "Pending",
      priority: "Medium",
      dueDate: "",
      nextAudit: "",
      description: "",
      requirements: [""],
      findings: "",
      complianceProgram: "",
    });
    setCustomCategory("");
    setSelectedCompliance(null);
    setIsEditMode(false);
  };

  const openViewModal = (compliance) => {
    setSelectedCompliance(compliance);
    setShowViewModal(true);
  };

  const openEditModal = (compliance) => {
    setSelectedCompliance(compliance);
    setComplianceData({
      title: compliance.title,
      category: compliance.customCategory ? "Other" : compliance.category,
      status: compliance.status,
      priority: compliance.priority,
      dueDate: compliance.dueDate
        ? new Date(compliance.dueDate).toISOString().split("T")[0]
        : "",
      nextAudit: compliance.nextAudit
        ? new Date(compliance.nextAudit).toISOString().split("T")[0]
        : "",
      description: compliance.description,
      requirements:
        compliance.requirements && compliance.requirements.length > 0
          ? compliance.requirements
          : [""],
      findings: compliance.findings || "",
      complianceProgram: compliance.complianceProgram?._id || "",
    });
    setCustomCategory(compliance.customCategory || "");
    setIsEditMode(true);
    setShowCreateModal(true);
  };

  const openDeleteModal = (compliance) => {
    setSelectedCompliance(compliance);
    setShowDeleteModal(true);
  };

  const addRequirement = () => {
    setComplianceData({
      ...complianceData,
      requirements: [...complianceData.requirements, ""],
    });
  };

  const removeRequirement = (index) => {
    const newRequirements = complianceData.requirements.filter(
      (_, i) => i !== index
    );
    setComplianceData({
      ...complianceData,
      requirements: newRequirements.length > 0 ? newRequirements : [""],
    });
  };

  const updateRequirement = (index, value) => {
    const newRequirements = [...complianceData.requirements];
    newRequirements[index] = value;
    setComplianceData({
      ...complianceData,
      requirements: newRequirements,
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Compliant: "bg-green-100 text-green-800",
      "Non-Compliant": "bg-red-100 text-red-800",
      "Under Review": "bg-blue-100 text-blue-800",
      Pending: "bg-yellow-100 text-yellow-800",
    };

    const statusIcons = {
      Compliant: <CheckCircleIcon className="h-4 w-4" />,
      "Non-Compliant": <ExclamationCircleIcon className="h-4 w-4" />,
      "Under Review": <ClockIcon className="h-4 w-4" />,
      Pending: <ExclamationTriangleIcon className="h-4 w-4" />,
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

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      Critical: "bg-red-100 text-red-800",
      High: "bg-orange-100 text-orange-800",
      Medium: "bg-yellow-100 text-yellow-800",
      Low: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityConfig[priority]}`}
      >
        {priority}
      </span>
    );
  };

  const complianceColumns = [
    {
      header: "Title",
      accessor: "title",
      renderer: (compliance) => (
        <div>
          <div className="font-semibold text-gray-900">{compliance.title}</div>
          <div className="text-sm text-gray-500">
            {compliance.customCategory || compliance.category}
          </div>
          {compliance.complianceProgram && (
            <div className="text-xs text-blue-600 mt-1">
              Program: {compliance.complianceProgram.name}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (compliance) => getStatusBadge(compliance.status),
    },
    {
      header: "Priority",
      accessor: "priority",
      renderer: (compliance) => getPriorityBadge(compliance.priority),
    },
    {
      header: "Due Date",
      accessor: "dueDate",
      renderer: (compliance) => (
        <div className="text-sm text-gray-900">
          {compliance.dueDate
            ? new Date(compliance.dueDate).toLocaleDateString()
            : "N/A"}
        </div>
      ),
    },
    {
      header: "Next Audit",
      accessor: "nextAudit",
      renderer: (compliance) => (
        <div className="text-sm text-gray-900">
          {compliance.nextAudit
            ? new Date(compliance.nextAudit).toLocaleDateString()
            : "N/A"}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      renderer: (compliance) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openViewModal(compliance)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Compliance"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          {user?.role?.level >= 700 &&
            (compliance.createdBy?._id === (user._id || user.id) ||
              compliance.createdBy?.id === (user._id || user.id)) && (
              <>
                <button
                  onClick={() => openEditModal(compliance)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit Compliance"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                {(user?.role?.level >= 1000 ||
                  compliance.createdBy?._id === (user._id || user.id) ||
                  compliance.createdBy?.id === (user._id || user.id)) && (
                  <button
                    onClick={() => openDeleteModal(compliance)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Compliance"
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
          <h1 className="text-3xl font-bold text-gray-900">Compliance Items</h1>
          <p className="text-gray-600 mt-1">
            Track and manage individual compliance requirements
          </p>
        </div>
        {user?.role?.level >= 700 && (
          <button
            onClick={() => {
              if (compliancePrograms.length === 0) {
                toast.info(
                  "No compliance programs found. Please create a compliance program first."
                );
                return;
              }
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Compliance Item</span>
          </button>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">
                Compliance Items ({complianceItems.length})
              </h3>
            </div>
            <div className="relative w-full max-w-xs">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search compliance items..."
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
            data={filteredCompliance}
            columns={complianceColumns}
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
      </div>

      {/* Create Compliance Modal */}
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
                      {isEditMode
                        ? "Edit Compliance Item"
                        : "Create Compliance Item"}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {isEditMode
                        ? "Update the compliance requirement"
                        : "Add a new compliance requirement"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating || updating}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                <form onSubmit={handleCreateCompliance} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Compliance Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={complianceData.title}
                        onChange={(e) =>
                          setComplianceData({
                            ...complianceData,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                        placeholder="Enter compliance title"
                      />
                    </div>

                    {/* Compliance Program Selection */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Compliance Program{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={complianceData.complianceProgram}
                        onChange={(e) =>
                          setComplianceData({
                            ...complianceData,
                            complianceProgram: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      >
                        <option value="">Select compliance program</option>
                        {compliancePrograms.map((program) => (
                          <option key={program._id} value={program._id}>
                            {program.name} ({program.category})
                          </option>
                        ))}
                      </select>
                      {compliancePrograms.length === 0 && (
                        <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-700">
                            No compliance programs found. Please create a
                            compliance program first.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={complianceData.category}
                        onChange={(e) => {
                          const value = e.target.value;
                          setComplianceData({
                            ...complianceData,
                            category: value,
                          });
                          if (value !== "Other") {
                            setCustomCategory("");
                          }
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      >
                        <option value="">Select category</option>
                        {complianceCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {complianceData.category === "Other" && (
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
                        value={complianceData.status}
                        onChange={(e) =>
                          setComplianceData({
                            ...complianceData,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      >
                        {complianceStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={complianceData.priority}
                        onChange={(e) =>
                          setComplianceData({
                            ...complianceData,
                            priority: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      >
                        {priorityLevels.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={complianceData.dueDate}
                        onChange={(e) =>
                          setComplianceData({
                            ...complianceData,
                            dueDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      />
                    </div>

                    {/* Next Audit */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Next Audit Date
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={complianceData.nextAudit}
                        onChange={(e) =>
                          setComplianceData({
                            ...complianceData,
                            nextAudit: e.target.value,
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
                      value={complianceData.description}
                      onChange={(e) =>
                        setComplianceData({
                          ...complianceData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      placeholder="Enter compliance description"
                    />
                  </div>

                  {/* Requirements */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Requirements <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      {complianceData.requirements.map((requirement, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            required
                            value={requirement}
                            onChange={(e) =>
                              updateRequirement(index, e.target.value)
                            }
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            placeholder={`Requirement ${index + 1}`}
                          />
                          {complianceData.requirements.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRequirement(index)}
                              className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addRequirement}
                        className="flex items-center space-x-2 px-4 py-2 text-[var(--elra-primary)] hover:bg-[var(--elra-primary)]/10 rounded-xl transition-colors"
                      >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add Requirement</span>
                      </button>
                    </div>
                  </div>

                  {/* Findings */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Findings
                    </label>
                    <textarea
                      value={complianceData.findings}
                      onChange={(e) =>
                        setComplianceData({
                          ...complianceData,
                          findings: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      placeholder="Enter compliance findings (optional)"
                    />
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
                  onClick={handleCreateCompliance}
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
                      <span>{isEditMode ? "Update Item" : "Create Item"}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Compliance Modal */}
      <AnimatePresence>
        {showViewModal && selectedCompliance && (
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
                    <ShieldCheckIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedCompliance.title}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {selectedCompliance.customCategory ||
                        selectedCompliance.category}
                    </p>
                    {selectedCompliance.complianceProgram && (
                      <p className="text-sm text-blue-600 mt-1">
                        Program: {selectedCompliance.complianceProgram.name}
                      </p>
                    )}
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
                  {/* Compliance Info */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Status
                      </div>
                      <div className="mt-1">
                        {getStatusBadge(selectedCompliance.status)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Priority
                      </div>
                      <div className="mt-1">
                        {getPriorityBadge(selectedCompliance.priority)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Due Date
                      </div>
                      <div className="mt-1 text-gray-900">
                        {selectedCompliance.dueDate
                          ? new Date(
                              selectedCompliance.dueDate
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Next Audit
                      </div>
                      <div className="mt-1 text-gray-900">
                        {selectedCompliance.nextAudit
                          ? new Date(
                              selectedCompliance.nextAudit
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Program Information */}
                  {selectedCompliance.complianceProgram && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Program Information
                      </h3>
                      <div className="bg-blue-50 p-4 rounded-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                              Program Name
                            </div>
                            <div className="mt-1 text-gray-900">
                              {selectedCompliance.complianceProgram.name}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                              Program Owner
                            </div>
                            <div className="mt-1 text-gray-900">
                              {selectedCompliance.complianceProgram
                                .programOwner || "Not set"}
                            </div>
                          </div>
                        </div>
                        {selectedCompliance.complianceProgram
                          .applicableProjectScopes &&
                          selectedCompliance.complianceProgram
                            .applicableProjectScopes.length > 0 && (
                            <div className="mt-4">
                              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Applicable Project Scopes (Inherited from
                                Program)
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedCompliance.complianceProgram.applicableProjectScopes.map(
                                  (scope) => (
                                    <span
                                      key={scope}
                                      className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800"
                                    >
                                      {scope}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedCompliance.description}
                    </p>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Requirements
                    </h3>
                    <div className="space-y-2">
                      {(selectedCompliance.requirements || []).map(
                        (requirement, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="flex-shrink-0 w-6 h-6 bg-[var(--elra-primary)] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </span>
                            <span className="text-gray-700">{requirement}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Findings */}
                  {selectedCompliance.findings && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Findings
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-gray-700 leading-relaxed">
                          {selectedCompliance.findings}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedCompliance && (
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
                  Delete Compliance Item
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete "{selectedCompliance.title}"?
                  This action cannot be undone.
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
                    onClick={handleDeleteCompliance}
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

export default ComplianceItems;
