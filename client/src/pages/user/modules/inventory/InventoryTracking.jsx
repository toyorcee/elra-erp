import React, { useState, useEffect } from "react";
import {
  CubeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  ArrowPathIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import inventoryService from "../../../../services/inventoryService";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

const InventoryTracking = () => {
  const { user } = useAuth();
  const [maintenanceDue, setMaintenanceDue] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    priority: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("maintenance");

  // Access control - only Super Admin and Operations HOD can access
  const userRole = user?.role?.name || user?.role;
  const userDepartment = user?.department?.name;
  const isSuperAdmin = user?.role?.level === 1000;
  const isOperationsHOD = user?.role?.level === 700 && userDepartment === "Operations";
  const hasAccess = user && (isSuperAdmin || isOperationsHOD);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Inventory Tracking. This module is restricted to Super Admin and Operations HOD only.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [maintenanceResponse, availableResponse] = await Promise.all([
        inventoryService.getMaintenanceDue(),
        inventoryService.getAvailableItems(),
      ]);

      if (maintenanceResponse.success) {
        setMaintenanceDue(maintenanceResponse.data);
      } else {
        toast.error("Failed to load maintenance data");
      }

      if (availableResponse.success) {
        setAvailableItems(availableResponse.data);
      } else {
        toast.error("Failed to load available items");
      }
    } catch (error) {
      console.error("Error loading tracking data:", error);
      toast.error("Error loading tracking data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (itemId) => {
    setLoadingDetails(true);
    try {
      const response = await inventoryService.getInventoryById(itemId);
      if (response.success) {
        setSelectedItem(response.data);
        setShowDetailsModal(true);
      } else {
        toast.error("Failed to load item details");
      }
    } catch (error) {
      console.error("Error loading item details:", error);
      toast.error("Error loading item details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const getMaintenancePriority = (item) => {
    if (!item.maintenance?.nextServiceDate) return "low";

    const daysUntilService = Math.ceil(
      (new Date(item.maintenance.nextServiceDate) - new Date()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysUntilService < 0) return "critical";
    if (daysUntilService <= 7) return "high";
    if (daysUntilService <= 30) return "medium";
    return "low";
  };

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          priorityColors[priority] || priorityColors.low
        }`}
      >
        {priority.toUpperCase()}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    const typeIcons = {
      equipment: "🔧",
      vehicle: "🚗",
      property: "🏢",
      furniture: "🪑",
      electronics: "💻",
      other: "📦",
    };
    return typeIcons[type] || "📦";
  };

  const maintenanceColumns = [
    {
      header: "Item Details",
      accessor: "name",
      cell: (item) => (
        <div className="flex items-center">
          <div className="text-2xl mr-3">{getTypeIcon(item.type)}</div>
          <div>
            <div className="font-medium text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-500">{item.code}</div>
            <div className="text-xs text-gray-400">{item.type}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Maintenance Status",
      accessor: "maintenance",
      cell: (item) => {
        const priority = getMaintenancePriority(item);
        const daysUntilService = item.maintenance?.nextServiceDate
          ? Math.ceil(
              (new Date(item.maintenance.nextServiceDate) - new Date()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        return (
          <div className="space-y-1">
            <div className="flex items-center">
              {priority === "critical" ? (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-1" />
              ) : (
                <ClockIcon className="h-5 w-5 text-yellow-500 mr-1" />
              )}
              <span className="text-sm font-medium text-gray-900">
                {daysUntilService < 0 ? "Overdue" : `${daysUntilService} days`}
              </span>
            </div>
            {getPriorityBadge(priority)}
          </div>
        );
      },
    },
    {
      header: "Next Service",
      accessor: "nextServiceDate",
      cell: (item) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {item.maintenance?.nextServiceDate
              ? formatDate(item.maintenance.nextServiceDate)
              : "Not scheduled"}
          </div>
          <div className="text-xs text-gray-500">
            Last:{" "}
            {item.maintenance?.lastServiceDate
              ? formatDate(item.maintenance.lastServiceDate)
              : "Never"}
          </div>
        </div>
      ),
    },
    {
      header: "Location",
      accessor: "location",
      cell: (item) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {item.location?.warehouse || "N/A"}
          </div>
          <div className="text-xs text-gray-500">
            {item.location?.shelf || "No shelf"}
          </div>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewDetails(item._id)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => loadData()}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Refresh"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const availableColumns = [
    {
      header: "Item Details",
      accessor: "name",
      cell: (item) => (
        <div className="flex items-center">
          <div className="text-2xl mr-3">{getTypeIcon(item.type)}</div>
          <div>
            <div className="font-medium text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-500">{item.code}</div>
            <div className="text-xs text-gray-400">{item.type}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Category & Description",
      accessor: "category",
      cell: (item) => (
        <div>
          <div className="font-medium text-gray-900">{item.category}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {item.description}
          </div>
        </div>
      ),
    },
    {
      header: "Value",
      accessor: "currentValue",
      cell: (item) => (
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-4 w-4 text-gray-500 mr-1" />
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(item.currentValue)}
          </span>
        </div>
      ),
    },
    {
      header: "Location",
      accessor: "location",
      cell: (item) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {item.location?.warehouse || "N/A"}
          </div>
          <div className="text-xs text-gray-500">
            {item.location?.shelf || "No shelf"}
          </div>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewDetails(item._id)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => loadData()}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Refresh"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  const criticalMaintenance = maintenanceDue.filter(
    (item) => getMaintenancePriority(item) === "critical"
  ).length;
  const highPriorityMaintenance = maintenanceDue.filter(
    (item) => getMaintenancePriority(item) === "high"
  ).length;
  const totalAvailable = availableItems.length;
  const totalValue = availableItems.reduce(
    (sum, item) => sum + (item.currentValue || 0),
    0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Inventory Tracking
        </h1>
        <p className="text-gray-600">
          Track maintenance schedules and monitor available inventory items
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical Maintenance</p>
              <p className="text-2xl font-bold text-red-600">
                {criticalMaintenance}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Priority</p>
              <p className="text-2xl font-bold text-orange-600">
                {highPriorityMaintenance}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available Items</p>
              <p className="text-2xl font-bold text-green-600">
                {totalAvailable}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-[var(--elra-primary)]" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("maintenance")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "maintenance"
                  ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <WrenchScrewdriverIcon className="h-5 w-5 inline mr-2" />
              Maintenance Due ({maintenanceDue.length})
            </button>
            <button
              onClick={() => setActiveTab("available")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "available"
                  ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <CheckCircleIcon className="h-5 w-5 inline mr-2" />
              Available Items ({availableItems.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
            >
              <option value="all">All Types</option>
              <option value="equipment">Equipment</option>
              <option value="vehicle">Vehicle</option>
              <option value="property">Property</option>
              <option value="furniture">Furniture</option>
              <option value="electronics">Electronics</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={loadData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)]"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {activeTab === "maintenance" && (
          <DataTable
            columns={maintenanceColumns}
            data={maintenanceDue}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPlaceholder="Search maintenance items..."
          />
        )}

        {activeTab === "available" && (
          <DataTable
            columns={availableColumns}
            data={availableItems}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPlaceholder="Search available items..."
          />
        )}
      </div>

      {/* Item Details Modal */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedItem.name}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedItem.code}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedItem(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Type
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedItem.type}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Category
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedItem.category}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Status
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedItem.status}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Description
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedItem.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Financial Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Purchase Price
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatCurrency(selectedItem.purchasePrice)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Current Value
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatCurrency(selectedItem.currentValue)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Created Date
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedItem.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedItem.maintenance && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Maintenance Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Last Service
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedItem.maintenance.lastServiceDate
                          ? formatDate(selectedItem.maintenance.lastServiceDate)
                          : "Never"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Next Service
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedItem.maintenance.nextServiceDate
                          ? formatDate(selectedItem.maintenance.nextServiceDate)
                          : "Not scheduled"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTracking;
