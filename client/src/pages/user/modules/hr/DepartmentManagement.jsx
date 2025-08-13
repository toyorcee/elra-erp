import React, { useState, useEffect } from "react";
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { userModulesAPI } from "../../../../services/userModules.js";

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    managerId: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await userModulesAPI.departments.getAllDepartments();
      console.log("Departments response:", response);
      setDepartments(response.data || []);
    } catch (error) {
      console.error("Error loading departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await userModulesAPI.departments.updateDepartment(
          editingDepartment.id,
          formData
        );
      } else {
        await userModulesAPI.departments.createDepartment(formData);
      }
      setShowModal(false);
      setEditingDepartment(null);
      setFormData({
        name: "",
        description: "",
        code: "",
        managerId: "",
        status: "ACTIVE",
      });
      loadDepartments();
    } catch (error) {
      console.error("Error saving department:", error);
      alert(error.response?.data?.message || "Error saving department");
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description,
      code: department.code,
      managerId: department.managerId || "",
      status: department.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (departmentId) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await userModulesAPI.departments.deleteDepartment(departmentId);
        loadDepartments();
      } catch (error) {
        console.error("Error deleting department:", error);
        alert(error.response?.data?.message || "Error deleting department");
      }
    }
  };

  const openCreateModal = () => {
    setEditingDepartment(null);
    setFormData({
      name: "",
      description: "",
      code: "",
      managerId: "",
      status: "ACTIVE",
    });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-[var(--elra-bg-light)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  Department Management
                </h1>
                <p className="text-[var(--elra-text-secondary)]">
                  Manage company departments and their configurations
                </p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:opacity-90 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Department</span>
            </button>
          </div>
        </div>

        {/* Departments Grid */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 border border-[var(--elra-border-primary)]">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
              <span className="ml-3 text-[var(--elra-text-secondary)]">
                Loading departments...
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((department) => (
              <div
                key={department._id}
                className="bg-white rounded-xl shadow-lg border border-[var(--elra-border-primary)] overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-[var(--elra-bg-secondary)] rounded-lg">
                        <BuildingOfficeIcon className="h-5 w-5 text-[var(--elra-primary)]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--elra-text-primary)]">
                          {department.name}
                        </h3>
                        {department.code && (
                          <p className="text-sm text-[var(--elra-text-secondary)]">
                            Code: {department.code}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(department)}
                        className="p-1 text-[var(--elra-text-secondary)] hover:text-[var(--elra-primary)] rounded"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(department._id)}
                        className="p-1 text-[var(--elra-text-secondary)] hover:text-red-500 rounded"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[var(--elra-text-secondary)] text-sm mb-4 line-clamp-2">
                    {department.description || "No description provided"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="h-4 w-4 text-[var(--elra-text-secondary)]" />
                      <span className="text-sm text-[var(--elra-text-secondary)]">
                        {department.employeeCount || 0} employees
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        department.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {department.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && departments.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 border border-[var(--elra-border-primary)] text-center">
            <BuildingOfficeIcon className="h-12 w-12 text-[var(--elra-text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--elra-text-primary)] mb-2">
              No departments found
            </h3>
            <p className="text-[var(--elra-text-secondary)] mb-6">
              Get started by creating your first department
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:opacity-90 transition-colors flex items-center space-x-2 mx-auto"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Department</span>
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[var(--elra-text-primary)]">
                    {editingDepartment
                      ? "Edit Department"
                      : "Create Department"}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1 text-[var(--elra-text-secondary)] hover:text-[var(--elra-text-primary)] rounded"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                      placeholder="e.g., Information Technology"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Department Code
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                      placeholder="e.g., IT"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)] resize-none"
                      placeholder="Brief description of the department..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-[var(--elra-text-secondary)] hover:text-[var(--elra-text-primary)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:opacity-90 transition-colors flex items-center space-x-2"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>{editingDepartment ? "Update" : "Create"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentManagement;
