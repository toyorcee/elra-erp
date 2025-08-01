import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { GradientSpinner } from "../../../components/common";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdPerson,
  MdBusiness,
  MdInfo,
} from "react-icons/md";
import { getApprovalLevels } from "../../../services/approvalLevels";

// API functions - using regular admin routes instead of super-admin
const fetchDepartments = async () => {
  const response = await fetch("/api/departments", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch departments");
  return response.json();
};

const fetchUsers = async () => {
  const response = await fetch("/api/users", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
};

const createDepartment = async (departmentData) => {
  const response = await fetch("/api/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(departmentData),
  });
  if (!response.ok) throw new Error("Failed to create department");
  return response.json();
};

const updateDepartment = async ({ id, departmentData }) => {
  const response = await fetch(`/api/departments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(departmentData),
  });
  if (!response.ok) throw new Error("Failed to update department");
  return response.json();
};

const deleteDepartment = async (id) => {
  const response = await fetch(`/api/departments/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to delete department");
  return response.json();
};

const DepartmentManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCapabilitiesModal, setShowCapabilitiesModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    level: 50,
    parentDepartment: "",
    manager: "",
    settings: {
      allowDocumentUpload: true,
      requireApproval: true,
      maxFileSize: 10,
      allowedFileTypes: ["pdf", "doc", "docx", "xls", "xlsx"],
    },
  });

  const queryClient = useQueryClient();

  const {
    data: departmentsData,
    isLoading: departmentsLoading,
    error: departmentsError,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const {
    data: approvalLevelsData,
    isLoading: approvalLevelsLoading,
    error: approvalLevelsError,
  } = useQuery({
    queryKey: ["approvalLevels"],
    queryFn: getApprovalLevels,
  });

  const createDepartmentMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries(["departments"]);
      toast.success("Department created successfully");
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: updateDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries(["departments"]);
      toast.success("Department updated successfully");
      setShowEditModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries(["departments"]);
      toast.success("Department deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      level: 50,
      parentDepartment: "",
      manager: "",
      settings: {
        allowDocumentUpload: true,
        requireApproval: true,
        maxFileSize: 10,
        allowedFileTypes: ["pdf", "doc", "docx", "xls", "xlsx"],
      },
    });
  };

  const handleCreateDepartment = () => {
    createDepartmentMutation.mutate(formData);
  };

  const handleUpdateDepartment = () => {
    updateDepartmentMutation.mutate({
      id: selectedDepartment._id,
      departmentData: formData,
    });
  };

  const handleEditDepartment = (department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      code: department.code || "",
      description: department.description || "",
      level: department.level || 50,
      parentDepartment: department.parentDepartment || "",
      manager: department.manager || "",
      settings: department.settings || {
        allowDocumentUpload: true,
        requireApproval: true,
        maxFileSize: 10,
        allowedFileTypes: ["pdf", "doc", "docx", "xls", "xlsx"],
      },
    });
    setShowEditModal(true);
  };

  const handleViewDepartment = (department) => {
    setSelectedDepartment(department);
    setShowViewModal(true);
  };

  const handleViewCapabilities = (department) => {
    setSelectedDepartment(department);
    setShowCapabilitiesModal(true);
  };

  const handleViewUsers = (department) => {
    setSelectedDepartment(department);
    setShowUsersModal(true);
  };

  const getDepartmentCapabilities = (department) => {
    if (!department) return [];

    const capabilities = [];

    // Document capabilities
    if (department.settings?.allowDocumentUpload) {
      capabilities.push({
        type: "document",
        action: "upload",
        icon: "📄",
        color: "blue",
        description: "Upload documents to the system",
      });
      capabilities.push({
        type: "document",
        action: "manage",
        icon: "📁",
        color: "blue",
        description: "Manage department documents",
      });
    }

    // Approval capabilities
    if (department.settings?.requireApproval) {
      capabilities.push({
        type: "workflow",
        action: "approve",
        icon: "✅",
        color: "green",
        description: "Approve documents and workflows",
      });
      capabilities.push({
        type: "workflow",
        action: "review",
        icon: "👁️",
        color: "green",
        description: "Review pending approvals",
      });
    }

    // Level-based capabilities
    if (department.level >= 40) {
      capabilities.push({
        type: "system",
        action: "executive",
        icon: "👑",
        color: "purple",
        description: "Executive-level decision making",
      });
      capabilities.push({
        type: "system",
        action: "strategy",
        icon: "🎯",
        color: "purple",
        description: "Strategic planning and oversight",
      });
    } else if (department.level >= 30) {
      capabilities.push({
        type: "system",
        action: "management",
        icon: "👔",
        color: "indigo",
        description: "Department management and leadership",
      });
      capabilities.push({
        type: "system",
        action: "coordination",
        icon: "🤝",
        color: "indigo",
        description: "Cross-department coordination",
      });
    } else if (department.level >= 20) {
      capabilities.push({
        type: "system",
        action: "supervision",
        icon: "👥",
        color: "orange",
        description: "Team supervision and oversight",
      });
    }

    // User management capabilities
    capabilities.push({
      type: "user",
      action: "view",
      icon: "👤",
      color: "gray",
      description: "View department members",
    });

    return capabilities;
  };

  const handleDeleteDepartment = (department) => {
    if (
      window.confirm(
        `Are you sure you want to delete the department "${department.name}"?`
      )
    ) {
      deleteDepartmentMutation.mutate(department._id);
    }
  };

  const toggleFileType = (fileType) => {
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        allowedFileTypes: prev.settings.allowedFileTypes.includes(fileType)
          ? prev.settings.allowedFileTypes.filter((type) => type !== fileType)
          : [...prev.settings.allowedFileTypes, fileType],
      },
    }));
  };

  const getDepartmentHierarchy = (departments) => {
    if (!Array.isArray(departments)) return [];

    const hierarchy = [];
    const parentMap = new Map();

    // Create parent-child map
    departments.forEach((dept) => {
      if (dept && dept.parentDepartment) {
        if (!parentMap.has(dept.parentDepartment)) {
          parentMap.set(dept.parentDepartment, []);
        }
        const children = parentMap.get(dept.parentDepartment);
        if (Array.isArray(children)) {
          children.push(dept);
        }
      } else if (dept) {
        hierarchy.push(dept);
      }
    });

    // Recursively add children
    const addChildren = (parent) => {
      if (!parent || !parent._id) return [];
      const children = parentMap.get(parent._id) || [];
      parent.children = children.map((child) => ({
        ...child,
        children: addChildren(child),
      }));
      return parent;
    };

    return hierarchy.map((dept) => addChildren(dept));
  };

  const renderDepartmentTree = (departments, level = 0) => {
    return departments.map((dept) => (
      <div key={dept._id} style={{ marginLeft: `${level * 24}px` }}>
        <div
          className={`bg-gray-50 rounded-lg shadow-sm p-4 border border-gray-200 mb-3 hover:shadow-md transition-shadow ${
            level > 0 ? "border-l-4 border-l-blue-500" : ""
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  level === 0
                    ? "bg-blue-600"
                    : level === 1
                    ? "bg-green-500"
                    : "bg-purple-500"
                }`}
              ></div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {dept.name}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Level {dept.level}
                  </span>
                  {dept.parentDepartment && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Child Dept
                    </span>
                  )}
                  {dept.children && dept.children.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Parent Dept ({dept.children.length} children)
                    </span>
                  )}
                </div>
                {dept.code && (
                  <p className="text-sm text-gray-500">Code: {dept.code}</p>
                )}
                <p className="text-sm text-gray-600">{dept.description}</p>
                {dept.parentDepartment && (
                  <p className="text-xs text-blue-600 mt-1">
                    ↳ Parent:{" "}
                    {departments.find((d) => d._id === dept.parentDepartment)
                      ?.name || "Unknown"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleViewDepartment(dept)}
                className="text-blue-600 hover:text-blue-800 cursor-pointer"
                title="View Department"
              >
                <MdVisibility className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleViewCapabilities(dept)}
                className="text-purple-600 hover:text-purple-800 cursor-pointer"
                title="View Capabilities"
              >
                <MdBusiness className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleEditDepartment(dept)}
                className="text-green-600 hover:text-green-800 cursor-pointer"
                title="Edit Department"
              >
                <MdEdit className="w-5 h-5" />
              </button>
              {dept.userCount === 0 && (
                <button
                  onClick={() => handleDeleteDepartment(dept)}
                  className="text-red-600 hover:text-red-800 cursor-pointer"
                  title="Delete Department"
                >
                  <MdDelete className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Level {dept.level}
              </span>
              {dept.manager && (
                <span className="flex items-center gap-1">
                  <MdPerson className="w-4 h-4" />
                  Manager: {dept.manager.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleViewUsers(dept)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                title="View Department Users"
              >
                <MdPerson className="w-4 h-4" />
                {dept.userCount || 0} users
              </button>
              <span>{dept.documentCount || 0} documents</span>
            </div>
          </div>
        </div>

        {dept.children && dept.children.length > 0 && (
          <div className="ml-4">
            {renderDepartmentTree(dept.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (departmentsLoading || usersLoading) return <GradientSpinner />;
  if (departmentsError)
    return (
      <div className="text-red-500">Error: {departmentsError.message}</div>
    );

  const departments = departmentsData?.data || [];
  const users = usersData?.data || [];
  const departmentHierarchy = getDepartmentHierarchy(departments);

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Department Management
          </h1>
          <p className="text-gray-600">
            Manage NAIC organizational departments and hierarchy
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 cursor-pointer"
        >
          <MdAdd className="w-5 h-5" />
          Create Department
        </button>
      </div>

      {/* Department Level Summary */}
      {departments.length > 0 && (
        <div className="mb-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MdBusiness className="w-5 h-5" />
            Department Level Overview
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(() => {
              if (!Array.isArray(departments)) return null;

              const levelGroups = departments.reduce((acc, dept) => {
                if (dept && typeof dept.level !== "undefined") {
                  const level = dept.level;
                  if (!acc[level]) acc[level] = [];
                  if (Array.isArray(acc[level])) {
                    acc[level].push(dept);
                  }
                }
                return acc;
              }, {});

              const sortedLevels = Object.keys(levelGroups).sort(
                (a, b) => parseInt(a) - parseInt(b)
              );

              return sortedLevels.map((level) => (
                <div
                  key={level}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      Level {level}
                    </div>
                    <div className="text-lg text-gray-700 mb-3">
                      {levelGroups[level]?.length || 0} department
                      {(levelGroups[level]?.length || 0) !== 1 ? "s" : ""}
                    </div>
                    <div className="text-sm text-gray-500">
                      {levelGroups[level]
                        ?.map((dept) => dept?.name || "Unknown")
                        .join(", ") || "No departments"}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Department Hierarchy Tree */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Department Hierarchy</h2>
          <div className="text-sm text-gray-600">
            {departments.filter((d) => d.parentDepartment).length} of{" "}
            {departments.length} departments have parent relationships
          </div>
        </div>

        {/* Approval Flow Information */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <MdInfo className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">
              📋 Document Approval Flow ({approvalLevelsData?.data?.length || 0}
              -Level System)
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                🔄 Complete Document Flow:
              </h4>
              <div className="space-y-2 text-sm">
                {approvalLevelsData?.data &&
                Array.isArray(approvalLevelsData.data) ? (
                  approvalLevelsData.data.map((level, index) => {
                    const colors = [
                      "bg-blue-100",
                      "bg-green-100",
                      "bg-yellow-100",
                      "bg-orange-100",
                      "bg-red-100",
                      "bg-purple-100",
                      "bg-indigo-100",
                      "bg-gray-100",
                    ];
                    const totalLevels = approvalLevelsData.data.length;
                    const isLast = index === totalLevels - 1;
                    return (
                      <div
                        key={level._id || index}
                        className="flex items-center gap-2"
                      >
                        <span
                          className={`w-6 h-6 ${
                            colors[index % colors.length]
                          } rounded-full flex items-center justify-center text-xs font-bold`}
                        >
                          {index + 1}
                        </span>
                        <span className={isLast ? "font-semibold" : ""}>
                          {index === 0 ? "Document Created → " : ""}
                          {level.department || "Unknown Department"} (Level{" "}
                          {level.level || "Unknown"})
                          {isLast ? " → APPROVED" : ""}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-500 italic">
                    Loading approval levels...
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                👥 User Role Approval Permissions:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                  <span className="font-medium">Level 10-15:</span> STAFF and
                  SENIOR_STAFF can approve
                </div>
                <div className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                  <span className="font-medium">Level 20-25:</span> SENIOR_STAFF
                  and SUPERVISOR can approve
                </div>
                <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <span className="font-medium">Level 30-35:</span> SUPERVISOR
                  can approve
                </div>
                <div className="p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                  <span className="font-medium">Level 40:</span> SUPERVISOR and
                  MANAGER can approve
                </div>
                <div className="p-2 bg-red-50 rounded border-l-4 border-red-400">
                  <span className="font-medium">Level 50:</span> MANAGER and
                  SUPER_ADMIN can approve
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Each document must be approved at every
              level before proceeding to the next. Users can only approve
              documents at their assigned department level and with appropriate
              role permissions.
            </p>
          </div>
        </div>

        {/* Hierarchy Status */}
        {departments.filter((d) => !d.parentDepartment).length > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MdInfo className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">
                Hierarchy Setup Required
              </h3>
            </div>
            <p className="text-blue-700 text-sm">
              {departments.filter((d) => !d.parentDepartment).length}{" "}
              departments are currently at the top level. Use the edit function
              to set parent departments and create a proper organizational
              hierarchy.
            </p>
          </div>
        )}

        {departmentHierarchy.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {renderDepartmentTree(departmentHierarchy)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <MdBusiness className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              No departments created yet. Create your first department to get
              started.
            </p>
          </div>
        )}
      </div>

      {/* Create Department Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Department</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md cursor-text"
                  placeholder="e.g., Information Technology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md cursor-text"
                  placeholder="e.g., IT"
                  maxLength="10"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md cursor-text"
                rows="3"
                placeholder="Describe the department's purpose and responsibilities..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Level
                </label>
                <input
                  type="number"
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher levels have more authority. Executive departments
                  typically use levels 40-50.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Department
                </label>
                <select
                  value={formData.parentDepartment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentDepartment: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">No Parent (Top Level)</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} (Level {dept.level}){" "}
                      {dept.parentDepartment
                        ? `↳ ${
                            departments.find(
                              (d) => d._id === dept.parentDepartment
                            )?.name || "Unknown"
                          }`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Manager
                </label>
                <select
                  value={formData.manager}
                  onChange={(e) =>
                    setFormData({ ...formData, manager: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">No Manager</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">
                Department Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.settings.allowDocumentUpload}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            allowDocumentUpload: e.target.checked,
                          },
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Allow Document Upload</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.settings.requireApproval}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            requireApproval: e.target.checked,
                          },
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Require Approval</span>
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max File Size (MB)
                </label>
                <input
                  type="number"
                  value={formData.settings.maxFileSize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        maxFileSize: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="1"
                  max="100"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed File Types
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    "pdf",
                    "doc",
                    "docx",
                    "xls",
                    "xlsx",
                    "ppt",
                    "pptx",
                    "txt",
                    "jpg",
                    "png",
                  ].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowedFileTypes.includes(
                          type
                        )}
                        onChange={() => toggleFileType(type)}
                        className="mr-2"
                      />
                      <span className="text-sm uppercase">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDepartment}
                disabled={createDepartmentMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {createDepartmentMutation.isPending
                  ? "Creating..."
                  : "Create Department"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Edit Department: {selectedDepartment?.name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  maxLength="10"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Level
                </label>
                <input
                  type="number"
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher levels have more authority. Executive departments
                  typically use levels 40-50.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Department
                </label>
                <select
                  value={formData.parentDepartment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentDepartment: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">No Parent (Top Level)</option>
                  {departments
                    .filter((dept) => dept._id !== selectedDepartment?._id)
                    .map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} (Level {dept.level}){" "}
                        {dept.parentDepartment
                          ? `↳ ${
                              departments.find(
                                (d) => d._id === dept.parentDepartment
                              )?.name || "Unknown"
                            }`
                          : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Manager
                </label>
                <select
                  value={formData.manager}
                  onChange={(e) =>
                    setFormData({ ...formData, manager: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">No Manager</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDepartment}
                disabled={updateDepartmentMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                {updateDepartmentMutation.isPending
                  ? "Updating..."
                  : "Update Department"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Department Modal */}
      {showViewModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Department Details: {selectedDepartment.name}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedDepartment.name}
                  </h3>
                  {selectedDepartment.code && (
                    <p className="text-sm text-gray-500">
                      Code: {selectedDepartment.code}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <p className="text-gray-900">
                  {selectedDepartment.description || "No description"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Department Level
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Level {selectedDepartment.level}
                    </span>
                    <span className="text-xs text-gray-500">
                      {selectedDepartment.level >= 40
                        ? "Executive Level"
                        : selectedDepartment.level >= 30
                        ? "Management Level"
                        : selectedDepartment.level >= 20
                        ? "Supervisory Level"
                        : "Operational Level"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Manager
                  </label>
                  <p className="text-gray-900">
                    {selectedDepartment.manager
                      ? selectedDepartment.manager.name
                      : "No manager assigned"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Statistics
                </label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">Users</p>
                    <button
                      onClick={() => handleViewUsers(selectedDepartment)}
                      className="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      {selectedDepartment.userCount || 0}
                    </button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">Documents</p>
                    <p className="text-lg font-semibold">
                      {selectedDepartment.documentCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Settings
                </label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Document Upload:</span>
                      <span
                        className={`ml-2 ${
                          selectedDepartment.settings?.allowDocumentUpload
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedDepartment.settings?.allowDocumentUpload
                          ? "Allowed"
                          : "Not Allowed"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Approval Required:</span>
                      <span
                        className={`ml-2 ${
                          selectedDepartment.settings?.requireApproval
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedDepartment.settings?.requireApproval
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Max File Size:</span>
                      <span className="ml-2">
                        {selectedDepartment.settings?.maxFileSize || 10} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Allowed Types:</span>
                      <span className="ml-2">
                        {selectedDepartment.settings?.allowedFileTypes?.join(
                          ", "
                        ) || "All"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Capabilities Modal */}
      {showCapabilitiesModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500">
                    <MdBusiness className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedDepartment.name} Capabilities
                    </h2>
                    <p className="text-gray-600">
                      Level {selectedDepartment.level} •{" "}
                      {getDepartmentCapabilities(selectedDepartment).length}{" "}
                      capabilities
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCapabilitiesModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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

              {selectedDepartment.description && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Description:
                  </h4>
                  <p className="text-blue-700">
                    {selectedDepartment.description}
                  </p>
                </div>
              )}

              {(() => {
                const capabilities =
                  getDepartmentCapabilities(selectedDepartment);
                const summary = {
                  document: capabilities.filter((c) => c.type === "document")
                    .length,
                  workflow: capabilities.filter((c) => c.type === "workflow")
                    .length,
                  system: capabilities.filter((c) => c.type === "system")
                    .length,
                  user: capabilities.filter((c) => c.type === "user").length,
                };

                return (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {summary.document}
                        </div>
                        <div className="text-sm text-gray-600">
                          Document Actions
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {summary.workflow}
                        </div>
                        <div className="text-sm text-gray-600">
                          Workflow Actions
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {summary.system}
                        </div>
                        <div className="text-sm text-gray-600">
                          System Actions
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-gray-600 mb-1">
                          {summary.user}
                        </div>
                        <div className="text-sm text-gray-600">
                          User Actions
                        </div>
                      </div>
                    </div>

                    {/* Detailed Capabilities */}
                    <div className="space-y-4">
                      {["document", "workflow", "system", "user"].map(
                        (type) => {
                          const typeCapabilities = capabilities.filter(
                            (c) => c.type === type
                          );
                          if (typeCapabilities.length === 0) return null;

                          const typeLabels = {
                            document: "Document Management",
                            workflow: "Workflow & Approval",
                            system: "System & Leadership",
                            user: "User Management",
                          };

                          const typeColors = {
                            document: "blue",
                            workflow: "green",
                            system: "purple",
                            user: "gray",
                          };

                          return (
                            <div
                              key={type}
                              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                            >
                              <div
                                className={`bg-${typeColors[type]}-50 px-6 py-4 border-b border-gray-200`}
                              >
                                <h3
                                  className={`text-lg font-semibold text-${typeColors[type]}-800`}
                                >
                                  {typeLabels[type]}
                                </h3>
                              </div>
                              <div className="p-6">
                                <div className="grid gap-3">
                                  {typeCapabilities.map((capability, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                                    >
                                      <span className="text-2xl">
                                        {capability.icon}
                                      </span>
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900 capitalize">
                                          {capability.action
                                            .replace(/([A-Z])/g, " $1")
                                            .trim()}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {capability.description}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => {
                    setShowCapabilitiesModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Users Modal */}
      {showUsersModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Users in {selectedDepartment.name}
              </h2>
              <button
                onClick={() => {
                  setShowUsersModal(false);
                  setSelectedDepartment(null);
                }}
                className="text-gray-400 hover:text-gray-600"
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

            <div className="mb-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-sm text-gray-600">
                    Department Level: {selectedDepartment.level}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Users: {selectedDepartment.userCount || 0}
                  </p>
                </div>
              </div>
            </div>

            {(() => {
              // Filter users that belong to this department
              const departmentUsers = users.filter(
                (user) => user.department === selectedDepartment._id
              );

              if (departmentUsers.length === 0) {
                return (
                  <div className="text-center py-8">
                    <MdPerson className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">
                      No users assigned to this department yet.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {departmentUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            Role: {user.role || "User"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === "active"
                              ? "bg-green-100 text-green-800"
                              : user.status === "inactive"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.status || "active"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowUsersModal(false);
                  setSelectedDepartment(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
