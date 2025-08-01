import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCog,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineShieldCheck,
  HiOutlineCheck,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import {
  getWorkflowTemplates,
  createWorkflowTemplate,
  updateWorkflowTemplate,
  deleteWorkflowTemplate,
} from "../../services/workflowTemplates";
import { getApprovalLevels } from "../../services/approvalLevels";

const WorkflowTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    documentType: "",
    steps: [],
  });

  // NAIC-specific document types
  const availableDocumentTypes = [
    "insurance_policy",
    "claims_document",
    "financial_report",
    "client_correspondence",
    "regulatory_compliance",
    "underwriting_document",
    "general",
  ];

  const [approvalLevels, setApprovalLevels] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchTemplates();
    fetchApprovalLevels();
  }, []);

  const fetchApprovalLevels = async () => {
    try {
      const response = await getApprovalLevels();
      setApprovalLevels(response.data || []);
    } catch (error) {
      console.error("Failed to fetch approval levels:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await getWorkflowTemplates();
      setTemplates(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch workflow templates");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.documentType) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      if (editingTemplate) {
        await updateWorkflowTemplate(editingTemplate._id, formData);
        toast.success("Workflow template updated successfully");
      } else {
        await createWorkflowTemplate(formData);
        toast.success("Workflow template created successfully");
      }

      setShowModal(false);
      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save workflow template"
      );
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name || "",
      description: template.description || "",
      documentType: template.documentType || "",
      steps: template.steps || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this workflow template?")
    ) {
      return;
    }

    try {
      setDeleteLoading(id);
      await deleteWorkflowTemplate(id);
      toast.success("Workflow template deleted successfully");
      fetchTemplates();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete workflow template"
      );
      console.error(error);
    } finally {
      setDeleteLoading(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      documentType: "",
      steps: [],
    });
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    resetForm();
  };

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          order: prev.steps.length + 1,
          approvalLevel: "",
          isRequired: true,
          canSkip: false,
          autoApprove: false,
          conditions: {
            amount: null,
            documentType: [],
            department: [],
            priority: "medium",
          },
          actions: [
            {
              type: "approve",
              target: "",
              message: "",
            },
          ],
        },
      ],
    }));
  };

  const removeStep = (index) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const updateStep = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      ),
    }));
  };

  const updateStepCondition = (stepIndex, conditionField, value) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) =>
        i === stepIndex
          ? {
              ...step,
              conditions: { ...step.conditions, [conditionField]: value },
            }
          : step
      ),
    }));
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.documentType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <HiOutlineCog className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Workflow Templates
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage NAIC approval workflows
              </p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <HiOutlinePlus className="w-5 h-5" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
        <div className="relative">
          <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300"
          />
        </div>
      </div>

      {/* Workflow Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-200/50 rounded-xl mb-3"></div>
              <div className="h-4 bg-gray-200/50 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200/50 rounded-lg w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-xl border border-white/20 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiOutlineCog className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            No workflow templates found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm
              ? "Try adjusting your search"
              : "Get started by creating your first NAIC workflow template"}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <HiOutlinePlus className="w-5 h-5" />
              <span>Create Workflow</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template) => (
            <div
              key={template._id}
              className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl hover:bg-white/80 transition-all duration-300 transform hover:-translate-y-1 group h-full flex flex-col"
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <HiOutlineShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded-lg">
                        {template.documentType?.replace(/_/g, " ") || "All"}
                      </p>
                    </div>
                  </div>
                </div>

                {template.description && (
                  <div className="mb-6 flex-1">
                    <p className="text-gray-600 text-sm bg-gray-50/50 p-4 rounded-xl leading-relaxed">
                      {template.description}
                    </p>

                    {/* Audit Trail Information */}
                    <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <HiOutlineUser className="mr-1" />
                            Created by: {template.createdBy?.firstName}{" "}
                            {template.createdBy?.lastName}
                          </span>
                          <span className="flex items-center">
                            <HiOutlineClock className="mr-1" />
                            Created:{" "}
                            {new Date(template.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="flex items-center">
                          <HiOutlineArrowPath className="mr-1" />
                          Updated:{" "}
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4 bg-gradient-to-r from-gray-50/50 to-blue-50/30 p-3 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <HiOutlineDocumentText className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">
                      {template.steps?.length || 0} steps
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mt-auto">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 hover:shadow-md"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(template._id)}
                    disabled={deleteLoading === template._id}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteLoading === template._id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <HiOutlineTrash className="w-4 h-4" />
                    )}
                    <span>
                      {deleteLoading === template._id
                        ? "Deleting..."
                        : "Delete"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <HiOutlineCog className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {editingTemplate
                    ? "Edit Workflow Template"
                    : "Create Workflow Template"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Workflow Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300"
                    placeholder="e.g., Claims Processing Workflow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Document Type *
                  </label>
                  <select
                    required
                    value={formData.documentType}
                    onChange={(e) =>
                      setFormData({ ...formData, documentType: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300"
                  >
                    <option value="">Select document type</option>
                    {availableDocumentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-300"
                    placeholder="Describe the workflow process..."
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Workflow Steps
                    </label>
                    <button
                      type="button"
                      onClick={addStep}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-300"
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                      <span>Add Step</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.steps.map((step, index) => (
                      <div key={index} className="bg-gray-50/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-700">
                            Step {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Approval Level *
                            </label>
                            <select
                              required
                              value={step.approvalLevel}
                              onChange={(e) =>
                                updateStep(
                                  index,
                                  "approvalLevel",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 bg-white/80 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select approval level</option>
                              {approvalLevels.map((level) => (
                                <option key={level._id} value={level._id}>
                                  {level.name} (Level {level.level})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Priority
                            </label>
                            <select
                              value={step.conditions?.priority || "medium"}
                              onChange={(e) =>
                                updateStepCondition(
                                  index,
                                  "priority",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 bg-white/80 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={step.isRequired}
                              onChange={(e) =>
                                updateStep(
                                  index,
                                  "isRequired",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              Required
                            </span>
                          </label>

                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={step.canSkip}
                              onChange={(e) =>
                                updateStep(index, "canSkip", e.target.checked)
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              Can Skip
                            </span>
                          </label>

                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={step.autoApprove}
                              onChange={(e) =>
                                updateStep(
                                  index,
                                  "autoApprove",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              Auto Approve
                            </span>
                          </label>
                        </div>

                        {step.conditions?.amount && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Amount Threshold
                            </label>
                            <input
                              type="number"
                              placeholder="Amount threshold"
                              value={step.conditions.amount || ""}
                              onChange={(e) =>
                                updateStepCondition(
                                  index,
                                  "amount",
                                  parseFloat(e.target.value)
                                )
                              }
                              className="w-full px-3 py-2 bg-white/80 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100/80 backdrop-blur-sm rounded-xl hover:bg-gray-200/80 transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingTemplate ? "Update" : "Create"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTemplates;
