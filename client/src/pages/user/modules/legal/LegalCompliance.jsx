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
import { legalComplianceProgramAPI } from "../../../../services/legalAPI";

const LegalCompliance = () => {
  const { user } = useAuth();

  const [compliancePrograms, setCompliancePrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);

  const [selectedProgram, setSelectedProgram] = useState(null);

  const [programData, setProgramData] = useState({
    name: "",
    description: "",
    category: "",
    customCategory: "",
    status: "Draft",
    priority: "Medium",
    effectiveDate: "",
    reviewDate: "",
    programOwner: "",
    applicableProjectScopes: ["departmental", "external"],
    objectives: [""],
    kpis: [{ name: "", target: "", unit: "" }],
  });

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [programCategories, setProgramCategories] = useState([]);

  const programStatuses = ["Active", "Draft", "Archived", "Under Review"];
  const priorityLevels = ["Critical", "High", "Medium", "Low"];

  const projectScopes = [
    { value: "personal", label: "Personal Projects", icon: "👤" },
    { value: "departmental", label: "Departmental Projects", icon: "🏢" },
    { value: "external", label: "External Projects", icon: "🌐" },
  ];

  useEffect(() => {
    fetchCompliancePrograms();
    fetchProgramCategories();
  }, []);

  const fetchCompliancePrograms = async () => {
    try {
      setLoading(true);
      const data = await legalComplianceProgramAPI.getCompliancePrograms();
      if (data.success) {
        setCompliancePrograms(data.data.compliancePrograms || []);
        setFilteredPrograms(data.data.compliancePrograms || []);
      } else {
        toast.error(data.message || "Failed to load compliance programs");
      }
    } catch (error) {
      console.error("Error fetching compliance programs:", error);
      toast.error("Error loading compliance programs");
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramCategories = async () => {
    try {
      const categories =
        await legalComplianceProgramAPI.getComplianceProgramCategories();
      setProgramCategories(categories);
    } catch (error) {
      console.error("Error fetching program categories:", error);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPrograms(compliancePrograms);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = compliancePrograms.filter(
      (program) =>
        program.name?.toLowerCase().includes(searchLower) ||
        program.description?.toLowerCase().includes(searchLower) ||
        program.category?.toLowerCase().includes(searchLower) ||
        program.status?.toLowerCase().includes(searchLower) ||
        program.priority?.toLowerCase().includes(searchLower)
    );
    setFilteredPrograms(filtered);
  }, [searchTerm, compliancePrograms]);

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (
      !programData.name ||
      !programData.description ||
      !programData.category ||
      !programData.effectiveDate ||
      !programData.reviewDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate KPI fields
    const invalidKPIs = programData.kpis.filter(
      (kpi) =>
        kpi.name.trim() === "" ||
        kpi.target.trim() === "" ||
        kpi.unit.trim() === ""
    );
    if (invalidKPIs.length > 0) {
      toast.error("Please fill in all KPI fields (Name, Target, and Unit)");
      return;
    }

    // Validate dates are not in the past
    const today = new Date().toISOString().split("T")[0];
    if (programData.reviewDate < today) {
      toast.error("Review date cannot be in the past");
      return;
    }
    if (programData.effectiveDate < today) {
      toast.error("Effective date cannot be in the past");
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
        ...programData,
        category: programData.category,
        customCategory:
          programData.category === "Other"
            ? programData.customCategory
            : undefined,
        objectives: programData.objectives.filter((obj) => obj.trim() !== ""),
        kpis: programData.kpis.filter(
          (kpi) => kpi.name.trim() !== "" && kpi.target.trim() !== ""
        ),
      };

      let data;
      if (isEditMode) {
        data = await legalComplianceProgramAPI.updateComplianceProgram(
          selectedProgram._id,
          payload
        );
      } else {
        data = await legalComplianceProgramAPI.createComplianceProgram(payload);
      }

      if (data.success) {
        toast.success(
          `Compliance program ${
            isEditMode ? "updated" : "created"
          } successfully`
        );
        setShowCreateModal(false);
        resetProgramForm();
        fetchCompliancePrograms();
      } else {
        toast.error(
          data.message ||
            `Failed to ${isEditMode ? "update" : "create"} compliance program`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} compliance program:`,
        error
      );
      toast.error(
        `Failed to ${isEditMode ? "update" : "create"} compliance program`
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

  const handleDeleteProgram = async () => {
    try {
      setDeleting(true);

      const data = await legalComplianceProgramAPI.deleteComplianceProgram(
        selectedProgram._id
      );

      if (data.success) {
        toast.success("Compliance program deleted successfully");
        setShowDeleteModal(false);
        fetchCompliancePrograms();
      } else {
        toast.error(data.message || "Failed to delete compliance program");
      }
    } catch (error) {
      console.error("Error deleting compliance program:", error);
      toast.error("Failed to delete compliance program");
    } finally {
      setDeleting(false);
    }
  };

  const resetProgramForm = () => {
    const today = new Date().toISOString().split("T")[0];
    setProgramData({
      name: "",
      description: "",
      category: "",
      customCategory: "",
      status: "Draft",
      priority: "Medium",
      reviewDate: "",
      effectiveDate: "",
      programOwner: "",
      applicableProjectScopes: ["departmental", "external"],
      objectives: [""],
      kpis: [{ name: "", target: "", unit: "" }],
    });
    setSelectedProgram(null);
    setIsEditMode(false);
  };

  const openViewModal = (program) => {
    setSelectedProgram(program);
    setShowViewModal(true);
  };

  const openEditModal = (program) => {
    setSelectedProgram(program);
    setProgramData({
      name: program.name,
      description: program.description,
      category: program.customCategory ? "Other" : program.category,
      customCategory: program.customCategory || "",
      status: program.status,
      priority: program.priority,
      effectiveDate: program.effectiveDate
        ? new Date(program.effectiveDate).toISOString().split("T")[0]
        : "",
      reviewDate: program.reviewDate
        ? new Date(program.reviewDate).toISOString().split("T")[0]
        : "",
      programOwner: program.programOwner?._id || "",
      applicableProjectScopes: program.applicableProjectScopes || [
        "departmental",
        "external",
      ],
      objectives:
        program.objectives && program.objectives.length > 0
          ? program.objectives
          : [""],
      kpis:
        program.kpis && program.kpis.length > 0
          ? program.kpis
          : [{ name: "", target: "", unit: "" }],
    });
    setIsEditMode(true);
    setShowCreateModal(true);
  };

  const openDeleteModal = (program) => {
    setSelectedProgram(program);
    setShowDeleteModal(true);
  };

  // Program objective management
  const addObjective = () => {
    setProgramData({
      ...programData,
      objectives: [...programData.objectives, ""],
    });
  };

  const removeObjective = (index) => {
    const newObjectives = programData.objectives.filter((_, i) => i !== index);
    setProgramData({
      ...programData,
      objectives: newObjectives.length > 0 ? newObjectives : [""],
    });
  };

  const updateObjective = (index, value) => {
    const newObjectives = [...programData.objectives];
    newObjectives[index] = value;
    setProgramData({
      ...programData,
      objectives: newObjectives,
    });
  };

  // Program KPI management
  const addKPI = () => {
    setProgramData({
      ...programData,
      kpis: [...programData.kpis, { name: "", target: "", unit: "" }],
    });
  };

  const removeKPI = (index) => {
    const newKPIs = programData.kpis.filter((_, i) => i !== index);
    setProgramData({
      ...programData,
      kpis: newKPIs.length > 0 ? newKPIs : [{ name: "", target: "", unit: "" }],
    });
  };

  const updateKPI = (index, field, value) => {
    const newKPIs = [...programData.kpis];
    newKPIs[index] = { ...newKPIs[index], [field]: value };
    setProgramData({
      ...programData,
      kpis: newKPIs,
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Active: "bg-green-100 text-green-800",
      Draft: "bg-gray-100 text-gray-800",
      Archived: "bg-red-100 text-red-800",
      "Under Review": "bg-blue-100 text-blue-800",
    };

    const statusIcons = {
      Active: <CheckCircleIcon className="h-4 w-4" />,
      Draft: <ClockIcon className="h-4 w-4" />,
      Archived: <ExclamationCircleIcon className="h-4 w-4" />,
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

  const programColumns = [
    {
      header: "Program Name",
      accessor: "name",
      renderer: (program) => (
        <div>
          <div className="font-semibold text-gray-900">{program.name}</div>
          <div className="text-sm text-gray-500">
            {program.customCategory || program.category}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (program) => getStatusBadge(program.status),
    },
    {
      header: "Priority",
      accessor: "priority",
      renderer: (program) => getPriorityBadge(program.priority),
    },
    {
      header: "Effective Date",
      accessor: "effectiveDate",
      renderer: (program) => (
        <div className="text-sm text-gray-900">
          {program.effectiveDate
            ? new Date(program.effectiveDate).toLocaleDateString()
            : "N/A"}
        </div>
      ),
    },
    {
      header: "Review Date",
      accessor: "reviewDate",
      renderer: (program) => (
        <div className="text-sm text-gray-900">
          {program.reviewDate
            ? new Date(program.reviewDate).toLocaleDateString()
            : "N/A"}
        </div>
      ),
    },
    {
      header: "Program Owner",
      accessor: "programOwner",
      renderer: (program) => (
        <div className="text-sm text-gray-900">
          {program.programOwner === "ELRA"
            ? "ELRA"
            : program.programOwner?.firstName && program.programOwner?.lastName
            ? `${program.programOwner.firstName} ${program.programOwner.lastName}`
            : program.programOwner?.email || program.programOwner || "Not set"}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      renderer: (program) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openViewModal(program)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Program"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          {user?.role?.level >= 700 &&
            (program.createdBy?._id === (user._id || user.id) ||
              program.createdBy?.id === (user._id || user.id)) && (
              <>
                <button
                  onClick={() => openEditModal(program)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit Program"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                {(user?.role?.level >= 1000 ||
                  program.createdBy?._id === (user._id || user.id) ||
                  program.createdBy?.id === (user._id || user.id)) && (
                  <button
                    onClick={() => openDeleteModal(program)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Program"
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
          <h1 className="text-3xl font-bold text-gray-900">
            Compliance Programs
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage compliance program frameworks
          </p>
        </div>
        {user?.role?.level >= 700 && (
          <button
            onClick={() => {
              resetProgramForm();
              setShowCreateModal(true);
            }}
            className="bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Program</span>
          </button>
        )}
      </div>

      {/* Programs Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">
                Compliance Programs ({compliancePrograms.length})
              </h3>
            </div>
            <div className="relative w-full max-w-xs">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search compliance programs..."
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
            data={filteredPrograms}
            columns={programColumns}
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

      {/* Create Program Modal */}
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
                        ? "Edit Compliance Program"
                        : "Create Compliance Program"}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {isEditMode
                        ? "Update the compliance program"
                        : "Add a new compliance program"}
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
                <form onSubmit={handleCreateProgram} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Program Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Program Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={programData.name}
                        onChange={(e) =>
                          setProgramData({
                            ...programData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                        placeholder="Enter program name"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={programData.category}
                        onChange={(e) => {
                          const value = e.target.value;
                          setProgramData({
                            ...programData,
                            category: value,
                          });
                          if (value !== "Other") {
                            setProgramData((prev) => ({
                              ...prev,
                              customCategory: "",
                            }));
                          }
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      >
                        <option value="">Select category</option>
                        {programCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {programData.category === "Other" && (
                        <div className="mt-3">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Specify Category
                          </label>
                          <input
                            type="text"
                            value={programData.customCategory}
                            onChange={(e) =>
                              setProgramData((prev) => ({
                                ...prev,
                                customCategory: e.target.value,
                              }))
                            }
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
                        value={programData.status}
                        onChange={(e) =>
                          setProgramData({
                            ...programData,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      >
                        {programStatuses.map((status) => (
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
                        value={programData.priority}
                        onChange={(e) =>
                          setProgramData({
                            ...programData,
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

                    {/* Review Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Review Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={programData.reviewDate}
                        onChange={(e) =>
                          setProgramData({
                            ...programData,
                            reviewDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      />
                    </div>

                    {/* Effective Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Effective Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={programData.effectiveDate}
                        onChange={(e) =>
                          setProgramData({
                            ...programData,
                            effectiveDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      />
                    </div>

                    {/* Program Owner */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Program Owner
                      </label>
                      <input
                        type="text"
                        value={programData.programOwner}
                        onChange={(e) =>
                          setProgramData({
                            ...programData,
                            programOwner: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                        placeholder="Optional: Enter external company/individual name (leave blank for ELRA internal)"
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
                      value={programData.description}
                      onChange={(e) =>
                        setProgramData({
                          ...programData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                      placeholder="Enter program description"
                    />
                  </div>

                  {/* Objectives */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Objectives
                    </label>
                    <div className="space-y-3">
                      {programData.objectives.map((objective, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={objective}
                            onChange={(e) =>
                              updateObjective(index, e.target.value)
                            }
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            placeholder={`Objective ${index + 1}`}
                          />
                          {programData.objectives.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeObjective(index)}
                              className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addObjective}
                        className="flex items-center space-x-2 px-4 py-2 text-[var(--elra-primary)] hover:bg-[var(--elra-primary)]/10 rounded-xl transition-colors"
                      >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add Objective</span>
                      </button>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Key Performance Indicators (KPIs)
                    </label>
                    <div className="space-y-3">
                      {programData.kpis.map((kpi, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 md:grid-cols-4 gap-3"
                        >
                          <input
                            type="text"
                            value={kpi.name}
                            onChange={(e) =>
                              updateKPI(index, "name", e.target.value)
                            }
                            className={`px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 ${
                              kpi.name.trim() === ""
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200"
                            }`}
                            placeholder="e.g., Compliance Rate, Legal Review Time, Risk Mitigation Score"
                            required
                          />
                          <input
                            type="text"
                            value={kpi.target}
                            onChange={(e) => {
                              // Validate numeric input for target
                              const value = e.target.value;
                              if (value === "" || /^\d+(\.\d+)?$/.test(value)) {
                                updateKPI(index, "target", value);
                              }
                            }}
                            className={`px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 ${
                              kpi.target.trim() === ""
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200"
                            }`}
                            placeholder="e.g., 100, 48, 95"
                            required
                          />
                          <input
                            type="text"
                            value={kpi.unit}
                            onChange={(e) =>
                              updateKPI(index, "unit", e.target.value)
                            }
                            className={`px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200 ${
                              kpi.unit.trim() === ""
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200"
                            }`}
                            placeholder="e.g., %, hours, days, count"
                            required
                          />
                          {programData.kpis.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeKPI(index)}
                              className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addKPI}
                        className="flex items-center space-x-2 px-4 py-2 text-[var(--elra-primary)] hover:bg-[var(--elra-primary)]/10 rounded-xl transition-colors"
                      >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add KPI</span>
                      </button>
                    </div>
                  </div>

                  {/* Project Scopes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Applicable Project Scopes
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={
                            programData.applicableProjectScopes.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProgramData({
                                ...programData,
                                applicableProjectScopes: [
                                  "departmental",
                                  "external",
                                ],
                              });
                            } else {
                              setProgramData({
                                ...programData,
                                applicableProjectScopes: [],
                              });
                            }
                          }}
                          className="w-4 h-4 text-[var(--elra-primary)] bg-gray-100 border-gray-300 rounded focus:ring-[var(--elra-primary)] focus:ring-2"
                        />
                        <span className="text-sm text-gray-600">
                          Enable Project Scopes
                        </span>
                      </label>
                    </div>
                    {programData.applicableProjectScopes.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {projectScopes.map((scope) => (
                          <motion.label
                            key={scope.value}
                            className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                              programData.applicableProjectScopes.includes(
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
                              checked={programData.applicableProjectScopes.includes(
                                scope.value
                              )}
                              onChange={(e) => {
                                const scopes = e.target.checked
                                  ? [
                                      ...programData.applicableProjectScopes,
                                      scope.value,
                                    ]
                                  : programData.applicableProjectScopes.filter(
                                      (s) => s !== scope.value
                                    );
                                setProgramData({
                                  ...programData,
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
                            {programData.applicableProjectScopes.includes(
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
                    resetProgramForm();
                  }}
                  disabled={creating || updating}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleCreateProgram}
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
                        {isEditMode ? "Update Program" : "Create Program"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Program Modal */}
      <AnimatePresence>
        {showViewModal && selectedProgram && (
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
                      {selectedProgram.name}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {selectedProgram.customCategory ||
                        selectedProgram.category}
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
                  {/* Program Info */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Status
                      </div>
                      <div className="mt-1">
                        {getStatusBadge(selectedProgram.status)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Priority
                      </div>
                      <div className="mt-1">
                        {getPriorityBadge(selectedProgram.priority)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Effective Date
                      </div>
                      <div className="mt-1 text-gray-900">
                        {selectedProgram.effectiveDate
                          ? new Date(
                              selectedProgram.effectiveDate
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Review Date
                      </div>
                      <div className="mt-1 text-gray-900">
                        {selectedProgram.reviewDate
                          ? new Date(
                              selectedProgram.reviewDate
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Project Scopes */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Applicable Project Scopes
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedProgram.applicableProjectScopes || []).map(
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

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedProgram.description}
                    </p>
                  </div>

                  {/* Objectives */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Objectives
                    </h3>
                    {selectedProgram.objectives &&
                    selectedProgram.objectives.length > 0 ? (
                      <div className="space-y-2">
                        {selectedProgram.objectives.map((objective, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="flex-shrink-0 w-6 h-6 bg-[var(--elra-primary)] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </span>
                            <span className="text-gray-700">{objective}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">Not set</div>
                    )}
                  </div>

                  {/* Program Owner */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Program Owner
                    </h3>
                    <div className="text-gray-700">
                      {selectedProgram.programOwner === "ELRA"
                        ? "ELRA"
                        : selectedProgram.programOwner?.firstName &&
                          selectedProgram.programOwner?.lastName
                        ? `${selectedProgram.programOwner.firstName} ${selectedProgram.programOwner.lastName}`
                        : selectedProgram.programOwner?.email ||
                          selectedProgram.programOwner ||
                          "Not set"}
                    </div>
                  </div>

                  {/* KPIs */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Key Performance Indicators (KPIs)
                    </h3>
                    {selectedProgram.kpis &&
                    selectedProgram.kpis.length > 0 &&
                    selectedProgram.kpis.some(
                      (kpi) => kpi.name || kpi.target || kpi.unit
                    ) ? (
                      <div className="space-y-3">
                        {selectedProgram.kpis.map(
                          (kpi, index) =>
                            (kpi.name || kpi.target || kpi.unit) && (
                              <div
                                key={index}
                                className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div>
                                  <div className="text-sm font-semibold text-gray-600">
                                    Name
                                  </div>
                                  <div className="text-gray-900">
                                    {kpi.name || "Not set"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-600">
                                    Target
                                  </div>
                                  <div className="text-gray-900">
                                    {kpi.target || "Not set"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-600">
                                    Unit
                                  </div>
                                  <div className="text-gray-900">
                                    {kpi.unit || "Not set"}
                                  </div>
                                </div>
                              </div>
                            )
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">Not set</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedProgram && (
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
                  Delete Compliance Program
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete "{selectedProgram.name}"? This
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
                    onClick={handleDeleteProgram}
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

export default LegalCompliance;
