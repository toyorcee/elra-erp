import React, { useState, useEffect } from "react";
import { HiX, HiCheck, HiExclamation } from "react-icons/hi";
import { fetchBonusCategories, fetchBonusTypes } from "../../services/bonusAPI";

const BonusForm = ({
  bonus = null,
  onSubmit,
  onCancel,
  employees = [],
  departments = [],
}) => {
  const [formData, setFormData] = useState({
    employee: bonus?.employee || "",
    name: bonus?.name || "",
    description: bonus?.description || "",
    calculationType: bonus?.calculationType || "fixed",
    amount: bonus?.amount || "",
    percentageBase: bonus?.percentageBase || "base_salary",
    type: bonus?.type || "performance",
    category: bonus?.category || "performance",
    frequency: bonus?.frequency || "yearly",
    startDate: bonus?.startDate
      ? new Date(bonus.startDate).toISOString().split("T")[0]
      : "",
    endDate: bonus?.endDate
      ? new Date(bonus.endDate).toISOString().split("T")[0]
      : "",
    taxable: bonus?.taxable !== undefined ? bonus.taxable : null, // null means auto-categorize
    status: bonus?.status || "active",
    department: bonus?.department || "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Fetch categories and types from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesResponse, typesResponse] = await Promise.all([
          fetchBonusCategories(),
          fetchBonusTypes(),
        ]);
        setCategories(categoriesResponse.data || []);
        setTypes(typesResponse.data || []);
      } catch (error) {
        console.error("Error loading bonus data:", error);
        // Fallback to default data
        setCategories([
          { value: "performance", label: "Performance Bonus", taxable: true },
          { value: "year_end", label: "Year End Bonus", taxable: true },
          { value: "special", label: "Special Bonus", taxable: true },
          { value: "achievement", label: "Achievement Bonus", taxable: true },
          { value: "retention", label: "Retention Bonus", taxable: false },
          { value: "project", label: "Project Bonus", taxable: true },
          { value: "other", label: "Other Bonus", taxable: true },
        ]);
        setTypes([
          { value: "personal", label: "Personal Bonus", taxable: true },
          { value: "performance", label: "Performance Bonus", taxable: true },
          {
            value: "thirteenth_month",
            label: "Thirteenth Month Bonus",
            taxable: true,
          },
          { value: "special", label: "Special Bonus", taxable: true },
          { value: "achievement", label: "Achievement Bonus", taxable: true },
          { value: "retention", label: "Retention Bonus", taxable: false },
          { value: "project", label: "Project Bonus", taxable: true },
          { value: "year_end", label: "Year End Bonus", taxable: true },
        ]);
      } finally {
        setLoadingCategories(false);
        setLoadingTypes(false);
      }
    };
    loadData();
  }, []);

  // Auto-categorization using fetched data
  const getAutoTaxableStatus = (type) => {
    const typeInfo = types.find((t) => t.value === type);
    return typeInfo ? typeInfo.taxable : true;
  };

  const autoTaxableStatus = getAutoTaxableStatus(formData.type);

  // Update taxable status when type changes (unless manually set)
  useEffect(() => {
    if (formData.taxable === null) {
      setFormData((prev) => ({ ...prev, taxable: autoTaxableStatus }));
    }
  }, [formData.type, formData.taxable, autoTaxableStatus]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Auto-update taxable status when type changes
    if (field === "type" && formData.taxable === null) {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        taxable: !nonTaxableBonuses.includes(value),
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employee) newErrors.employee = "Employee is required";
    if (!formData.name) newErrors.name = "Bonus name is required";
    if (!formData.amount || formData.amount <= 0)
      newErrors.amount = "Valid amount is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.department) newErrors.department = "Department is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting bonus:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTaxableStatusDisplay = () => {
    if (formData.taxable === null) {
      return {
        text: `Auto-categorized as ${
          autoTaxableStatus ? "taxable" : "non-taxable"
        }`,
        color: autoTaxableStatus ? "text-red-600" : "text-green-600",
        icon: autoTaxableStatus ? HiExclamation : HiCheck,
        bgColor: autoTaxableStatus ? "bg-red-50" : "bg-green-50",
      };
    }

    return {
      text: formData.taxable
        ? "Manually set as taxable"
        : "Manually set as non-taxable",
      color: formData.taxable ? "text-red-600" : "text-green-600",
      icon: formData.taxable ? HiExclamation : HiCheck,
      bgColor: formData.taxable ? "bg-red-50" : "bg-green-50",
    };
  };

  const taxableDisplay = getTaxableStatusDisplay();
  const TaxableIcon = taxableDisplay.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {bonus ? "Edit Bonus" : "Add New Bonus"}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee *
                </label>
                <select
                  value={formData.employee}
                  onChange={(e) =>
                    handleInputChange("employee", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                    errors.employee ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.employeeId}
                    </option>
                  ))}
                </select>
                {errors.employee && (
                  <p className="text-red-500 text-sm mt-1">{errors.employee}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    handleInputChange("department", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                    errors.department ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.department}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Year End Bonus"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                  placeholder="Brief description of the bonus"
                />
              </div>
            </div>

            {/* Bonus Type and Taxable Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                  disabled={loadingTypes}
                >
                  {loadingTypes ? (
                    <option>Loading types...</option>
                  ) : (
                    <>
                      <option value="">Select Type</option>
                      {types.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taxable Status
                </label>
                <div
                  className={`p-3 rounded-lg border ${taxableDisplay.bgColor} border-gray-200`}
                >
                  <div className="flex items-center space-x-2">
                    <TaxableIcon
                      className={`w-5 h-5 ${taxableDisplay.color}`}
                    />
                    <span
                      className={`text-sm font-medium ${taxableDisplay.color}`}
                    >
                      {taxableDisplay.text}
                    </span>
                  </div>
                  <div className="mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.taxable !== null}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange("taxable", autoTaxableStatus);
                          } else {
                            handleInputChange("taxable", null);
                          }
                        }}
                        className="rounded border-gray-300 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)]"
                      />
                      <span className="text-sm text-gray-600">
                        Override auto-categorization
                      </span>
                    </label>
                    {formData.taxable !== null && (
                      <div className="mt-2">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Taxable Status
                        </label>
                        <select
                          value={formData.taxable ? "true" : "false"}
                          onChange={(e) =>
                            handleInputChange(
                              "taxable",
                              e.target.value === "true"
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        >
                          <option value="false">Non-taxable</option>
                          <option value="true">Taxable</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Manual override of auto-categorization
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Calculation Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calculation Type *
                </label>
                <select
                  value={formData.calculationType}
                  onChange={(e) =>
                    handleInputChange("calculationType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.calculationType === "fixed"
                    ? "Amount (₦)"
                    : "Percentage (%)"}{" "}
                  *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    handleInputChange(
                      "amount",
                      parseFloat(e.target.value) || ""
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={
                    formData.calculationType === "fixed" ? "0.00" : "0"
                  }
                  min="0"
                  step={formData.calculationType === "fixed" ? "0.01" : "0.1"}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                )}
              </div>

              {formData.calculationType === "percentage" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Based On
                  </label>
                  <select
                    value={formData.percentageBase}
                    onChange={(e) =>
                      handleInputChange("percentageBase", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                  >
                    <option value="base_salary">Base Salary</option>
                    <option value="gross_salary">Gross Salary</option>
                  </select>
                </div>
              )}
            </div>

            {/* Frequency and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    handleInputChange("frequency", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one_time">One Time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                >
                  <option value="performance">Performance</option>
                  <option value="year_end">Year End</option>
                  <option value="special">Special</option>
                  <option value="achievement">Achievement</option>
                  <option value="retention">Retention</option>
                  <option value="project">Project</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                    errors.startDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                  min={formData.startDate}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty for ongoing bonus
                </p>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{bonus ? "Update Bonus" : "Create Bonus"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BonusForm;
