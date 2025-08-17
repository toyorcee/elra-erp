import React, { useState, useEffect } from "react";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiExclamation,
  HiCheck,
  HiFilter,
  HiX,
  HiCurrencyDollar,
  HiUserGroup,
  HiClock,
  HiCheckCircle,
  HiRefresh,
  HiInformationCircle,
} from "react-icons/hi";
import { toast } from "react-toastify";
import {
  fetchDeductions,
  createDeduction,
  updateDeduction,
  deleteDeduction,
  toggleDeductionStatus,
  getDeductionById,
} from "../../../../services/deductionAPI";
import { fetchPAYEInfo } from "../../../../services/taxBracketAPI";
import DeductionForm from "../../../../components/payroll/DeductionForm";
import DeductionTypeSelector from "../../../../components/payroll/DeductionTypeSelector";
import { formatCurrency } from "../../../../utils/formatCurrency";
import DataTable from "../../../../components/common/DataTable";

const DeductionsManagement = () => {
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    category: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    deduction: null,
  });
  const [toggleConfirmation, setToggleConfirmation] = useState({
    show: false,
    deduction: null,
  });
  const [payeInfo, setPayeInfo] = useState({
    show: false,
    data: null,
    loading: false,
  });
  const [selectedDeduction, setSelectedDeduction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingRow, setLoadingRow] = useState(null);
  const [loadingPAYEInfo, setLoadingPAYEInfo] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    fetchDeductionsData();
    fetchCategoriesByType();
  }, []);

  useEffect(() => {
    const hasActiveFilters = Object.values(filters).some(
      (value) => value !== ""
    );
    if (hasActiveFilters) {
      fetchDeductionsData(true);
    } else {
      fetchDeductionsData(false);
    }
  }, [filters]);

  const fetchDeductionsData = async (isFiltering = false) => {
    try {
      if (isFiltering) {
        setFilterLoading(true);
      } else {
        setLoading(true);
      }

      const params = {
        ...filters,
        _t: Date.now(),
      };

      const response = await fetchDeductions(params);
      setDeductions(response.data?.deductions || []);
    } catch (error) {
      console.error("Error fetching deductions:", error);
      toast.error("Failed to fetch deductions");
    } finally {
      if (isFiltering) {
        setFilterLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleAddDeduction = () => {
    console.log("🔍 [handleAddDeduction] Starting...");
    setEditingDeduction(null);
    setShowTypeSelector(true);
    console.log("🔍 [handleAddDeduction] showTypeSelector set to true");
  };

  const handleTypeSelect = (type) => {
    console.log("🔍 [handleTypeSelect] Type selected:", type);
    setShowTypeSelector(false);
    // Create a new deduction object with the selected type
    const newDeduction = {
      type: type,
      scope: type === "statutory" ? "company" : "individual",
    };
    console.log("🔍 [handleTypeSelect] New deduction object:", newDeduction);
    setEditingDeduction(newDeduction);
    setShowModal(true);
    console.log("🔍 [handleTypeSelect] showModal set to true");
  };

  const handleEditDeduction = (deduction) => {
    setEditingDeduction(deduction);
    setShowModal(true);
  };

  const handleDeleteDeduction = async (id, deductionName) => {
    const deduction = deductions.find((d) => d._id === id);
    setDeleteConfirmation({
      show: true,
      deduction: deduction,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.deduction) return;

    try {
      setIsSubmitting(true);
      await deleteDeduction(deleteConfirmation.deduction._id);

      // Clear filters and force a fresh fetch
      setFilters({
        type: "",
        category: "",
      });

      // Force a fresh fetch with cleared filters
      await fetchDeductionsData();

      toast.success(
        `Deduction "${deleteConfirmation.deduction.name}" permanently deleted successfully!`
      );
      setDeleteConfirmation({ show: false, deduction: null });
    } catch (error) {
      console.error("Error deleting deduction:", error);
      toast.error(
        `Error: ${error.response?.data?.message || "Error deleting deduction"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, deduction: null });
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (editingDeduction && editingDeduction._id) {
        await updateDeduction(editingDeduction._id, formData);
        toast.success("Deduction updated successfully!");
      } else {
        await createDeduction(formData);
        toast.success("Deduction created successfully!");
      }
      setShowModal(false);

      setFilters({
        type: "",
        category: "",
      });

      await fetchDeductionsData();
    } catch (error) {
      console.error("Error saving deduction:", error);
      toast.error(
        `Error: ${error.response?.data?.message || "Error saving deduction"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchCategoriesByType = async (type) => {
    try {
      setLoadingCategories(true);
      const response = await fetch(
        `/api/deductions/categories${type ? `?type=${type}` : ""}`
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleFilterChange = async (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));

    // If type changed, fetch categories for that type
    if (field === "type") {
      await fetchCategoriesByType(value);
      // Clear category filter when type changes
      setFilters((prev) => ({ ...prev, category: "" }));
    }
  };

  const clearFilters = async () => {
    setFilters({
      type: "",
      category: "",
    });
    // Load all categories when filters are cleared
    await fetchCategoriesByType();
    // The useEffect will automatically fetch all deductions when filters are cleared
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

  const getTypeColor = (type) => {
    switch (type) {
      case "statutory":
        return "bg-blue-100 text-blue-800";
      case "voluntary":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "paye":
        return "bg-red-100 text-red-800";
      case "pension":
        return "bg-indigo-100 text-indigo-800";
      case "nhis":
        return "bg-teal-100 text-teal-800";
      case "insurance":
        return "bg-orange-100 text-orange-800";
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

  const getCalculationTypeLabel = (type) => {
    return type === "percentage" ? "Percentage" : "Fixed Amount";
  };

  const formatAmount = (amount, calculationType) => {
    if (calculationType === "percentage") {
      return `${amount}%`;
    }
    return formatCurrency(amount);
  };

  const stats = {
    total: deductions.length,
    statutory: deductions.filter((d) => d.type === "statutory").length,
    voluntary: deductions.filter((d) => d.type === "voluntary").length,
    active: deductions.filter((d) => d.isActive).length,
  };

  const handleToggleDeduction = async (deduction) => {
    setToggleConfirmation({
      show: true,
      deduction: deduction,
    });
  };

  const confirmToggle = async () => {
    if (!toggleConfirmation.deduction) return;

    const deduction = toggleConfirmation.deduction;
    const actionText = deduction.isActive ? "deactivate" : "activate";

    try {
      setIsSubmitting(true);
      await toggleDeductionStatus(deduction._id);

      // Clear filters and force a fresh fetch
      setFilters({
        type: "",
        category: "",
      });

      // Force a fresh fetch with cleared filters
      await fetchDeductionsData();

      toast.success(`Deduction ${actionText}d successfully!`);
      setToggleConfirmation({ show: false, deduction: null });
    } catch (error) {
      console.error("Error toggling deduction:", error);
      toast.error(
        `Error: ${
          error.response?.data?.message || "Error toggling deduction status"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelToggle = () => {
    setToggleConfirmation({ show: false, deduction: null });
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

  const formatCategoryName = (category) => {
    if (!category) return "";
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleRowClick = async (deduction) => {
    try {
      setLoadingRow(deduction._id);
      const response = await getDeductionById(deduction._id);
      setSelectedDeduction(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching deduction details:", error);
      toast.error("Failed to fetch deduction details");
    } finally {
      setLoadingRow(null);
    }
  };

  const handlePAYEInfo = async () => {
    try {
      setLoadingPAYEInfo(true);
      setPayeInfo({ show: true, data: null, loading: true });
      const response = await fetchPAYEInfo();
      setPayeInfo({ show: true, data: response.data, loading: false });
    } catch (error) {
      console.error("Error fetching PAYE info:", error);

      if (
        error.response?.status === 404 ||
        error.response?.data?.message?.includes("not found")
      ) {
        toast.error("No tax bracket information available.");
        setPayeInfo({ show: false, data: null, loading: false });
      } else {
        toast.error("Failed to fetch PAYE information");
        setPayeInfo({ show: false, data: null, loading: false });
      }
    } finally {
      setLoadingPAYEInfo(false);
    }
  };

  const cancelPAYEInfo = () => {
    setPayeInfo({ show: false, data: null, loading: false });
  };

  return (
    <div className="space-y-8 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Deductions Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage employee deductions and statutory requirements
          </p>
        </div>
        <button
          onClick={handleAddDeduction}
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
              Add Deduction
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    Total Deductions
                  </p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <HiCurrencyDollar className="w-8 h-8 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Statutory</p>
                  <p className="text-3xl font-bold">{stats.statutory}</p>
                </div>
                <HiExclamation className="w-8 h-8 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Voluntary</p>
                  <p className="text-3xl font-bold">{stats.voluntary}</p>
                </div>
                <HiCheck className="w-8 h-8 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Active</p>
                  <p className="text-3xl font-bold">{stats.active}</p>
                </div>
                <HiCheckCircle className="w-8 h-8 text-white/80" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {loading ? (
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <HiFilter className="w-4 h-4 mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {filterLoading && (
                  <div className="col-span-full flex items-center justify-center py-4">
                    <div className="flex items-center space-x-2 text-[var(--elra-primary)]">
                      <HiRefresh className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">
                        Filtering deductions...
                      </span>
                    </div>
                  </div>
                )}
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  disabled={filterLoading}
                  className="px-4 py-2 bg-gray-50 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Types</option>
                  <option value="statutory">Statutory</option>
                  <option value="voluntary">Voluntary</option>
                </select>

                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  disabled={loadingCategories || filterLoading}
                  className="px-4 py-2 bg-gray-50 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingCategories ? "Loading..." : "All Categories"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={clearFilters}
                  disabled={filterLoading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Deductions Table */}
      <DataTable
        data={deductions}
        loading={loading}
        onRowClick={handleRowClick}
        rowClassName={(row) => {
          const baseClass =
            "cursor-pointer hover:bg-gray-50 transition-colors duration-200 relative";
          return loadingRow === row._id ? `${baseClass} opacity-50` : baseClass;
        }}
        columns={[
          {
            header: "Deduction",
            key: "name",
            renderer: (deduction) => (
              <div className="flex items-center space-x-3">
                {loadingRow === deduction._id && (
                  <div className="flex items-center space-x-2 text-[var(--elra-primary)]">
                    <HiRefresh className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Loading...</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{deduction.name}</p>
                  {deduction.description && (
                    <p className="text-sm text-gray-500">
                      {deduction.description}
                    </p>
                  )}
                </div>
              </div>
            ),
            skeletonRenderer: () => (
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ),
          },
          {
            header: "Type",
            key: "type",
            renderer: (deduction) => (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
                  deduction.type
                )}`}
              >
                {deduction.type}
              </span>
            ),
            skeletonRenderer: () => (
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            ),
          },
          {
            header: "Category",
            key: "category",
            renderer: (deduction) => (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                  deduction.category
                )}`}
              >
                {formatCategoryName(deduction.category)}
              </span>
            ),
            skeletonRenderer: () => (
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            ),
          },
          {
            header: "Scope",
            key: "scope",
            renderer: (deduction) => (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getScopeColor(
                  deduction.scope
                )}`}
              >
                {deduction.scope}
              </span>
            ),
            skeletonRenderer: () => (
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            ),
          },
          {
            header: "Amount",
            key: "amount",
            renderer: (deduction) => (
              <div className="flex items-center space-x-2">
                <div>
                  <p className="font-medium text-gray-900">
                    {deduction.category === "paye"
                      ? "Tax Brackets"
                      : formatAmount(
                          deduction.amount,
                          deduction.calculationType
                        )}
                  </p>
                  <p className="text-sm text-gray-500">
                    {deduction.category === "paye"
                      ? "Progressive rates"
                      : getCalculationTypeLabel(deduction.calculationType)}
                  </p>
                </div>
                {deduction.category === "paye" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePAYEInfo();
                    }}
                    disabled={loadingPAYEInfo}
                    className="p-1 text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="View PAYE Tax Brackets"
                  >
                    {loadingPAYEInfo ? (
                      <HiRefresh className="w-4 h-4 animate-spin" />
                    ) : (
                      <HiInformationCircle className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            ),
            skeletonRenderer: () => (
              <div>
                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ),
          },
          {
            header: "Status",
            key: "status",
            renderer: (deduction) => (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  deduction.isActive
                )}`}
              >
                {deduction.isActive ? "Active" : "Inactive"}
              </span>
            ),
            skeletonRenderer: () => (
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            ),
          },
        ]}
        actions={{
          onEdit: handleEditDeduction,
          onDelete: handleDeleteDeduction,
          onToggle: handleToggleDeduction,
          showEdit: true,
          showDelete: true,
          showToggle: true,
        }}
        emptyState={{
          icon: <HiCurrencyDollar className="w-12 h-12 text-white" />,
          title: "No Deductions Found",
          description: "Get started by creating your first deduction",
          actionButton: (
            <button
              onClick={handleAddDeduction}
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
                  Add First Deduction
                </>
              )}
            </button>
          ),
        }}
        skeletonRows={5}
      />

      {/* Type Selector Modal */}
      {showTypeSelector && (
        <DeductionTypeSelector
          onSelectType={handleTypeSelect}
          onClose={() => setShowTypeSelector(false)}
        />
      )}

      {/* Form Modal */}
      {showModal && (
        <DeductionForm
          deduction={editingDeduction}
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Permanent Deletion
            </h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to permanently delete "
              {deleteConfirmation.deduction?.name}"?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm font-medium">
                🚨 WARNING: This action cannot be undone!
              </p>
              <ul className="text-red-700 text-sm mt-2 space-y-1">
                <li>
                  • This deduction will be permanently removed from the database
                </li>
                <li>• All associated data will be lost forever</li>
                <li>• This action cannot be reversed</li>
              </ul>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
              >
                {isSubmitting ? (
                  <>
                    <HiRefresh className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Confirmation Modal */}
      {toggleConfirmation.show && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {toggleConfirmation.deduction?.isActive
                ? "Deactivate Deduction"
                : "Activate Deduction"}
            </h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to{" "}
              {toggleConfirmation.deduction?.isActive
                ? "deactivate"
                : "activate"}{" "}
              "{toggleConfirmation.deduction?.name}"?
            </p>
            {toggleConfirmation.deduction?.isActive ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ WARNING: This deduction will NOT be applied in the next
                  payroll processing. Employees will not have this deduction
                  taken from their salary.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-800 text-sm">
                  ✅ This deduction will be applied in the next payroll
                  processing.
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelToggle}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggle}
                disabled={isSubmitting}
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] ${
                  toggleConfirmation.deduction?.isActive
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <HiRefresh className="w-4 h-4 mr-2 animate-spin" />
                    {toggleConfirmation.deduction?.isActive
                      ? "Deactivating..."
                      : "Activating..."}
                  </>
                ) : toggleConfirmation.deduction?.isActive ? (
                  "Deactivate"
                ) : (
                  "Activate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYE Info Modal */}
      {payeInfo.show && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {payeInfo.loading ? (
              <div className="flex items-center justify-center py-8">
                <HiRefresh className="w-8 h-8 animate-spin text-[var(--elra-primary)]" />
                <span className="ml-3 text-gray-600">
                  Loading tax brackets...
                </span>
              </div>
            ) : payeInfo.data ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {payeInfo.data.title}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {payeInfo.data.description}
                    </p>
                  </div>
                  <button
                    onClick={cancelPAYEInfo}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <HiX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {payeInfo.data.brackets.map((bracket, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-4 rounded-xl shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">
                            {bracket.range}
                          </h4>
                          {bracket.additionalTax && (
                            <p className="text-sm opacity-90">
                              Additional: {bracket.additionalTax}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="bg-white rounded-lg px-4 py-2 shadow-md">
                            <span className="text-2xl font-bold text-[var(--elra-primary)]">
                              {bracket.rate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> {payeInfo.data.note}
                  </p>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={cancelPAYEInfo}
                    className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  No tax bracket information available
                </p>
                <button
                  onClick={cancelPAYEInfo}
                  className="mt-4 px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deduction Details Modal */}
      {showDetailsModal && selectedDeduction && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedDeduction.name}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {selectedDeduction.description}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                        selectedDeduction.type
                      )}`}
                    >
                      {selectedDeduction.type}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                        selectedDeduction.category
                      )}`}
                    >
                      {formatCategoryName(selectedDeduction.category)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scope
                    </label>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScopeColor(
                        selectedDeduction.scope
                      )}`}
                    >
                      {selectedDeduction.scope}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedDeduction.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedDeduction.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calculation Type
                    </label>
                    <p className="text-gray-900 font-medium">
                      {selectedDeduction.calculationType === "percentage"
                        ? "Percentage"
                        : "Fixed Amount"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <p className="text-2xl font-bold text-[var(--elra-primary)]">
                      {selectedDeduction.calculationType === "percentage"
                        ? `${selectedDeduction.amount}%`
                        : formatCurrency(selectedDeduction.amount)}
                    </p>
                  </div>

                  {selectedDeduction.calculationType === "percentage" &&
                    selectedDeduction.percentageBase && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Percentage Base
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedDeduction.percentageBase === "base_salary"
                            ? "Base Salary"
                            : "Gross Salary"}
                        </p>
                      </div>
                    )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <p className="text-gray-900 font-medium capitalize">
                      {selectedDeduction.frequency}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <p className="text-gray-900">
                    {new Date(selectedDeduction.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <p className="text-gray-900">
                    {selectedDeduction.endDate
                      ? new Date(selectedDeduction.endDate).toLocaleDateString()
                      : "No end date"}
                  </p>
                </div>
              </div>

              {/* Scope-specific Information */}
              {selectedDeduction.scope === "individual" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Affected Employees
                  </label>
                  <div className="space-y-3">
                    {selectedDeduction.employees &&
                    selectedDeduction.employees.length > 0 ? (
                      selectedDeduction.employees.map((employee, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <img
                            src={getImageUrl(employee?.avatar, employee)}
                            alt={`${employee?.firstName || "Unknown"} ${
                              employee?.lastName || "Employee"
                            }`}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = getDefaultAvatar(employee);
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {employee?.firstName || "Unknown"}{" "}
                              {employee?.lastName || "Employee"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {employee?.employeeId || "No ID"}
                            </p>
                            {employee?.department?.name && (
                              <p className="text-xs text-gray-400">
                                {employee.department.name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : selectedDeduction.employee ? (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={getImageUrl(
                            selectedDeduction.employee?.avatar,
                            selectedDeduction.employee
                          )}
                          alt={`${
                            selectedDeduction.employee?.firstName || "Unknown"
                          } ${
                            selectedDeduction.employee?.lastName || "Employee"
                          }`}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = getDefaultAvatar(
                              selectedDeduction.employee
                            );
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {selectedDeduction.employee?.firstName || "Unknown"}{" "}
                            {selectedDeduction.employee?.lastName || "Employee"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedDeduction.employee?.employeeId || "No ID"}
                          </p>
                          {selectedDeduction.employee?.department?.name && (
                            <p className="text-xs text-gray-400">
                              {selectedDeduction.employee.department.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        No specific employees selected
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedDeduction.scope === "department" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Affected Departments
                  </label>
                  <div className="space-y-3">
                    {selectedDeduction.departments &&
                    selectedDeduction.departments.length > 0 ? (
                      selectedDeduction.departments.map((department, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-10 h-10 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-semibold">
                            {department.name?.charAt(0) || "D"}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {department?.name || "Unknown Department"}
                            </p>
                            <p className="text-sm text-gray-500">Department</p>
                            {department?.description && (
                              <p className="text-xs text-gray-400">
                                {department.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : selectedDeduction.department ? (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-semibold">
                          {selectedDeduction.department.name?.charAt(0) || "D"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {selectedDeduction.department?.name ||
                              "Unknown Department"}
                          </p>
                          <p className="text-sm text-gray-500">Department</p>
                          {selectedDeduction.department?.description && (
                            <p className="text-xs text-gray-400">
                              {selectedDeduction.department.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        No specific departments selected
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedDeduction.scope === "company" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Scope Information
                  </label>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800">
                      This deduction applies to <strong>all employees</strong>{" "}
                      across the entire company.
                    </p>
                  </div>
                </div>
              )}

              {/* Created By Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created By
                </label>
                <div className="flex items-center space-x-3">
                  {selectedDeduction.createdBy?.avatar ? (
                    <img
                      src={getImageUrl(
                        selectedDeduction.createdBy.avatar,
                        selectedDeduction.createdBy
                      )}
                      alt={`${
                        selectedDeduction.createdBy?.firstName || "Unknown"
                      } ${selectedDeduction.createdBy?.lastName || "User"}`}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-8 h-8 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                      selectedDeduction.createdBy?.avatar ? "hidden" : ""
                    }`}
                  >
                    {selectedDeduction.createdBy?.firstName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedDeduction.createdBy?.firstName || "Unknown"}{" "}
                      {selectedDeduction.createdBy?.lastName || "User"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedDeduction.createdBy?.email && (
                        <span className="block text-xs text-gray-400">
                          {selectedDeduction.createdBy.email}
                        </span>
                      )}
                      {new Date(
                        selectedDeduction.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEditDeduction(selectedDeduction);
                }}
                className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center"
              >
                <HiPencil className="w-4 h-4 mr-2" />
                Edit Deduction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeductionsManagement;
