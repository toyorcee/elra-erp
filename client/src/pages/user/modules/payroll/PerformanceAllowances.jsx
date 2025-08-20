import React, { useState, useEffect } from "react";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiGift,
  HiCheck,
  HiExclamation,
  HiRefresh,
  HiX,
  HiFilter,
  HiCurrencyDollar,
  HiUserGroup,
  HiClock,
  HiCheckCircle,
} from "react-icons/hi";
import { toast } from "react-toastify";
import { formatCurrency } from "../../../../utils/formatters";
import AllowanceForm from "../../../../components/payroll/AllowanceForm";
import DataTable from "../../../../components/common/DataTable";
import {
  fetchAllowances,
  createAllowance,
  updateAllowance,
  deleteAllowance,
  getAllowanceById,
} from "../../../../services/allowanceAPI";

const PerformanceAllowances = () => {
  const [allowances, setAllowances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    frequency: "",
    scope: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    allowance: null,
  });
  const [filterLoading, setFilterLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedAllowance, setSelectedAllowance] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingRow, setLoadingRow] = useState(null);

  useEffect(() => {
    fetchAllowancesData();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAllowancesData();
  }, [filters]);

  const fetchAllowancesData = async () => {
    try {
      const hasActiveFilters = Object.values(filters).some(
        (value) => value !== ""
      );

      if (hasActiveFilters) {
        setFilterLoading(true);
      } else {
        setLoading(true);
      }

      const params = {
        ...filters,
        _t: Date.now(),
      };

      const response = await fetchAllowances(params);
      setAllowances(response.data || []);
    } catch (error) {
      console.error("Error fetching allowances:", error);
      toast.error("Failed to fetch allowances");
    } finally {
      const hasActiveFilters = Object.values(filters).some(
        (value) => value !== ""
      );

      if (hasActiveFilters) {
        setFilterLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch("/api/allowances/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddAllowance = () => {
    setEditingAllowance(null);
    setShowModal(true);
  };

  const handleEditAllowance = (allowance) => {
    setEditingAllowance(allowance);
    setShowModal(true);
  };

  const handleDeleteAllowance = (allowance) => {
    setDeleteConfirmation({
      show: true,
      allowance: allowance,
    });
  };

  const handleRowClick = async (allowance) => {
    try {
      setLoadingRow(allowance._id);
      const response = await getAllowanceById(allowance._id);
      setSelectedAllowance(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching allowance details:", error);
      toast.error("Failed to fetch allowance details");
    } finally {
      setLoadingRow(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.allowance) return;

    try {
      setIsSubmitting(true);
      await deleteAllowance(deleteConfirmation.allowance._id);

      setFilters({
        type: "",
        frequency: "",
        scope: "",
      });

      await fetchAllowancesData();

      toast.success("Allowance deleted successfully!");
      setDeleteConfirmation({ show: false, allowance: null });
    } catch (error) {
      console.error("Error deleting allowance:", error);
      toast.error(
        `Error: ${error.response?.data?.message || "Error deleting allowance"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, allowance: null });
  };

  const handleSubmitAllowance = async (formData) => {
    try {
      setIsSubmitting(true);

      if (editingAllowance) {
        await updateAllowance(editingAllowance._id, formData);
        toast.success("Allowance updated successfully!");
      } else {
        await createAllowance(formData);
        toast.success("Allowance created successfully!");
      }

      setFilters({
        type: "",
        frequency: "",
        scope: "",
      });

      await fetchAllowancesData();

      setShowModal(false);
      setEditingAllowance(null);
    } catch (error) {
      console.error("Error submitting allowance:", error);
      toast.error(
        `Error: ${error.response?.data?.message || "Error saving allowance"}`
      );
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      frequency: "",
      scope: "",
    });
  };

  const getStatusColor = (isActive) => {
    switch (isActive) {
      case true:
        return "bg-green-100 text-green-800";
      case false:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "transport":
        return "bg-green-100 text-green-800";
      case "housing":
        return "bg-purple-100 text-purple-800";
      case "meal":
        return "bg-orange-100 text-orange-800";
      case "medical":
        return "bg-red-100 text-red-800";
      case "education":
        return "bg-indigo-100 text-indigo-800";
      case "hardship":
        return "bg-yellow-100 text-yellow-800";
      case "special":
        return "bg-pink-100 text-pink-800";
      case "performance":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScopeColor = (scope) => {
    switch (scope) {
      case "company":
        return "bg-purple-100 text-purple-800";
      case "department":
        return "bg-blue-100 text-blue-800";
      case "individual":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCalculationTypeLabel = (type, amount, percentageBase) => {
    if (type === "fixed") {
      return formatCurrency(amount);
    } else {
      return `${amount}% of ${
        percentageBase?.replace("_", " ") || "base salary"
      }`;
    }
  };

  const formatCategoryName = (category) => {
    if (!category) return "";
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getDefaultAvatar = (employee = null) => {
    if (employee?.firstName || employee?.lastName) {
      const firstName = employee.firstName || "";
      const lastName = employee.lastName || "";
      const initials = `${firstName.charAt(0)}${lastName.charAt(
        0
      )}`.toUpperCase();
      return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&color=fff&size=40&rounded=true`;
    }
    return "https://ui-avatars.com/api/?name=Unknown+Employee&background=random&color=fff&size=40&rounded=true";
  };

  const getImageUrl = (avatarPath, employee = null) => {
    if (!avatarPath) return getDefaultAvatar(employee);

    let path = avatarPath;
    if (typeof avatarPath === "object" && avatarPath.url) {
      path = avatarPath.url;
    }

    if (path.startsWith("http")) return path;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");

    return `${baseUrl}${path}`;
  };

  const getEmployeeAvatar = (employee) => {
    if (!employee) return getDefaultAvatar();

    if (employee.avatar && employee.avatar !== "") {
      return getImageUrl(employee.avatar, employee);
    }

    return getDefaultAvatar(employee);
  };

  const stats = {
    total: allowances.length,
    transport: allowances.filter((a) => a.type === "transport").length,
    active: allowances.filter((a) => a.isActive).length,
  };

  const columns = [
    {
      key: "name",
      header: "Allowance Name",
      renderer: (allowance) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {allowance.name}
          </div>
          <div className="text-sm text-gray-500">{allowance.description}</div>
        </div>
      ),
    },
    {
      key: "calculation",
      header: "Calculation",
      renderer: (allowance) => (
        <div className="text-sm text-gray-900">
          {getCalculationTypeLabel(
            allowance.calculationType,
            allowance.amount,
            allowance.percentageBase
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      renderer: (allowance) => (
        <div className="space-y-1">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
              allowance.type
            )}`}
          >
            {formatCategoryName(allowance.type)}
          </span>
          <div className="text-xs text-gray-500">{allowance.type} type</div>
          <div className="flex items-center space-x-1">
            {allowance.taxable ? (
              <HiExclamation className="w-3 h-3 text-red-500" />
            ) : (
              <HiCheck className="w-3 h-3 text-green-500" />
            )}
            <span
              className={`text-xs ${
                allowance.taxable ? "text-red-600" : "text-green-600"
              }`}
            >
              {allowance.taxable ? "Taxable" : "Non-taxable"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "scope",
      header: "Scope",
      renderer: (allowance) => (
        <div className="space-y-1">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScopeColor(
              allowance.scope
            )}`}
          >
            {allowance.scope?.charAt(0).toUpperCase() +
              allowance.scope?.slice(1) || "N/A"}
          </span>
          {allowance.scope === "individual" && allowance.employees && (
            <div className="text-xs text-gray-500">
              {allowance.employees.length} employee(s)
            </div>
          )}
          {allowance.scope === "department" && allowance.departments && (
            <div className="text-xs text-gray-500">
              {allowance.departments.length} department(s)
            </div>
          )}
        </div>
      ),
    },
    {
      key: "frequency",
      header: "Frequency",
      renderer: (allowance) => (
        <div className="text-sm text-gray-900">
          {allowance.frequency?.replace("_", " ") || "N/A"}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      renderer: (allowance) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
            allowance.isActive
          )}`}
        >
          {allowance.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Performance Allowances
          </h1>
          <p className="text-gray-600 mt-2">
            Manage performance-based allowances for employees
          </p>
        </div>
        <button
          onClick={handleAddAllowance}
          disabled={isSubmitting}
          className="inline-flex items-center px-6 py-3 bg-[var(--elra-primary)] text-white font-medium rounded-xl shadow-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-200 transform hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <>
              <HiRefresh className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <HiPlus className="w-5 h-5 mr-2" />
              Add Allowance
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">
                    Total Allowances
                  </p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <HiGift className="w-8 h-8 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">
                    Active Allowances
                  </p>
                  <p className="text-3xl font-bold">{stats.active}</p>
                </div>
                <HiCheckCircle className="w-8 h-8 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Transport</p>
                  <p className="text-3xl font-bold">{stats.transport}</p>
                </div>
                <HiUserGroup className="w-8 h-8 text-white/80" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <HiFilter className="w-4 h-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowance Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  disabled={filterLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent disabled:opacity-50"
                >
                  <option value="">All Types</option>
                  <option value="transport">Transport</option>
                  <option value="housing">Housing</option>
                  <option value="meal">Meal</option>
                  <option value="medical">Medical</option>
                  <option value="education">Education</option>
                  <option value="hardship">Hardship</option>
                  <option value="special">Special</option>
                  <option value="performance">Performance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={filters.frequency}
                  onChange={(e) =>
                    handleFilterChange("frequency", e.target.value)
                  }
                  disabled={filterLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent disabled:opacity-50"
                >
                  <option value="">All Frequencies</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one_time">One Time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scope
                </label>
                <select
                  value={filters.scope}
                  onChange={(e) => handleFilterChange("scope", e.target.value)}
                  disabled={filterLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent disabled:opacity-50"
                >
                  <option value="">All Scopes</option>
                  <option value="company">Company</option>
                  <option value="department">Department</option>
                  <option value="individual">Individual</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                disabled={filterLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Clear Filters
              </button>
            </div>

            {filterLoading && (
              <div className="flex items-center justify-center py-4">
                <HiRefresh className="w-5 h-5 mr-2 animate-spin text-[var(--elra-primary)]" />
                <span className="text-sm text-gray-600">
                  Filtering allowances...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <DataTable
          data={allowances}
          columns={columns}
          loading={loading}
          onRowClick={handleRowClick}
          rowClassName={(allowance) =>
            loadingRow === allowance._id ? "opacity-50" : ""
          }
          actions={{
            onEdit: handleEditAllowance,
            onDelete: (id, name) => handleDeleteAllowance({ _id: id, name }),
            showEdit: true,
            showDelete: true,
            showToggle: false,
          }}
          emptyState={{
            title: "No allowances found",
            description: "Create your first allowance to get started.",
            actionButton: (
              <button
                onClick={handleAddAllowance}
                className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white font-medium rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
              >
                <HiPlus className="w-4 h-4 mr-2" />
                Add Allowance
              </button>
            ),
          }}
        />
      </div>

      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <HiExclamation className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Allowance
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the allowance "
                {deleteConfirmation.allowance?.name}"? This action cannot be
                undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <HiRefresh className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedAllowance && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Allowance Details
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAllowance(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Basic Information
                </h4>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Name
                  </label>
                  <p className="text-gray-900">{selectedAllowance.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <p className="text-gray-900">
                    {selectedAllowance.description || "No description"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Type
                  </label>
                  <p className="text-gray-900">
                    {formatCategoryName(selectedAllowance.type)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Taxable Status
                  </label>
                  <div className="flex items-center space-x-2">
                    {selectedAllowance.taxable ? (
                      <HiExclamation className="w-4 h-4 text-red-500" />
                    ) : (
                      <HiCheck className="w-4 h-4 text-green-500" />
                    )}
                    <span
                      className={
                        selectedAllowance.taxable
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {selectedAllowance.taxable ? "Taxable" : "Non-taxable"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Calculation Details
                </h4>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Calculation Type
                  </label>
                  <p className="text-gray-900 capitalize">
                    {selectedAllowance.calculationType}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Amount
                  </label>
                  <p className="text-gray-900">
                    {selectedAllowance.calculationType === "fixed"
                      ? formatCurrency(selectedAllowance.amount)
                      : `${selectedAllowance.amount}%`}
                  </p>
                </div>
                {selectedAllowance.calculationType === "percentage" && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Percentage Base
                    </label>
                    <p className="text-gray-900 capitalize">
                      {selectedAllowance.percentageBase?.replace("_", " ") ||
                        "Base Salary"}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Frequency
                  </label>
                  <p className="text-gray-900 capitalize">
                    {selectedAllowance.frequency?.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      selectedAllowance.isActive
                    )}`}
                  >
                    {selectedAllowance.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Scope Information
                </h4>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Scope
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScopeColor(
                      selectedAllowance.scope
                    )}`}
                  >
                    {selectedAllowance.scope?.charAt(0).toUpperCase() +
                      selectedAllowance.scope?.slice(1)}
                  </span>
                </div>
                {selectedAllowance.scope === "individual" &&
                  selectedAllowance.employees &&
                  selectedAllowance.employees.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Employees ({selectedAllowance.employees.length})
                      </label>
                      <div className="space-y-2 mt-2">
                        {selectedAllowance.employees.map((employee, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                          >
                            <img
                              src={getEmployeeAvatar(employee)}
                              alt={`${employee.firstName} ${employee.lastName}`}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                e.target.src = getDefaultAvatar(employee);
                              }}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {employee.firstName} {employee.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {employee.employeeId}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                {selectedAllowance.scope === "department" &&
                  selectedAllowance.departments &&
                  selectedAllowance.departments.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Departments ({selectedAllowance.departments.length})
                      </label>
                      <div className="space-y-2 mt-2">
                        {selectedAllowance.departments.map((dept, index) => (
                          <div
                            key={index}
                            className="p-2 bg-gray-50 rounded-lg"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {dept.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Audit Information
                </h4>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Created By
                  </label>
                  <div className="flex items-center space-x-3 mt-1">
                    <img
                      src={getEmployeeAvatar(selectedAllowance.createdBy)}
                      alt={`${selectedAllowance.createdBy?.firstName} ${selectedAllowance.createdBy?.lastName}`}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        e.target.src = getDefaultAvatar(
                          selectedAllowance.createdBy
                        );
                      }}
                    />
                    <span className="text-sm text-gray-900">
                      {selectedAllowance.createdBy?.firstName}{" "}
                      {selectedAllowance.createdBy?.lastName}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Created At
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedAllowance.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {selectedAllowance.updatedBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Last Updated By
                    </label>
                    <div className="flex items-center space-x-3 mt-1">
                      <img
                        src={getEmployeeAvatar(selectedAllowance.updatedBy)}
                        alt={`${selectedAllowance.updatedBy?.firstName} ${selectedAllowance.updatedBy?.lastName}`}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          e.target.src = getDefaultAvatar(
                            selectedAllowance.updatedBy
                          );
                        }}
                      />
                      <span className="text-sm text-gray-900">
                        {selectedAllowance.updatedBy?.firstName}{" "}
                        {selectedAllowance.updatedBy?.lastName}
                      </span>
                    </div>
                  </div>
                )}
                {selectedAllowance.updatedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Last Updated
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(
                        selectedAllowance.updatedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <AllowanceForm
          allowance={editingAllowance}
          onSubmit={handleSubmitAllowance}
          onCancel={() => {
            setShowModal(false);
            setEditingAllowance(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default PerformanceAllowances;
