import React, { useState, useEffect } from "react";
import { HiX } from "react-icons/hi";
import { Listbox, Transition } from "@headlessui/react";
import {
  fetchDeductionCategories,
  fetchEmployeesByDepartments,
} from "../../services/deductionAPI";
import { userModulesAPI } from "../../services/userModules";
import { formatCurrency } from "../../utils/formatters";

const DeductionForm = ({
  deduction = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    employee: "",
    employees: [],
    name: "",
    description: "",
    type: "",
    calculationType: "fixed",
    amount: "",
    percentageBase: "base_salary",
    category: "",
    scope: "company",
    useTaxBrackets: false,
    frequency: "monthly",
    startDate: "",
    endDate: "",
    department: "",
    departments: [],
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingDepartmentEmployees, setLoadingDepartmentEmployees] =
    useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesResponse, employeesResponse, departmentsResponse] =
          await Promise.all([
            fetchDeductionCategories(),
            userModulesAPI.users.getAllUsers(),
            userModulesAPI.departments.getAllDepartments(),
          ]);

        setCategories(categoriesResponse.data?.categories || []);
        setEmployees(employeesResponse.data || []);
        setDepartments(departmentsResponse.data || []);
      } catch (error) {
        console.error("Error loading form data:", error);
      } finally {
        setLoadingCategories(false);
        setLoadingEmployees(false);
        setLoadingDepartments(false);
      }
    };

    loadData();
  }, []);

  // Click outside handler for employee dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showEmployeeDropdown &&
        !event.target.closest(".employee-dropdown-container")
      ) {
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmployeeDropdown]);

  // Fetch employees when departments change
  useEffect(() => {
    const fetchDepartmentEmployees = async () => {
      if (formData.scope === "individual" && selectedDepartments.length > 0) {
        setLoadingDepartmentEmployees(true);

        try {
          const response = await fetchEmployeesByDepartments(
            selectedDepartments
          );
          setDepartmentEmployees(response.data);
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
  }, [selectedDepartments, formData.scope]);

  useEffect(() => {
    if (deduction) {
      console.log(
        "🔍 [DeductionForm] Populating form with deduction:",
        deduction
      );
      setFormData({
        employee: deduction.employee?._id || deduction.employee || "",
        employees: deduction.employees || [],
        name: deduction.name || "",
        description: deduction.description || "",
        type: deduction.type || "",
        calculationType: deduction.calculationType || "fixed",
        amount: deduction.amount || "",
        percentageBase: deduction.percentageBase || "base_salary",
        category: deduction.category || "",
        scope: deduction.scope || "company",
        useTaxBrackets: deduction.useTaxBrackets || false,
        frequency: deduction.frequency || "monthly",
        startDate: deduction.startDate
          ? new Date(deduction.startDate).toISOString().split("T")[0]
          : "",
        endDate: deduction.endDate
          ? new Date(deduction.endDate).toISOString().split("T")[0]
          : "",
        department: deduction.department?._id || deduction.department || "",
        departments: deduction.departments || [],
      });

      // Set selected arrays
      setSelectedEmployees(deduction.employees || []);
      setSelectedDepartments(deduction.departments || []);
    } else {
      console.log("🔍 [DeductionForm] Resetting form for new deduction");
      // Reset form when no deduction (new creation)
      setFormData({
        employee: "",
        employees: [],
        name: "",
        description: "",
        type: "",
        calculationType: "fixed",
        amount: "",
        percentageBase: "base_salary",
        category: "",
        scope: "company",
        useTaxBrackets: false,
        frequency: "monthly",
        startDate: "",
        endDate: "",
        department: "",
        departments: [],
      });

      // Reset selected arrays
      setSelectedEmployees([]);
      setSelectedDepartments([]);
    }
  }, [deduction]);

  const handleInputChange = (field, value) => {
    console.log(`🔍 [DeductionForm] handleInputChange: ${field} = ${value}`);

    // Auto-set scope for statutory deductions
    if (field === "type" && value === "statutory") {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        scope: "company", // Auto-set to company for statutory
      }));
      // Clear selections for company scope
      setSelectedEmployees([]);
      setSelectedDepartments([]);
      setFilteredEmployees([]);
      return;
    }

    // Auto-set useTaxBrackets for PAYE
    if (field === "category" && value === "paye") {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        useTaxBrackets: true,
      }));
      return;
    }

    if (field === "calculationType" && value === "percentage") {
      const currentAmount = formData.amount;
      if (currentAmount) {
        let cleanValue = currentAmount.toString().replace(/[^\d.]/g, "");

        const decimalCount = (cleanValue.match(/\./g) || []).length;
        if (decimalCount > 1) {
          cleanValue = cleanValue.replace(/\.+$/, "");
          const parts = cleanValue.split(".");
          cleanValue = parts[0] + "." + parts[1].slice(0, 2);
        }

        if (cleanValue.includes(".")) {
          const parts = cleanValue.split(".");
          cleanValue = parts[0] + "." + parts[1].slice(0, 2);
        }

        const numValue = parseFloat(cleanValue);
        if (numValue > 100) {
          cleanValue = "100";
        }

        setFormData((prev) => ({
          ...prev,
          [field]: value,
          amount: cleanValue,
        }));
        return;
      }
    }

    // Handle amount validation and formatting for percentage
    if (field === "amount" && formData.calculationType === "percentage") {
      // Remove any non-numeric characters except decimal point
      let cleanValue = value.replace(/[^\d.]/g, "");

      // Ensure only one decimal point
      const decimalCount = (cleanValue.match(/\./g) || []).length;
      if (decimalCount > 1) {
        cleanValue = cleanValue.replace(/\.+$/, "");
        const parts = cleanValue.split(".");
        cleanValue = parts[0] + "." + parts.slice(1).join("");
      }

      if (cleanValue.includes(".")) {
        const parts = cleanValue.split(".");
        cleanValue = parts[0] + "." + parts[1].slice(0, 2);
      }

      const numValue = parseFloat(cleanValue);
      if (numValue > 100) {
        cleanValue = "100";
      }

      value = cleanValue;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Handle scope changes
    if (field === "scope") {
      if (value === "company") {
        setSelectedEmployees([]);
        setSelectedDepartments([]);
        setFilteredEmployees([]);
        setEmployeeSearchTerm("");
      } else if (value === "department") {
        setSelectedEmployees([]);
        setFilteredEmployees([]);
        setEmployeeSearchTerm("");
      } else if (value === "individual") {
        setEmployeeSearchTerm("");
      }
    }

    // Handle department selection for employee filtering
    if (field === "department" && value) {
      const deptEmployees = employees.filter((emp) => emp.department === value);
      setFilteredEmployees(deptEmployees);
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = "Deduction name is required";

    // Validate category for all deductions
    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.scope) newErrors.scope = "Scope is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (
      formData.endDate &&
      new Date(formData.endDate) <= new Date(formData.startDate)
    ) {
      newErrors.endDate = "End date must be after start date";
    }

    // Only validate calculation fields for non-PAYE deductions
    if (formData.category !== "paye") {
      if (!formData.calculationType)
        newErrors.calculationType = "Calculation type is required";
      if (!formData.amount || formData.amount <= 0)
        newErrors.amount = "Valid amount is required";
    }

    // Scope-specific validation
    if (formData.scope === "department" && selectedDepartments.length === 0) {
      newErrors.departments = "Please select at least one department";
    }
    if (formData.scope === "individual") {
      if (selectedDepartments.length === 0) {
        newErrors.departments = "Please select at least one department";
      }
      // Employees are optional - if none selected, will apply to all employees in selected departments
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submissionData = {
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : null,
      employees: formData.scope === "individual" ? selectedEmployees : [],
      departments:
        formData.scope === "department" || formData.scope === "individual"
          ? selectedDepartments
          : [],
    };

    // Category is now handled by user selection for all deduction types

    // Only parse amount for non-PAYE deductions
    if (formData.category !== "paye") {
      submissionData.amount = parseFloat(formData.amount);
    } else {
      // For PAYE deductions, don't send amount since it uses tax brackets
      delete submissionData.amount;
      delete submissionData.calculationType;
      delete submissionData.percentageBase;
    }

    // Remove status field - backend will auto-set it
    delete submissionData.status;

    onSubmit(submissionData);
  };

  const getCategoryInfo = (categoryValue) => {
    return categories.find((cat) => cat.value === categoryValue);
  };

  const handleDepartmentSelect = (deptId) => {
    setSelectedDepartments((prev) => {
      const isSelected = prev.includes(deptId);
      if (isSelected) {
        return prev.filter((id) => id !== deptId);
      } else {
        return [...prev, deptId];
      }
    });
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

  const getDefaultAvatar = () => {
    return "https://ui-avatars.com/api/?name=Employee&background=random&color=fff&size=40&rounded=true";
  };

  const getEmployeeAvatar = (employee) => {
    if (!employee.avatar) return getDefaultAvatar();
    if (employee.avatar.startsWith("http")) return employee.avatar;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");
    return `${baseUrl}${employee.avatar}`;
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {deduction && deduction._id
                ? "Edit Deduction"
                : "Add New Deduction"}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection - For All Deductions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                errors.category ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loadingCategories}
            >
              {loadingCategories ? (
                <option>Loading categories...</option>
              ) : (
                <>
                  <option value="">Select Category</option>
                  {categories
                    .filter((category) => {
                      if (formData.type === "voluntary")
                        return category.type === "voluntary";
                      if (formData.type === "statutory")
                        return category.type === "statutory";
                      return true;
                    })
                    .map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                </>
              )}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>

          {/* Deduction Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deduction Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Health Insurance Premium"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scope *
            </label>
            <select
              value={formData.scope}
              onChange={(e) => handleInputChange("scope", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                errors.scope ? "border-red-500" : "border-gray-300"
              }`}
              disabled={formData.type === "statutory"}
            >
              <option value="company">Company-wide</option>
              <option value="department">Department-wide</option>
              <option value="individual">Individual</option>
            </select>
            {formData.type === "statutory" && (
              <p className="text-xs text-blue-600 mt-1">
                Statutory deductions are automatically applied company-wide
              </p>
            )}
            {errors.scope && (
              <p className="text-red-500 text-sm mt-1">{errors.scope}</p>
            )}
          </div>

          {/* Department Selection - For Department and Individual Scope */}
          {(formData.scope === "department" ||
            formData.scope === "individual") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.scope === "department"
                  ? "Departments *"
                  : "Departments *"}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {loadingDepartments ? (
                  <div className="col-span-full text-center text-gray-500">
                    Loading departments...
                  </div>
                ) : (
                  <>
                    {departments.map((dept) => (
                      <label
                        key={dept._id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDepartments.includes(dept._id)}
                          onChange={() => handleDepartmentSelect(dept._id)}
                          className="rounded border-gray-300 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)]"
                        />
                        <span className="text-sm text-gray-700">
                          {dept.name}
                        </span>
                      </label>
                    ))}
                    {selectedDepartments.length > 0 && (
                      <div className="col-span-full mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-700">
                          Selected: {selectedDepartments.length} department(s)
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
              {errors.departments && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.departments}
                </p>
              )}
            </div>
          )}

          {/* Employee Selection - Only for Individual Scope */}
          {formData.scope === "individual" && (
            <div className="employee-dropdown-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employees (Optional)
              </label>

              {/* Info Message */}
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>How it works:</strong> If you select departments but
                  don't choose specific employees, the deduction will
                  automatically apply to <strong>ALL employees</strong> in the
                  selected departments. You can optionally select specific
                  employees to limit the deduction to only those individuals.
                </p>
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
                            Select specific employees (optional) - will apply to
                            all if none selected
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
                                        {employee.firstName} {employee.lastName}
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
                                <p>Please select departments first</p>
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
                <p className="text-red-500 text-sm mt-1">{errors.employees}</p>
              )}
            </div>
          )}

          {/* Deduction Type (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deduction Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                errors.type ? "border-red-500" : "border-gray-300"
              }`}
              disabled={true}
            >
              <option value="">Select Type</option>
              <option value="statutory">Statutory</option>
              <option value="voluntary">Voluntary</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Type is set from the selector
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
              placeholder="Brief description of the deduction..."
            />
          </div>

          {/* Calculation Details - Hidden for PAYE */}
          {formData.category !== "paye" && (
            <div className="space-y-6">
              {/* Calculation Type and Amount */}
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                      errors.calculationType
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                  {errors.calculationType && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.calculationType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.calculationType === "percentage"
                      ? "Percentage (%)"
                      : "Amount"}{" "}
                    *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                      errors.amount ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder={
                      formData.calculationType === "percentage"
                        ? "5.0"
                        : "50000"
                    }
                    step={
                      formData.calculationType === "percentage" ? "0.1" : "1"
                    }
                    min="0"
                  />
                  {formData.amount && formData.calculationType === "fixed" && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(formData.amount)}
                    </p>
                  )}
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                  )}
                </div>
              </div>

              {/* Percentage Base - Only shown for percentage calculations */}
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
          )}

          {/* PAYE Tax Brackets Info - Auto-applied for PAYE */}
          {formData.category === "paye" && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-blue-900">
                  Tax Brackets Auto-Applied
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                PAYE will be calculated using progressive tax brackets based on
                income levels. No manual calculation type or percentage needed.
              </p>
            </div>
          )}

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => handleInputChange("frequency", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="one_time">One Time</option>
            </select>
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
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                  errors.startDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                  errors.endDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for ongoing deductions
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] border border-transparent rounded-lg hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting
                ? "Saving..."
                : deduction && deduction._id
                ? "Update Deduction"
                : "Create Deduction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeductionForm;
