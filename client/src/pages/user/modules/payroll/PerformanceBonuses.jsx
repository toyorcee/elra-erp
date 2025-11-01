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
import BonusForm from "../../../../components/payroll/BonusForm";
import DataTable from "../../../../components/common/DataTable";
import {
  fetchBonuses,
  createBonus,
  updateBonus,
  deleteBonus,
  getBonusById,
} from "../../../../services/bonusAPI";

const PerformanceBonuses = () => {
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBonus, setEditingBonus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    frequency: "",
    scope: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    bonus: null,
  });
  const [filterLoading, setFilterLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingRow, setLoadingRow] = useState(null);

  useEffect(() => {
    fetchBonusesData();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBonusesData();
  }, [filters]);

  const fetchBonusesData = async () => {
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

      const response = await fetchBonuses(params);
      setBonuses(response.data || []);
    } catch (error) {
      console.error("Error fetching bonuses:", error);
      toast.error("Failed to fetch bonuses");
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
      const response = await fetch("/api/bonuses/categories");
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

  const handleAddBonus = () => {
    setEditingBonus(null);
    setShowModal(true);
  };

  const handleEditBonus = (bonus) => {
    setEditingBonus(bonus);
    setShowModal(true);
  };

  const handleDeleteBonus = (bonus) => {
    setDeleteConfirmation({
      show: true,
      bonus: bonus,
    });
  };

  const handleRowClick = async (bonus) => {
    try {
      setLoadingRow(bonus._id);
      const response = await getBonusById(bonus._id);
      setSelectedBonus(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching bonus details:", error);
      toast.error("Failed to fetch bonus details");
    } finally {
      setLoadingRow(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.bonus) return;

    try {
      setIsSubmitting(true);
      await deleteBonus(deleteConfirmation.bonus._id);

      // Clear filters and force a fresh fetch
      setFilters({
        type: "",
        frequency: "",
        scope: "",
      });

      // Force a fresh fetch with cleared filters
      await fetchBonusesData();

      toast.success("Bonus deleted successfully!");
      setDeleteConfirmation({ show: false, bonus: null });
    } catch (error) {
      console.error("Error deleting bonus:", error);
      toast.error(
        `Error: ${error.response?.data?.message || "Error deleting bonus"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, bonus: null });
  };

  const handleSubmitBonus = async (formData) => {
    try {
      setIsSubmitting(true);

      if (editingBonus) {
        await updateBonus(editingBonus._id, formData);
        toast.success("Bonus updated successfully!");
      } else {
        await createBonus(formData);
        toast.success("Bonus created successfully!");
      }

      setFilters({
        type: "",
        frequency: "",
        scope: "",
      });

      await fetchBonusesData();

      setShowModal(false);
      setEditingBonus(null);
    } catch (error) {
      console.error("Error submitting bonus:", error);
      toast.error(
        `Error: ${error.response?.data?.message || "Error saving bonus"}`
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
      case "performance":
        return "bg-blue-100 text-blue-800";
      case "year_end":
        return "bg-purple-100 text-purple-800";
      case "special":
        return "bg-orange-100 text-orange-800";
      case "achievement":
        return "bg-green-100 text-green-800";
      case "retention":
        return "bg-indigo-100 text-indigo-800";
      case "project":
        return "bg-teal-100 text-teal-800";
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

  // Image utility functions
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

    // Handle both string and object formats
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
    total: bonuses.length,
    performance: bonuses.filter((b) => b.category === "performance").length,
    active: bonuses.filter((b) => b.isActive).length,
  };

  // Table columns configuration
  const columns = [
    {
      key: "name",
      header: "Bonus Name",
      renderer: (bonus) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{bonus.name}</div>
          <div className="text-sm text-gray-500">{bonus.description}</div>
        </div>
      ),
    },
    {
      key: "calculation",
      header: "Calculation",
      renderer: (bonus) => (
        <div className="text-sm text-gray-900">
          {getCalculationTypeLabel(
            bonus.calculationType,
            bonus.amount,
            bonus.percentageBase
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      renderer: (bonus) => (
        <div className="space-y-1">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
              bonus.category
            )}`}
          >
            {formatCategoryName(bonus.category)}
          </span>
          <div className="text-xs text-gray-500">{bonus.type} type</div>
          <div className="flex items-center space-x-1">
            {bonus.taxable ? (
              <HiExclamation className="w-3 h-3 text-red-500" />
            ) : (
              <HiCheck className="w-3 h-3 text-green-500" />
            )}
            <span
              className={`text-xs ${
                bonus.taxable ? "text-red-600" : "text-green-600"
              }`}
            >
              {bonus.taxable ? "Taxable" : "Non-taxable"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "scope",
      header: "Scope",
      renderer: (bonus) => (
        <div className="space-y-1">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScopeColor(
              bonus.scope
            )}`}
          >
            {bonus.scope?.charAt(0).toUpperCase() + bonus.scope?.slice(1) ||
              "N/A"}
          </span>
          {bonus.scope === "individual" && bonus.employees && (
            <div className="text-xs text-gray-500">
              {bonus.employees.length} employee(s)
            </div>
          )}
          {bonus.scope === "department" && bonus.departments && (
            <div className="text-xs text-gray-500">
              {bonus.departments.length} department(s)
            </div>
          )}
        </div>
      ),
    },
    {
      key: "frequency",
      header: "Frequency",
      renderer: (bonus) => (
        <div className="text-sm text-gray-900">
          {bonus.frequency?.replace("_", " ") || "N/A"}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      renderer: (bonus) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
            bonus.isActive
          )}`}
        >
          {bonus.isActive ? "Active" : "Inactive"}
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Performance Bonuses
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Manage performance-based bonuses for employees
          </p>
        </div>
        <button
          onClick={handleAddBonus}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-[var(--elra-primary)] text-white text-sm sm:text-base font-medium rounded-xl shadow-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-200 transform hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-target w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <HiRefresh className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
              <span className="hidden sm:inline">Processing...</span>
              <span className="sm:hidden">Processing</span>
            </>
          ) : (
            <>
              <HiPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">Add Bonus</span>
              <span className="sm:hidden">Add</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Total Bonuses Card */}
            <div className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                    Total Bonuses
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mt-2 break-all leading-tight">
                    {stats.total}
                  </p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl shadow-lg">
                  <HiGift className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Active Bonuses Card */}
            <div className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                    Active Bonuses
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mt-2 break-all leading-tight">
                    {stats.active}
                  </p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl shadow-lg">
                  <HiCheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Performance Bonuses Card */}
            <div className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                    Performance Bonuses
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mt-2 break-all leading-tight">
                    {stats.performance}
                  </p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl shadow-lg">
                  <HiUserGroup className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors touch-target w-full sm:w-auto"
          >
            <HiFilter className="w-4 h-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  disabled={filterLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent disabled:opacity-50"
                >
                  <option value="">All Types</option>
                  <option value="performance">Performance</option>
                  <option value="year_end">Year End</option>
                  <option value="special">Special</option>
                  <option value="achievement">Achievement</option>
                  <option value="retention">Retention</option>
                  <option value="project">Project</option>
                  <option value="thirteenth_month">13th Month</option>
                  <option value="personal">Personal</option>
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
                  Filtering bonuses...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <DataTable
          data={bonuses}
          columns={columns}
          loading={loading}
          onRowClick={handleRowClick}
          rowClassName={(bonus) =>
            loadingRow === bonus._id ? "opacity-50" : ""
          }
          actions={{
            onEdit: handleEditBonus,
            onDelete: (id, name) => handleDeleteBonus({ _id: id, name }),
            showEdit: true,
            showDelete: true,
            showToggle: false,
          }}
          emptyState={{
            title: "No bonuses found",
            description: "Create your first bonus to get started.",
            actionButton: (
              <button
                onClick={handleAddBonus}
                className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white font-medium rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
              >
                <HiPlus className="w-4 h-4 mr-2" />
                Add Bonus
              </button>
            ),
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <HiExclamation className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Bonus
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the bonus "
                {deleteConfirmation.bonus?.name}"? This action cannot be undone.
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

      {/* Bonus Details Modal */}
      {showDetailsModal && selectedBonus && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Bonus Details
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBonus(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Basic Information
                </h4>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Name
                  </label>
                  <p className="text-gray-900">{selectedBonus.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <p className="text-gray-900">
                    {selectedBonus.description || "No description"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Type
                  </label>
                  <p className="text-gray-900">
                    {formatCategoryName(selectedBonus.type)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Category
                  </label>
                  <p className="text-gray-900">
                    {formatCategoryName(selectedBonus.category)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Taxable Status
                  </label>
                  <div className="flex items-center space-x-2">
                    {selectedBonus.taxable ? (
                      <HiExclamation className="w-4 h-4 text-red-500" />
                    ) : (
                      <HiCheck className="w-4 h-4 text-green-500" />
                    )}
                    <span
                      className={
                        selectedBonus.taxable
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {selectedBonus.taxable ? "Taxable" : "Non-taxable"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Calculation Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Calculation Details
                </h4>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Calculation Type
                  </label>
                  <p className="text-gray-900 capitalize">
                    {selectedBonus.calculationType}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Amount
                  </label>
                  <p className="text-gray-900">
                    {selectedBonus.calculationType === "fixed"
                      ? formatCurrency(selectedBonus.amount)
                      : `${selectedBonus.amount}%`}
                  </p>
                </div>
                {selectedBonus.calculationType === "percentage" && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Percentage Base
                    </label>
                    <p className="text-gray-900 capitalize">
                      {selectedBonus.percentageBase?.replace("_", " ") ||
                        "Base Salary"}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Frequency
                  </label>
                  <p className="text-gray-900 capitalize">
                    {selectedBonus.frequency?.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      selectedBonus.isActive
                    )}`}
                  >
                    {selectedBonus.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Scope Information */}
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
                      selectedBonus.scope
                    )}`}
                  >
                    {selectedBonus.scope?.charAt(0).toUpperCase() +
                      selectedBonus.scope?.slice(1)}
                  </span>
                </div>
                {selectedBonus.scope === "individual" &&
                  selectedBonus.employees &&
                  selectedBonus.employees.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Employees ({selectedBonus.employees.length})
                      </label>
                      <div className="space-y-2 mt-2">
                        {selectedBonus.employees.map((employee, index) => (
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
                {selectedBonus.scope === "department" &&
                  selectedBonus.departments &&
                  selectedBonus.departments.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Departments ({selectedBonus.departments.length})
                      </label>
                      <div className="space-y-2 mt-2">
                        {selectedBonus.departments.map((dept, index) => (
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

              {/* Audit Information */}
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
                      src={getEmployeeAvatar(selectedBonus.createdBy)}
                      alt={`${selectedBonus.createdBy?.firstName} ${selectedBonus.createdBy?.lastName}`}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        e.target.src = getDefaultAvatar(
                          selectedBonus.createdBy
                        );
                      }}
                    />
                    <span className="text-sm text-gray-900">
                      {selectedBonus.createdBy?.firstName}{" "}
                      {selectedBonus.createdBy?.lastName}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Created At
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedBonus.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {selectedBonus.updatedBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Last Updated By
                    </label>
                    <div className="flex items-center space-x-3 mt-1">
                      <img
                        src={getEmployeeAvatar(selectedBonus.updatedBy)}
                        alt={`${selectedBonus.updatedBy?.firstName} ${selectedBonus.updatedBy?.lastName}`}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          e.target.src = getDefaultAvatar(
                            selectedBonus.updatedBy
                          );
                        }}
                      />
                      <span className="text-sm text-gray-900">
                        {selectedBonus.updatedBy?.firstName}{" "}
                        {selectedBonus.updatedBy?.lastName}
                      </span>
                    </div>
                  </div>
                )}
                {selectedBonus.updatedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Last Updated
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedBonus.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <BonusForm
          bonus={editingBonus}
          onSubmit={handleSubmitBonus}
          onCancel={() => {
            setShowModal(false);
            setEditingBonus(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default PerformanceBonuses;
