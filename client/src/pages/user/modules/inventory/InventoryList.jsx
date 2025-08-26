import React, { useState, useEffect } from "react";
import {
  CubeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchInventory,
  createInventory,
  updateInventory,
  deleteInventory,
  fetchWorkflowTasks,
} from "../../../../services/inventoryAPI.js";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";

const InventoryList = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    condition: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [workflowTasks, setWorkflowTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    condition: "good",
    status: "available",
    purchasePrice: "",
    leasePrice: "",
    location: "",
    serialNumber: "",
    project: "",
  });

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Inventory List.
          </p>
        </div>
      </div>
    );
  }

  const inventoryCategories = [
    { value: "all", label: "All Categories" },
    { value: "construction", label: "Construction Equipment" },
    { value: "it", label: "IT Equipment" },
    { value: "office", label: "Office Equipment" },
    { value: "vehicles", label: "Vehicles" },
  ];

  const inventoryStatuses = [
    { value: "all", label: "All Statuses" },
    {
      value: "available",
      label: "Available",
      color: "bg-green-100 text-green-800",
    },
    { value: "leased", label: "Leased", color: "bg-blue-100 text-blue-800" },
    {
      value: "maintenance",
      label: "Under Maintenance",
      color: "bg-orange-100 text-orange-800",
    },
    { value: "retired", label: "Retired", color: "bg-red-100 text-red-800" },
  ];

  const inventoryConditions = [
    { value: "all", label: "All Conditions" },
    {
      value: "excellent",
      label: "Excellent",
      color: "bg-green-100 text-green-800",
    },
    { value: "good", label: "Good", color: "bg-blue-100 text-blue-800" },
    { value: "fair", label: "Fair", color: "bg-yellow-100 text-yellow-800" },
    { value: "poor", label: "Poor", color: "bg-red-100 text-red-800" },
  ];

  useEffect(() => {
    loadInventory();
    if (user.department?.name === "Operations") {
      loadWorkflowTasks();
    }
  }, [user.department?.name]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const response = await fetchInventory();
      if (response.success) {
        setInventory(response.data);
      } else {
        toast.error("Failed to load inventory");
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast.error("Error loading inventory");
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowTasks = async () => {
    try {
      const response = await fetchWorkflowTasks();
      if (response.success) {
        setWorkflowTasks(response.data?.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching workflow tasks:", error);
    }
  };

  // Get unique projects from workflow tasks
  const getProjectsFromTasks = () => {
    const projectMap = new Map();
    workflowTasks.forEach((task) => {
      if (task.project && !projectMap.has(task.project._id)) {
        projectMap.set(task.project._id, task.project);
      }
    });
    return Array.from(projectMap.values());
  };

  const getStatusBadge = (status) => {
    const statusConfig = inventoryStatuses.find((s) => s.value === status);
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusConfig?.color || "bg-gray-100 text-gray-800"
        }`}
      >
        {statusConfig?.label || status}
      </span>
    );
  };

  const getConditionBadge = (condition) => {
    const conditionConfig = inventoryConditions.find(
      (c) => c.value === condition
    );
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          conditionConfig?.color || "bg-gray-100 text-gray-800"
        }`}
      >
        {conditionConfig?.label || condition}
      </span>
    );
  };

  const columns = [
    {
      header: "Item",
      accessor: "name",
      cell: (item) => (
        <div className="flex items-center">
          <CubeIcon className="h-5 w-5 text-blue-500 mr-2" />
          <div>
            <div className="font-medium text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-500">{item.category}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (item) => getStatusBadge(item.status),
    },
    {
      header: "Condition",
      accessor: "condition",
      cell: (item) => getConditionBadge(item.condition),
    },
    {
      header: "Lease Price",
      accessor: "leasePrice",
      cell: (item) => (
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm text-gray-900">
            ₦{new Intl.NumberFormat().format(item.leasePrice || 0)}
          </span>
        </div>
      ),
    },
    {
      header: "Location",
      accessor: "location",
      cell: (item) => (
        <span className="text-sm text-gray-900">
          {item.location || "Not specified"}
        </span>
      ),
    },
    {
      header: "Project",
      accessor: "project",
      cell: (item) => (
        <span className="text-sm text-gray-900">
          {item.project?.name || "Not assigned"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedItem(item);
              setFormData({
                name: item.name,
                description: item.description,
                category: item.category,
                condition: item.condition,
                status: item.status,
                purchasePrice: item.purchasePrice,
                leasePrice: item.leasePrice,
                location: item.location,
                serialNumber: item.serialNumber,
                project: item.project?._id || "",
              });
              setShowEditModal(true);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Edit Item"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteItem(item._id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete Item"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let response;
      if (showCreateModal) {
        response = await createInventory(formData);
        if (response.success) {
          toast.success("Inventory item created successfully");
          setShowCreateModal(false);
        } else {
          toast.error(response.message || "Failed to create inventory item");
        }
      } else {
        response = await updateInventory(selectedItem._id, formData);
        if (response.success) {
          toast.success("Inventory item updated successfully");
          setShowEditModal(false);
        } else {
          toast.error(response.message || "Failed to update inventory item");
        }
      }

      if (response.success) {
        setFormData({
          name: "",
          description: "",
          category: "",
          condition: "good",
          status: "available",
          purchasePrice: "",
          leasePrice: "",
          location: "",
          serialNumber: "",
          project: "",
        });
        loadInventory();
      }
    } catch (error) {
      console.error("Error saving inventory item:", error);
      toast.error("Error saving inventory item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (
      !window.confirm("Are you sure you want to delete this inventory item?")
    ) {
      return;
    }

    try {
      const response = await deleteInventory(itemId);
      if (response.success) {
        toast.success("Inventory item deleted successfully");
        loadInventory();
      } else {
        toast.error(response.message || "Failed to delete inventory item");
      }
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast.error("Error deleting inventory item");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Inventory List
            </h1>
            <p className="text-gray-600">
              Manage all leaseable items and equipment
            </p>
            {user.department?.name === "Operations" &&
              workflowTasks.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Workflow Context:</strong> You have{" "}
                    {workflowTasks.filter((t) => t.status === "pending").length}{" "}
                    pending inventory tasks for {getProjectsFromTasks().length}{" "}
                    approved project(s)
                  </p>
                </div>
              )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Item
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              >
                {inventoryStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              >
                {inventoryCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <DataTable
            data={inventory}
            columns={columns}
            searchTerm={searchTerm}
            filters={filters}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {showCreateModal
                  ? "Create New Inventory Item"
                  : "Edit Inventory Item"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setFormData({
                    name: "",
                    description: "",
                    category: "",
                    condition: "good",
                    status: "available",
                    purchasePrice: "",
                    leasePrice: "",
                    location: "",
                    serialNumber: "",
                    project: "",
                  });
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Selection (only for Operations department) */}
                {user.department?.name === "Operations" &&
                  getProjectsFromTasks().length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Associated Project
                      </label>
                      <select
                        value={formData.project}
                        onChange={(e) =>
                          setFormData({ ...formData, project: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                      >
                        <option value="">Select Project (Optional)</option>
                        {getProjectsFromTasks().map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.name} - {project.category}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Link this inventory item to a specific project
                      </p>
                    </div>
                  )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    placeholder="e.g., CAT320 Excavator"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  >
                    <option value="">Select Category</option>
                    <option value="construction">Construction Equipment</option>
                    <option value="it">IT Equipment</option>
                    <option value="office">Office Equipment</option>
                    <option value="vehicles">Vehicles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, serialNumber: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    placeholder="e.g., SN-2025-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    placeholder="e.g., Warehouse A-15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchasePrice: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    placeholder="₦0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease Price *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.leasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, leasePrice: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    placeholder="₦0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  >
                    <option value="available">Available</option>
                    <option value="leased">Leased</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  placeholder="Detailed description of the equipment..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setFormData({
                      name: "",
                      description: "",
                      category: "",
                      condition: "good",
                      status: "available",
                      purchasePrice: "",
                      leasePrice: "",
                      location: "",
                      serialNumber: "",
                      project: "",
                    });
                  }}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-md hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting && (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {submitting
                    ? "Saving..."
                    : showCreateModal
                    ? "Create Item"
                    : "Update Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
