import React, { useState, useEffect } from "react";
import { HiX, HiRefresh } from "react-icons/hi";
import { Listbox, Transition } from "@headlessui/react";
import {
  fetchBonusTypes,
  fetchEmployeesByDepartments,
  getTaxableStatus,
} from "../../services/bonusAPI";
import { userModulesAPI } from "../../services/userModules";
import { formatCurrency } from "../../utils/formatters";

const BonusForm = ({
  bonus = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "performance",
    calculationType: "fixed",
    amount: "",
    percentageBase: "base_salary",
    category: "performance",
    scope: "company",
    frequency: "yearly",
    startDate: "",
    endDate: "",
    taxable: null,
    status: "active",
    employee: "",
    employees: [],
    department: "",
    departments: [],
  });

  const [errors, setErrors] = useState({});
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingDepartmentEmployees, setLoadingDepartmentEmployees] =
    useState(false);

  // Initialize form data if editing
  useEffect(() => {
    if (bonus) {
      setFormData({
        name: bonus.name || "",
        description: bonus.description || "",
        type: bonus.type || "performance",
        calculationType: bonus.calculationType || "fixed",
        amount: bonus.amount || "",
        percentageBase: bonus.percentageBase || "base_salary",
        category: bonus.category || "performance",
        scope: bonus.scope || "company",
        frequency: bonus.frequency || "yearly",
        startDate: bonus.startDate
          ? new Date(bonus.startDate).toISOString().split("T")[0]
          : "",
        endDate: bonus.endDate
          ? new Date(bonus.endDate).toISOString().split("T")[0]
          : "",
        taxable: bonus.taxable !== undefined ? bonus.taxable : null,
        status: bonus.status || "active",
        employee: bonus.employee || "",
        employees: bonus.employees || [],
        department: bonus.department || "",
        departments: bonus.departments || [],
      });

      if (bonus.employees && Array.isArray(bonus.employees)) {
        const employeeIds = bonus.employees.map((emp) =>
          typeof emp === "string" ? emp : emp._id || emp.id
        );
        setSelectedEmployees(employeeIds);
      }
      if (bonus.departments && Array.isArray(bonus.departments)) {
        const departmentIds = bonus.departments.map((dept) =>
          typeof dept === "string" ? dept : dept._id || dept.id
        );
        setSelectedDepartments(departmentIds);
      }
    } else {
      // Reset form when not editing
      setSelectedEmployees([]);
      setSelectedDepartments([]);
    }
  }, [bonus]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [typesResponse, employeesResponse, departmentsResponse] =
          await Promise.all([
            fetchBonusTypes(),
            userModulesAPI.users.getAllUsers(),
            userModulesAPI.departments.getAllDepartments(),
          ]);

        setTypes(typesResponse.data || []);
        setEmployees(employeesResponse.data || []);
        setDepartments(departmentsResponse.data || []);
      } catch (error) {
        console.error("Error loading form data:", error);
      } finally {
        setLoadingTypes(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const fetchDepartmentEmployees = async () => {
      if (formData.scope === "individual") {
        setLoadingDepartmentEmployees(true);

        try {
          if (selectedDepartments.length > 0) {
            const response = await fetchEmployeesByDepartments(
              selectedDepartments
            );
            setDepartmentEmployees(response.data || []);
          } else {
            setDepartmentEmployees(employees);
          }
        } catch (error) {
          console.error("Error fetching department employees:", error);
          setDepartmentEmployees([]);
        } finally {
          setLoadingDepartmentEmployees(false);
        }
      } else {
        setDepartmentEmployees([]);
      }
    };

    fetchDepartmentEmployees();
  }, [selectedDepartments, formData.scope, employees]);

  const [loadingTaxableStatus, setLoadingTaxableStatus] = useState(false);

  const fetchTaxableStatus = async (type) => {
    try {
      setLoadingTaxableStatus(true);
      const response = await getTaxableStatus(type);
      if (response.success) {
        setFormData((prev) => ({ ...prev, taxable: response.data.taxable }));
      }
    } catch (error) {
      console.error("Error fetching taxable status:", error);
    } finally {
      setLoadingTaxableStatus(false);
    }
  };

  // Update taxable status when type changes
  useEffect(() => {
    if (formData.type) {
      fetchTaxableStatus(formData.type);
    }
  }, [formData.type]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Handle scope change
    if (field === "scope") {
      setSelectedEmployees([]);
      // Only clear departments when switching to company scope
      if (value === "company") {
        setSelectedDepartments([]);
      }
    }

    // Taxable status will be determined by backend
    // No frontend manipulation of taxable status

    // Auto-set category to match type (they're the same)
    if (field === "type") {
      setFormData((prev) => ({
        ...prev,
        category: value,
      }));
    }

    // Real-time date validation when frequency or dates change
    if (field === "frequency" || field === "startDate" || field === "endDate") {
      const newFormData = { ...formData, [field]: value };
      const dateValidation = validateDatesByFrequency(
        newFormData.frequency,
        newFormData.startDate,
        newFormData.endDate
      );

      if (!dateValidation.isValid) {
        setErrors((prev) => ({ ...prev, endDate: dateValidation.message }));
      } else if (errors.endDate && field === "endDate") {
        setErrors((prev) => ({ ...prev, endDate: "" }));
      }
    }
  };

  const handleDepartmentChange = (departmentId, isChecked) => {
    if (isChecked) {
      setSelectedDepartments((prev) => [...prev, departmentId]);
    } else {
      setSelectedDepartments((prev) =>
        prev.filter((id) => id !== departmentId)
      );
    }
  };

  const handleEmployeeSelect = (empId) => {
    setSelectedEmployees((prev) => {
      const isSelected = prev.includes(empId);
      if (isSelected) {
        return prev.filter((id) => id !== empId);
      } else {
        return [...prev, empId];
      }
    });
  };

  const getEmployeesForDepartments = () => {
    let availableEmployees = departmentEmployees;

    if (employeeSearchTerm.trim()) {
      const searchLower = employeeSearchTerm.toLowerCase();
      availableEmployees = availableEmployees.filter(
        (emp) =>
          emp.firstName.toLowerCase().includes(searchLower) ||
          emp.lastName.toLowerCase().includes(searchLower) ||
          emp.employeeId.toLowerCase().includes(searchLower)
      );
    }

    return availableEmployees;
  };

  const handleEmployeeChange = (employeeId, isChecked) => {
    if (isChecked) {
      setSelectedEmployees((prev) => [...prev, employeeId]);
    } else {
      setSelectedEmployees((prev) => prev.filter((id) => id !== employeeId));
    }
  };

  // Frequency-based date validation
  const validateDatesByFrequency = (frequency, startDate, endDate) => {
    if (!startDate) return { isValid: true };

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    switch (frequency) {
      case "yearly":
        if (end) {
          const endYear = end.getFullYear();
          const startYear = start.getFullYear();

          // Check if end date is before December of the start year
          if (endYear === startYear && end.getMonth() < 11) {
            return {
              isValid: false,
              message: `Yearly bonuses are only processed in December. Your end date (${end.toLocaleDateString()}) is before December, so this bonus will never be used. Please set end date to December 31st or later, or remove the end date entirely.`,
            };
          }

          // Check if end date is in a different year but before December
          if (endYear > startYear && end.getMonth() < 11) {
            return {
              isValid: false,
              message: `Yearly bonuses are only processed in December. Your end date (${end.toLocaleDateString()}) is before December ${endYear}, so this bonus will never be used in ${endYear}. Please set end date to December 31st or later.`,
            };
          }
        }
        break;

      case "quarterly":
        if (end) {
          const monthsDiff =
            (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth());
          if (monthsDiff < 3) {
            return {
              isValid: false,
              message: `Quarterly bonuses are processed in months 3, 6, 9, and 12. Your end date doesn't allow enough time for quarterly processing. Please set end date to at least 3 months after start date.`,
            };
          }
        }
        break;

      case "monthly":
      case "one_time":
        // No special validation needed for monthly and one-time
        break;
    }

    return { isValid: true };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = "Bonus name is required";
    if (!formData.amount || formData.amount <= 0)
      newErrors.amount = "Valid amount is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.type) newErrors.type = "Bonus type is required";

    // Frequency-based date validation
    const dateValidation = validateDatesByFrequency(
      formData.frequency,
      formData.startDate,
      formData.endDate
    );
    if (!dateValidation.isValid) {
      newErrors.endDate = dateValidation.message;
    }

    // Scope-specific validation
    if (formData.scope === "individual" && selectedEmployees.length === 0) {
      newErrors.employees = "At least one employee must be selected";
    }
    if (formData.scope === "department" && selectedDepartments.length === 0) {
      newErrors.departments = "At least one department must be selected";
    }

    // Percentage validation
    if (formData.calculationType === "percentage") {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount < 0 || amount > 100) {
        newErrors.amount = "Percentage must be between 0 and 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Prepare submission data
    const submissionData = {
      ...formData,
      employees: selectedEmployees,
      departments: selectedDepartments,
    };

    // Clear employee field for individual scope (will use employees array instead)
    if (formData.scope === "individual") {
      submissionData.employee = null;
    }

    try {
      await onSubmit(submissionData);
    } catch (error) {
      console.error("Error submitting bonus:", error);
    }
  };

  const getTaxableStatusDisplay = () => {
    const isTaxable = formData.taxable;
    if (isTaxable === null) {
      return {
        text: "Select bonus type",
        color: "text-gray-500",
        bgColor: "bg-gray-50",
      };
    }
    return {
      text: isTaxable ? "Taxable" : "Non-taxable",
      color: isTaxable ? "text-red-600" : "text-green-600",
      bgColor: isTaxable ? "bg-red-50" : "bg-green-50",
    };
  };

  const taxableDisplay = getTaxableStatusDisplay();

  // Image utility functions
  const getDefaultAvatar = (employee = null) => {
    if (employee?.firstName || employee?.lastName) {
      const firstName = employee.firstName || "";
      const lastName = employee.lastName || "";
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
    try {
      return getImageUrl(employee.avatar, employee);
    } catch (error) {
      return getDefaultAvatar(employee);
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {bonus ? "Edit Bonus" : "Add New Bonus"}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Basic Information
              </h3>

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
                    placeholder="Enter bonus name"
                  />
                  {errors.name && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                        <p className="text-red-700 text-sm leading-relaxed break-words">
                          {errors.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scope *
                  </label>
                  <select
                    value={formData.scope}
                    onChange={(e) => handleInputChange("scope", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                  >
                    <option value="company">Company-wide</option>
                    <option value="department">Department-specific</option>
                    <option value="individual">Individual Employee(s)</option>
                  </select>
                </div>
              </div>

              {/* Scope-specific Selection - Immediately under scope field */}
              {formData.scope === "department" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Departments *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((dept) => (
                      <label
                        key={dept._id}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDepartments.includes(dept._id)}
                          onChange={(e) =>
                            handleDepartmentChange(dept._id, e.target.checked)
                          }
                          className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {dept.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.departments && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                        <p className="text-red-700 text-sm leading-relaxed break-words">
                          {errors.departments}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData.scope === "individual" && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Departments (Optional)
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                      Select departments to filter employees, or leave empty to
                      show all employees
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {departments.map((dept) => (
                        <label
                          key={dept._id}
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(dept._id)}
                            onChange={(e) =>
                              handleDepartmentChange(dept._id, e.target.checked)
                            }
                            className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {dept.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Employee Selection with Headless UI */}
                  <div className="relative">
                    <Listbox
                      value={selectedEmployees}
                      onChange={setSelectedEmployees}
                      multiple
                    >
                      <div className="relative">
                        <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between">
                          <div className="flex-1 text-left">
                            {selectedEmployees.length > 0 ? (
                              <span className="text-gray-900">
                                {selectedEmployees.length} employee(s) selected
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                Select specific employees (optional) - will
                                apply to all if none selected
                              </span>
                            )}
                          </div>
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </Listbox.Button>

                        <Transition
                          as={React.Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-50 top-full left-0 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                            {/* Search Bar */}
                            <div className="p-3 border-b border-gray-200">
                              <input
                                type="text"
                                value={employeeSearchTerm}
                                onChange={(e) =>
                                  setEmployeeSearchTerm(e.target.value)
                                }
                                placeholder="Search employees by name or ID..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                              />
                            </div>

                            {/* Employee List */}
                            <div className="max-h-48 overflow-y-auto">
                              {loadingDepartmentEmployees ? (
                                <div className="p-4 text-center text-gray-500">
                                  Loading employees...
                                </div>
                              ) : getEmployeesForDepartments().length > 0 ? (
                                getEmployeesForDepartments().map((employee) => (
                                  <Listbox.Option
                                    key={employee._id}
                                    value={employee._id}
                                    className={({ active }) =>
                                      `relative cursor-pointer select-none py-2 px-4 ${
                                        active
                                          ? "bg-[var(--elra-primary)] text-white"
                                          : "text-gray-900"
                                      }`
                                    }
                                  >
                                    {({ selected }) => (
                                      <div className="flex items-center space-x-3">
                                        <input
                                          type="checkbox"
                                          checked={selected}
                                          onChange={() =>
                                            handleEmployeeSelect(employee._id)
                                          }
                                          className="rounded border-gray-300 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)]"
                                        />
                                        <img
                                          src={getEmployeeAvatar(employee)}
                                          alt={`${employee.firstName} ${employee.lastName}`}
                                          className="w-8 h-8 rounded-full object-cover"
                                          onError={(e) => {
                                            e.target.src = getDefaultAvatar();
                                          }}
                                        />
                                        <div className="flex-1">
                                          <div className="text-sm font-medium">
                                            {employee.firstName}{" "}
                                            {employee.lastName}
                                          </div>
                                          <div className="text-xs opacity-75">
                                            {employee.employeeId}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Listbox.Option>
                                ))
                              ) : (
                                <div className="p-4 text-center text-gray-500">
                                  {employeeSearchTerm.trim() ? (
                                    <p>
                                      No employees found matching "
                                      {employeeSearchTerm}"
                                    </p>
                                  ) : selectedDepartments.length === 0 ? (
                                    <p>No employees found in the system</p>
                                  ) : (
                                    <p>
                                      No employees found in selected departments
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  {/* Selected Employees Display */}
                  {selectedEmployees.length > 0 && (
                    <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs text-green-700 font-medium mb-2">
                        Selected: {selectedEmployees.length} employee(s)
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedEmployees.map((empId) => {
                          const employee = departmentEmployees.find(
                            (emp) => emp._id === empId
                          );
                          return employee ? (
                            <span
                              key={empId}
                              className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                            >
                              {employee.firstName} {employee.lastName}
                              <button
                                type="button"
                                onClick={() => handleEmployeeSelect(empId)}
                                className="ml-1 text-green-600 hover:text-green-800"
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  {errors.employees && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                        <p className="text-red-700 text-sm leading-relaxed break-words">
                          {errors.employees}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  placeholder="Enter bonus description"
                />
              </div>
            </div>

            {/* Bonus Type */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Bonus Type
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  disabled={loadingTypes}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                    loadingTypes ? "opacity-50" : ""
                  }`}
                >
                  <option value="">Select bonus type</option>
                  {types.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                      <p className="text-red-700 text-sm leading-relaxed break-words">
                        {errors.type}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Taxable Status Display */}
              <div className={`p-3 rounded-lg ${taxableDisplay.bgColor}`}>
                {loadingTaxableStatus ? (
                  <div className="flex items-center">
                    <HiRefresh className="w-4 h-4 mr-2 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Checking...</span>
                  </div>
                ) : (
                  <p className={`text-sm font-medium ${taxableDisplay.color}`}>
                    {taxableDisplay.text}
                  </p>
                )}
              </div>
            </div>

            {/* Calculation Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Calculation Details
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      Amount *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={
                          formData.calculationType === "percentage"
                            ? formData.amount
                            : formData.amount
                            ? formatCurrency(parseFloat(formData.amount))
                            : ""
                        }
                        onChange={(e) => {
                          let value = e.target.value;

                          if (formData.calculationType === "percentage") {
                            // For percentage: only numbers and decimal, max 100
                            value = value.replace(/[^\d.]/g, "");

                            // Ensure only one decimal point
                            const parts = value.split(".");
                            if (parts.length > 2) {
                              value = parts[0] + "." + parts.slice(1).join("");
                            }

                            // Limit decimal places to 2
                            if (parts.length === 2 && parts[1].length > 2) {
                              value = parts[0] + "." + parts[1].substring(0, 2);
                            }

                            // Cap at 100
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue > 100) {
                              value = "100";
                            }
                          } else {
                            // For fixed amount: use formatCurrency input handling
                            value = value.replace(/[^\d,]/g, "");
                            value = value.replace(/,/g, "");
                          }

                          handleInputChange("amount", value);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                          errors.amount ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder={
                          formData.calculationType === "percentage"
                            ? "0.00"
                            : "0.00"
                        }
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 text-sm">
                          {formData.calculationType === "percentage"
                            ? "%"
                            : "₦"}
                        </span>
                      </div>
                    </div>
                    {errors.amount && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <span className="text-red-500 text-sm mt-0.5">
                            ⚠️
                          </span>
                          <p className="text-red-700 text-sm leading-relaxed break-words">
                            {errors.amount}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {formData.calculationType === "percentage" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Percentage Base *
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
            </div>

            {/* Schedule */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Schedule
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency *
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) =>
                      handleInputChange("frequency", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                  >
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="one_time">One Time</option>
                  </select>
                </div>

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
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                        <p className="text-red-700 text-sm leading-relaxed break-words">
                          {errors.startDate}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                    min={formData.startDate}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                      errors.endDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.endDate && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                        <p className="text-red-700 text-sm leading-relaxed break-words">
                          {errors.endDate}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Frequency processing info */}
                  <div className="mt-1 text-xs text-gray-500">
                    {formData.frequency === "yearly" && (
                      <div className="flex items-center space-x-1">
                        <span className="text-orange-600">⚠️</span>
                        <span>Processed in December only</span>
                      </div>
                    )}
                    {formData.frequency === "quarterly" && (
                      <div className="flex items-center space-x-1">
                        <span className="text-blue-600">ℹ️</span>
                        <span>Processed in months 3, 6, 9, 12</span>
                      </div>
                    )}
                    {formData.frequency === "monthly" && (
                      <div className="flex items-center space-x-1">
                        <span className="text-green-600">✓</span>
                        <span>Processed every month</span>
                      </div>
                    )}
                    {formData.frequency === "one_time" && (
                      <div className="flex items-center space-x-1">
                        <span className="text-purple-600">⚡</span>
                        <span>Processed once when eligible</span>
                      </div>
                    )}
                  </div>

                  {/* Smart date suggestions */}
                  {formData.frequency === "yearly" &&
                    formData.startDate &&
                    !formData.endDate && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        💡 <strong>Suggestion:</strong> For yearly bonuses,
                        consider setting end date to December 31st of the target
                        year to ensure it can be processed.
                      </div>
                    )}
                  {formData.frequency === "quarterly" &&
                    formData.startDate &&
                    !formData.endDate && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        💡 <strong>Suggestion:</strong> For quarterly bonuses,
                        ensure end date allows at least 3 months for processing.
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <HiRefresh className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Bonus"
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
