import React, { useState, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import DataTable from "../../../../components/common/DataTable";
import ELRALogo from "../../../../components/ELRALogo";
import { toast } from "react-toastify";
import * as departmentsAPI from "../../../../services/departments";

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [levelError, setLevelError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    level: 75,
    isActive: true,
  });

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const result = await departmentsAPI.getDepartments();
      if (result.success && result.data) {
        setDepartments(result.data);
      } else {
        toast.error("Failed to fetch departments");
      }
    } catch (error) {
      toast.error("Error fetching departments");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear level error when user changes level
    if (field === "level") {
      setLevelError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate level
    if (formData.level < 1 || formData.level > 100) {
      setLevelError("Level must be between 1 and 100");
      return;
    }

    // Check if level already exists
    const existingDept = departments.find(
      (dept) =>
        dept.level === formData.level &&
        (!editingDepartment || dept._id !== editingDepartment._id)
    );

    if (existingDept) {
      setLevelError("Level already exists");
      return;
    }

    try {
      setIsSubmitting(true);

      let result;
      if (editingDepartment) {
        result = await departmentsAPI.updateDepartment(
          editingDepartment._id,
          formData
        );
      } else {
        result = await departmentsAPI.createDepartment(formData);
      }

      if (result.success) {
        toast.success(
          editingDepartment
            ? "Department updated successfully"
            : "Department created successfully"
        );
        setShowModal(false);
        resetForm();
        fetchDepartments();
      } else {
        toast.error(result.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error:", error);

      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes("level")) {
          setLevelError("Level already exists");
          toast.error("Department level must be unique");
        } else if (errorMessage.includes("name")) {
          toast.error("Department name must be unique");
        } else if (errorMessage.includes("code")) {
          toast.error("Department code must be unique");
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error("An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      level: 75,
      isActive: true,
    });
    setEditingDepartment(null);
    setLevelError("");
  };

  const handleEdit = (department) => {
    console.log("Editing department:", department);
    setEditingDepartment(department);
    setFormData({
      name: department.name || "",
      code: department.code || "",
      description: department.description || "",
      level: department.level || 75,
      isActive: department.isActive !== undefined ? department.isActive : true,
    });
    setLevelError("");
    setShowModal(true);
  };

  const handleDelete = (department) => {
    setDeleteTarget(department);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsSubmitting(true);
      const result = await departmentsAPI.deleteDepartment(deleteTarget._id);

      if (result.success) {
        toast.success("Department deleted successfully");
        fetchDepartments();
        setShowDeleteModal(false);
        setDeleteTarget(null);
      } else {
        toast.error(result.message || "Failed to delete department");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table columns configuration
  const columns = [
    {
      header: "Department Name",
      key: "name",
      renderer: (dept) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[var(--elra-primary)] rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {dept.code ? dept.code.slice(0, 3) : "N/A"}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{dept.name}</div>
            <div
              className="text-sm text-gray-500 cursor-help"
              title={dept.description || ""}
            >
              {dept.description
                ? dept.description.slice(0, 30) +
                  (dept.description.length > 30 ? "..." : "")
                : ""}
            </div>
          </div>
        </div>
      ),
      skeletonRenderer: () => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      ),
    },
    {
      header: "Level",
      key: "level",
      renderer: (dept) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {dept.level}
        </span>
      ),
      skeletonRenderer: () => (
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      ),
    },
    {
      header: "Status",
      key: "isActive",
      renderer: (dept) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            dept.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {dept.isActive ? "Active" : "Inactive"}
        </span>
      ),
      skeletonRenderer: () => (
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Department Management
              </h1>
              <p className="text-gray-600">
                Manage company departments and structure
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)] transition-colors cursor-pointer"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Department
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <DataTable
            data={departments}
            columns={columns}
            loading={loading}
            actions={{
              onEdit: handleEdit,
              onDelete: handleDelete,
              showEdit: true,
              showDelete: true,
              showToggle: false,
            }}
          />
        </div>
      </div>

      {/* Department Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header - ELRA Branded */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <ELRALogo variant="dark" size="md" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {editingDepartment
                        ? "Edit Department"
                        : "Create New Department"}
                    </h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      ELRA Department Management System
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                      placeholder="e.g., Project Management"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Department Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) =>
                        handleInputChange("code", e.target.value.toUpperCase())
                      }
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                      placeholder="e.g., PM"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)] resize-none"
                    placeholder="Describe the department's purpose and responsibilities..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Department Level *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.level}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (isNaN(value) || value < 1 || value > 100) {
                          setLevelError("Level must be between 1 and 100");
                        } else {
                          setLevelError("");
                          handleInputChange("level", value);
                        }
                      }}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                      placeholder="e.g., 75"
                      min="1"
                      max="100"
                    />
                    {levelError && (
                      <p className="text-red-500 text-xs mt-1">{levelError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Status
                    </label>
                    <select
                      value={formData.isActive}
                      onChange={(e) =>
                        handleInputChange("isActive", e.target.value === "true")
                      }
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                    >
                      <option value={true}>Active</option>
                      <option value={false}>Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--elra-border-primary)]">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 text-sm font-medium text-[var(--elra-text-primary)] bg-white border border-[var(--elra-border-primary)] rounded-lg hover:bg-[var(--elra-secondary-3)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 text-sm font-medium text-white bg-[var(--elra-primary)] border border-transparent rounded-lg hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>
                          {editingDepartment ? "Updating..." : "Creating..."}
                        </span>
                      </div>
                    ) : editingDepartment ? (
                      "Update Department"
                    ) : (
                      "Create Department"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">
                  Delete Department
                </h3>
                <p className="text-white text-opacity-90 mt-1">
                  This action cannot be undone
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <svg
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Are you sure you want to delete this department?
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {deleteTarget.name}
                    </div>
                    {deleteTarget.code && (
                      <div className="text-sm text-gray-600 mb-2">
                        Code: {deleteTarget.code}
                      </div>
                    )}
                    {deleteTarget.description && (
                      <div className="text-sm text-gray-500">
                        {deleteTarget.description}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  This will permanently remove the department and all associated
                  data. This action cannot be undone.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTarget(null);
                  }}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={confirmDelete}
                  className="px-6 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    "Delete Department"
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

export default DepartmentManagement;
