import React, { useState, useEffect } from "react";
import { HiX, HiCheck, HiExclamation, HiRefresh } from "react-icons/hi";
import { Listbox, Transition } from "@headlessui/react";
import { formatCurrency } from "../../utils/formatters";
import {
  fetchAllowanceTypes,
  getTaxableStatus,
  fetchEmployeesByDepartments,
} from "../../services/allowanceAPI";
import { userModulesAPI } from "../../services/userModules";

const AllowanceForm = ({
  allowance = null,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState({
    name: allowance?.name || "",
    description: allowance?.description || "",
    type: allowance?.type || "transport",
    calculationType: allowance?.calculationType || "fixed",
    amount: allowance?.amount || "",
    percentageBase: allowance?.percentageBase || "base_salary",
    scope: allowance?.scope || "company",
    frequency: allowance?.frequency || "monthly",
    startDate: allowance?.startDate
      ? new Date(allowance.startDate).toISOString().split("T")[0]
      : "",
    endDate: allowance?.endDate
      ? new Date(allowance.endDate).toISOString().split("T")[0]
      : "",
    taxable: allowance?.taxable !== undefined ? allowance.taxable : null,
  });

  const [errors, setErrors] = useState({});
  const [allowanceTypes, setAllowanceTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingTaxableStatus, setLoadingTaxableStatus] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState(
    allowance?.employees || []
  );
  const [selectedDepartments, setSelectedDepartments] = useState(
    allowance?.departments || []
  );
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);

  useEffect(() => {
    fetchAllowanceTypesData();
    fetchAllEmployees();
    fetchAllDepartments();
  }, []);

  useEffect(() => {
    if (formData.type) {
      fetchTaxableStatus(formData.type);
    }
  }, [formData.type]);

  useEffect(() => {
    if (selectedDepartments.length > 0) {
      fetchEmployeesByDepartments();
    } else {
      setDepartmentEmployees([]);
    }
  }, [selectedDepartments]);

  const fetchAllowanceTypesData = async () => {
    try {
      setLoadingTypes(true);
      const response = await fetchAllowanceTypes();
      setAllowanceTypes(response.data || []);
    } catch (error) {
      console.error("Error fetching allowance types:", error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const fetchTaxableStatus = async (type) => {
    try {
      setLoadingTaxableStatus(true);
      const response = await getTaxableStatus(type);
      setFormData((prev) => ({ ...prev, taxable: response.data.taxable }));
    } catch (error) {
      console.error("Error fetching taxable status:", error);
    } finally {
      setLoadingTaxableStatus(false);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const response = await userModulesAPI.users.getAllUsers();
      setAllEmployees(response.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAllDepartments = async () => {
    try {
      const response = await userModulesAPI.departments.getAllDepartments();
      setAllDepartments(response.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchEmployeesByDepartments = async () => {
    if (selectedDepartments.length === 0) return;

    try {
      setLoadingEmployees(true);
      const departmentIds = selectedDepartments.map((dept) => dept._id);
      const response = await fetchEmployeesByDepartments(departmentIds);
      setDepartmentEmployees(response.data || []);
    } catch (error) {
      console.error("Error fetching employees by departments:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
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

  const handleScopeChange = (scope) => {
    setFormData((prev) => ({ ...prev, scope }));
    setSelectedEmployees([]);
    if (scope === "company") {
      setSelectedDepartments([]);
    }
  };

  const handleDepartmentToggle = (department) => {
    setSelectedDepartments((prev) => {
      const isSelected = prev.some((d) => d._id === department._id);
      if (isSelected) {
        return prev.filter((d) => d._id !== department._id);
      } else {
        return [...prev, department];
      }
    });
  };

  const handleEmployeeToggle = (employee) => {
    setSelectedEmployees((prev) => {
      const isSelected = prev.some((e) => e._id === employee._id);
      if (isSelected) {
        return prev.filter((e) => e._id !== employee._id);
      } else {
        return [...prev, employee];
      }
    });
  };

  const filteredEmployees = (() => {
    let employeeList;

    if (formData.scope === "individual") {
      // For individual scope, filter by selected departments if any
      if (selectedDepartments.length > 0) {
        const selectedDepartmentIds = selectedDepartments.map(
          (dept) => dept._id
        );
        employeeList = allEmployees.filter((employee) =>
          selectedDepartmentIds.includes(
            employee.department?._id || employee.department
          )
        );
      } else {
        // No departments selected, show all employees
        employeeList = allEmployees;
      }
    } else {
      // For department scope, use department employees
      employeeList = departmentEmployees;
    }

    // Apply search filter
    return employeeList.filter((employee) =>
      `${employee.firstName} ${employee.lastName} ${employee.employeeId}`
        .toLowerCase()
        .includes(employeeSearchTerm.toLowerCase())
    );
  })();

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
              message: `Yearly allowances are only processed in December. Your end date (${end.toLocaleDateString()}) is before December, so this allowance will never be used. Please set end date to December 31st or later, or remove the end date entirely.`,
            };
          }

          // Check if end date is in a different year but before December
          if (endYear > startYear && end.getMonth() < 11) {
            return {
              isValid: false,
              message: `Yearly allowances are only processed in December. Your end date (${end.toLocaleDateString()}) is before December ${endYear}, so this allowance will never be used in ${endYear}. Please set end date to December 31st or later.`,
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
              message: `Quarterly allowances are processed in months 3, 6, 9, and 12. Your end date doesn't allow enough time for quarterly processing. Please set end date to at least 3 months after start date.`,
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

    if (!formData.name.trim()) {
      newErrors.name = "Allowance name is required";
    }

    if (!formData.calculationType) {
      newErrors.calculationType = "Calculation type is required";
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (formData.calculationType === "percentage" && formData.amount > 100) {
      newErrors.amount = "Percentage cannot exceed 100%";
    }

    if (!formData.scope) {
      newErrors.scope = "Scope is required";
    }

    if (!formData.frequency) {
      newErrors.frequency = "Frequency is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    // Frequency-based date validation
    const dateValidation = validateDatesByFrequency(
      formData.frequency,
      formData.startDate,
      formData.endDate
    );
    if (!dateValidation.isValid) {
      newErrors.endDate = dateValidation.message;
    }

    if (formData.scope === "individual" && selectedEmployees.length === 0) {
      newErrors.employees = "Please select at least one employee";
    }

    if (formData.scope === "department" && selectedDepartments.length === 0) {
      newErrors.departments = "Please select at least one department";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      employees:
        formData.scope === "individual"
          ? selectedEmployees.map((e) => e._id)
          : [],
      departments:
        formData.scope === "department"
          ? selectedDepartments.map((d) => d._id)
          : [],
    };

    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting allowance:", error);
    }
  };

  const getDefaultAvatar = (employee) => {
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
    if (!employee) return getDefaultAvatar();

    if (employee.avatar && employee.avatar !== "") {
      return getImageUrl(employee.avatar, employee);
    }

    return getDefaultAvatar(employee);
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {allowance ? "Edit Allowance" : "Add New Allowance"}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Scope Selection - Moved to Top */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scope *
            </label>
            <select
              value={formData.scope}
              onChange={(e) => handleScopeChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                errors.scope ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="company">Company-wide</option>
              <option value="department">Department-wide</option>
              <option value="individual">Individual</option>
            </select>
            {errors.scope && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                  <p className="text-red-700 text-sm leading-relaxed break-words">
                    {errors.scope}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Department Selection for Department Scope */}
          {formData.scope === "department" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Departments *
              </label>
              {loadingTypes ? (
                <div className="flex items-center justify-center p-8 border border-gray-300 rounded-lg">
                  <HiRefresh className="w-6 h-6 animate-spin text-[var(--elra-primary)] mr-3" />
                  <span className="text-gray-600">Loading departments...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {allDepartments.map((department) => (
                    <label
                      key={department._id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartments.some(
                          (d) => d._id === department._id
                        )}
                        onChange={() => handleDepartmentToggle(department)}
                        className="rounded border-gray-300 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)]"
                      />
                      <span className="text-sm text-gray-700">
                        {department.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
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

          {/* Department Selection for Individual Scope */}
          {formData.scope === "individual" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Departments (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Select departments to filter employees, or leave empty to show
                all employees
              </p>
              {loadingTypes ? (
                <div className="flex items-center justify-center p-8 border border-gray-300 rounded-lg">
                  <HiRefresh className="w-6 h-6 animate-spin text-[var(--elra-primary)] mr-3" />
                  <span className="text-gray-600">Loading departments...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {allDepartments.map((department) => (
                    <label
                      key={department._id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartments.some(
                          (d) => d._id === department._id
                        )}
                        onChange={() => handleDepartmentToggle(department)}
                        className="rounded border-gray-300 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)]"
                      />
                      <span className="text-sm text-gray-700">
                        {department.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Employee Selection for Individual Scope */}
          {formData.scope === "individual" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Employees *
              </label>
              {loadingEmployees ? (
                <div className="flex items-center justify-center p-8 border border-gray-300 rounded-lg">
                  <HiRefresh className="w-6 h-6 animate-spin text-[var(--elra-primary)] mr-3" />
                  <span className="text-gray-600">Loading employees...</span>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                    />
                  </div>
                  <div className="relative">
                    <Listbox
                      value={selectedEmployees}
                      onChange={setSelectedEmployees}
                      multiple
                    >
                      <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] text-left">
                        {selectedEmployees.length === 0
                          ? "Select employees..."
                          : `${selectedEmployees.length} employee(s) selected`}
                      </Listbox.Button>
                      <Transition
                        enter="transition duration-100 ease-out"
                        enterFrom="transform scale-95 opacity-0"
                        enterTo="transform scale-100 opacity-100"
                        leave="transition duration-75 ease-out"
                        leaveFrom="transform scale-100 opacity-100"
                        leaveTo="transform scale-95 opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {loadingEmployees ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Loading employees...
                            </div>
                          ) : filteredEmployees.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No employees found
                            </div>
                          ) : (
                            filteredEmployees.map((employee) => (
                              <Listbox.Option
                                key={employee._id}
                                value={employee}
                                className={({ active }) =>
                                  `flex items-center space-x-3 px-3 py-2 cursor-pointer ${
                                    active
                                      ? "bg-[var(--elra-primary)] text-white"
                                      : ""
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      readOnly
                                      className="rounded border-gray-300 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)]"
                                    />
                                    <img
                                      src={getEmployeeAvatar(employee)}
                                      alt={`${employee.firstName} ${employee.lastName}`}
                                      className="w-8 h-8 rounded-full"
                                      onError={(e) => {
                                        e.target.src =
                                          getDefaultAvatar(employee);
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {employee.firstName} {employee.lastName}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {employee.employeeId}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </Listbox.Option>
                            ))
                          )}
                        </Listbox.Options>
                      </Transition>
                    </Listbox>
                  </div>
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
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowance Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter allowance name"
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
                Allowance Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                disabled={loadingTypes}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] disabled:opacity-50"
              >
                {allowanceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxable Status
              </label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                {loadingTaxableStatus ? (
                  <HiRefresh className="w-4 h-4 animate-spin text-[var(--elra-primary)]" />
                ) : formData.taxable ? (
                  <HiExclamation className="w-4 h-4 text-red-500" />
                ) : (
                  <HiCheck className="w-4 h-4 text-green-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    formData.taxable ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {loadingTaxableStatus
                    ? "Checking..."
                    : formData.taxable
                    ? "Taxable"
                    : "Non-taxable"}
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
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
                placeholder="Enter allowance description"
              />
            </div>

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
                  errors.calculationType ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
              </select>
              {errors.calculationType && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                    <p className="text-red-700 text-sm leading-relaxed break-words">
                      {errors.calculationType}
                    </p>
                  </div>
                </div>
              )}
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
                      value = value.replace(/[^\d.]/g, "");

                      const parts = value.split(".");
                      if (parts.length > 2) {
                        value = parts[0] + "." + parts.slice(1).join("");
                      }

                      if (parts.length === 2 && parts[1].length > 2) {
                        value = parts[0] + "." + parts[1].substring(0, 2);
                      }

                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue > 100) {
                        value = "100";
                      }
                    } else {
                      value = value.replace(/[^\d,]/g, "");
                      value = value.replace(/,/g, "");
                    }

                    handleInputChange("amount", value);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={
                    formData.calculationType === "percentage" ? "0.00" : "0.00"
                  }
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">
                    {formData.calculationType === "percentage" ? "%" : "₦"}
                  </span>
                </div>
              </div>
              {errors.amount && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                    <p className="text-red-700 text-sm leading-relaxed break-words">
                      {errors.amount}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {formData.calculationType === "percentage" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentage Base
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleInputChange("frequency", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                  errors.frequency ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="one_time">One Time</option>
              </select>
              {errors.frequency && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                    <p className="text-red-700 text-sm leading-relaxed break-words">
                      {errors.frequency}
                    </p>
                  </div>
                </div>
              )}
            </div>

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
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
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
                    💡 <strong>Suggestion:</strong> For yearly allowances,
                    consider setting end date to December 31st of the target
                    year to ensure it can be processed.
                  </div>
                )}
              {formData.frequency === "quarterly" &&
                formData.startDate &&
                !formData.endDate && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    💡 <strong>Suggestion:</strong> For quarterly allowances,
                    ensure end date allows at least 3 months for processing.
                  </div>
                )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
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
                "Save Allowance"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllowanceForm;
