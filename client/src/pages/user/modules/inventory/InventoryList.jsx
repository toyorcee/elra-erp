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
import { fetchInventory, createInventory, updateInventory, deleteInventory } from "../../../../services/inventoryAPI.js";
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
  });

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access Inventory List.</p>
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
    { value: "available", label: "Available", color: "bg-green-100 text-green-800" },
    { value: "leased", label: "Leased", color: "bg-blue-100 text-blue-800" },
    { value: "maintenance", label: "Under Maintenance", color: "bg-orange-100 text-orange-800" },
    { value: "retired", label: "Retired", color: "bg-red-100 text-red-800" },
  ];

  const inventoryConditions = [
    { value: "all", label: "All Conditions" },
    { value: "excellent", label: "Excellent", color: "bg-green-100 text-green-800" },
    { value: "good", label: "Good", color: "bg-blue-100 text-blue-800" },
    { value: "fair", label: "Fair", color: "bg-yellow-100 text-yellow-800" },
    { value: "poor", label: "Poor", color: "bg-red-100 text-red-800" },
  ];

  useEffect(() => {
    loadInventory();
  }, []);

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

  const getStatusBadge = (status) => {
    const statusConfig = inventoryStatuses.find(s => s.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusConfig?.label || status}
      </span>
    );
  };

  const getConditionBadge = (condition) => {
    const conditionConfig = inventoryConditions.find(c => c.value === condition);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionConfig?.color || 'bg-gray-100 text-gray-800'}`}>
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
        <span className="text-sm text-gray-900">{item.location || "Not specified"}</span>
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

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this inventory item?")) {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory List</h1>
            <p className="text-gray-600">Manage all leaseable items and equipment</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
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
    </div>
  );
};

export default InventoryList;
