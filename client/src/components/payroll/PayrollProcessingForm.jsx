import React, { useState, useEffect } from "react";
import {
  HiX,
  HiCalendar,
  HiUserGroup,
  HiOfficeBuilding,
  HiUser,
  HiCalculator,
  HiDocumentText,
  HiCheckCircle,
  HiExclamation,
  HiRefresh,
  HiClock,
  HiInformationCircle,
  HiCurrencyDollar,
  HiMinusCircle,
  HiPlus,
  HiChevronLeft,
  HiChevronRight,
  HiBriefcase,
} from "react-icons/hi";
import { toast } from "react-toastify";
import { userModulesAPI } from "../../services/userModules.js";
import DataTable from "../common/DataTable.jsx";
import ELRALogo from "../ELRALogo";

const GreenSpinner = ({ text = "Loading" }) => (
  <div className="flex items-center justify-center h-10 w-full bg-gray-50 rounded-lg border">
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-2 border-[var(--elra-primary)] border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm text-gray-600">
        {text}
        <span className="animate-pulse">...</span>
      </span>
    </div>
  </div>
);

const PayrollProcessingForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    frequency: "monthly",
    scope: "company",
    scopeId: null,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("idle");
  const [payrollData, setPayrollData] = useState([]);
  const [payrollSummary, setPayrollSummary] = useState({
    totalEmployees: 0,
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPay: 0,
    totalTaxableIncome: 0,
    totalPAYE: 0,
  });
  const [previewData, setPreviewData] = useState(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(10);
  const [selectedPayrollDetail, setSelectedPayrollDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [payrollBatchResult, setPayrollBatchResult] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [previewErrors, setPreviewErrors] = useState([]);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from(
    { length: 20 },
    (_, i) => new Date().getFullYear() - 10 + i
  );

  const frequencies = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "one_time", label: "One Time" },
  ];

  const scopes = [
    {
      value: "company",
      label: "All Employees",
      icon: HiOfficeBuilding,
      tooltip: "Process payroll for all employees in the company",
    },
    {
      value: "department",
      label: "Specific Department",
      icon: HiUserGroup,
      tooltip: "Process payroll for all employees in a specific department",
    },
    {
      value: "individual",
      label: "Select Employees",
      icon: HiUser,
      tooltip:
        "Select specific employees from any department or across departments",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }

    return () => {
      if (!isOpen) {
        setPayrollData([]);
        setPayrollSummary({
          totalEmployees: 0,
          totalGrossPay: 0,
          totalDeductions: 0,
          totalNetPay: 0,
          totalTaxableIncome: 0,
          totalPAYE: 0,
        });
        setProcessingStatus("idle");
        setShowSuccessOverlay(false);
        setPreviewData(null);
      }
    };
  }, [isOpen]);

  const loadDropdownData = async () => {
    try {
      setLoadingData(true);
      const [deptResponse, empResponse] = await Promise.all([
        userModulesAPI.payroll.getDepartmentsForPayroll(),
        userModulesAPI.payroll.getEmployeesForPayroll(),
      ]);
      setDepartments(deptResponse);
      setEmployees(empResponse);
    } catch (error) {
      toast.error("Failed to load data");
      console.error("Error loading dropdown data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Validation function
  const validateForm = () => {
    const errors = {};

    if (!formData.month || formData.month < 1 || formData.month > 12) {
      errors.month = "Please select a valid month";
    }

    if (!formData.year || formData.year < 2015 || formData.year > 2050) {
      errors.year = "Please select a valid year";
    }

    if (!formData.frequency) {
      errors.frequency = "Please select payroll frequency";
    }

    if (!formData.scope) {
      errors.scope = "Please select payroll scope";
    }

    if (formData.scope === "department" && !formData.scopeId) {
      errors.scopeId = "Please select a department to process payroll for";
    }

    if (formData.scope === "individual" && selectedEmployees.length === 0) {
      errors.scopeId =
        "Please select at least one employee to process payroll for";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    if (field === "scope") {
      setFormData((prev) => ({
        ...prev,
        scope: value,
        scopeId: null,
      }));
      // Clear selected departments when scope changes
      setSelectedDepartments([]);
      // Clear selected employees when scope changes
      setSelectedEmployees([]);
      // Reset pagination when scope changes
      setCurrentPage(1);
      // Clear payroll data when scope changes
      setPayrollData([]);
      setPayrollSummary({
        totalEmployees: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        totalTaxableIncome: 0,
        totalPAYE: 0,
      });
      setProcessingStatus("idle");
    }

    // Clear payroll data when scopeId changes
    if (field === "scopeId") {
      setPayrollData([]);
      setPayrollSummary({
        totalEmployees: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        totalTaxableIncome: 0,
        totalPAYE: 0,
      });
      setProcessingStatus("idle");
    }
  };

  const checkForExistingPreview = async (
    month,
    year,
    frequency,
    scope,
    scopeId
  ) => {
    try {
      console.log(
        "🔍 [PayrollProcessingForm] Checking for existing previews and payrolls..."
      );

      const currentEmployeeIds = await getEmployeeIdsForScope(scope, scopeId);
      console.log(
        "🔍 [PayrollProcessingForm] Current scope employee IDs:",
        currentEmployeeIds
      );

      const [pendingResponse, savedResponse] = await Promise.all([
        userModulesAPI.payroll.getPendingApprovals(),
        userModulesAPI.payroll.getSavedPayrolls({ month, year }),
      ]);

      const existingPreviews = pendingResponse.success
        ? pendingResponse.data || []
        : [];
      const existingPayrolls = savedResponse.success
        ? savedResponse.data?.payrolls || []
        : [];

      // Check for employee overlap in pending previews
      const duplicatePreview = existingPreviews.find((preview) => {
        const samePeriod =
          preview.period?.month === month && preview.period?.year === year;
        const sameFrequency = preview.metadata?.frequency === frequency;

        if (!samePeriod || !sameFrequency) return false;

        // Get employee IDs from the existing preview
        const existingEmployeeIds = getEmployeeIdsFromPreview(preview);
        console.log(
          "🔍 [PayrollProcessingForm] Existing preview employee IDs:",
          existingEmployeeIds
        );

        // Check if there's any overlap between current and existing employees
        const hasOverlap = currentEmployeeIds.some((id) =>
          existingEmployeeIds.includes(id)
        );

        if (hasOverlap) {
          console.log("🔍 [PayrollProcessingForm] Found employee overlap:", {
            current: currentEmployeeIds,
            existing: existingEmployeeIds,
            overlap: currentEmployeeIds.filter((id) =>
              existingEmployeeIds.includes(id)
            ),
          });
        }

        return hasOverlap;
      });

      // Check for employee overlap in saved payrolls
      const duplicatePayroll = existingPayrolls.find((payroll) => {
        const samePeriod =
          payroll.period?.month === month && payroll.period?.year === year;
        const sameFrequency = payroll.frequency === frequency;

        if (!samePeriod || !sameFrequency) return false;

        // Get employee IDs from the existing payroll
        const existingEmployeeIds = getEmployeeIdsFromPayroll(payroll);
        console.log(
          "🔍 [PayrollProcessingForm] Existing payroll employee IDs:",
          existingEmployeeIds
        );

        // Check if there's any overlap between current and existing employees
        const hasOverlap = currentEmployeeIds.some((id) =>
          existingEmployeeIds.includes(id)
        );

        if (hasOverlap) {
          console.log(
            "🔍 [PayrollProcessingForm] Found employee overlap in payroll:",
            {
              current: currentEmployeeIds,
              existing: existingEmployeeIds,
              overlap: currentEmployeeIds.filter((id) =>
                existingEmployeeIds.includes(id)
              ),
            }
          );
        }

        return hasOverlap;
      });

      if (duplicatePreview) {
        const periodName = months.find((m) => m.value === month)?.label;
        const statusText =
          duplicatePreview.approvalStatus === "pending_finance"
            ? "pending finance approval"
            : duplicatePreview.approvalStatus === "approved_finance"
            ? "approved by finance"
            : "in review";

        toast.error(
          `Cannot create payroll preview: Some employees in your selection have already been included in a payroll preview for ${periodName} ${year} (${frequency}). ` +
            `Status: ${statusText}. Approval ID: ${duplicatePreview.approvalId}. Please select different employees or create for a different period.`
        );
        return true; // Duplicate found
      }

      if (duplicatePayroll) {
        const periodName = months.find((m) => m.value === month)?.label;

        toast.error(
          `Cannot create payroll preview: Some employees in your selection have already been processed in a payroll for ${periodName} ${year} (${frequency}). ` +
            `Payroll ID: ${duplicatePayroll._id}. Please select different employees or create for a different period.`
        );
        return true; // Duplicate found
      }

      return false;
    } catch (error) {
      console.error(
        "❌ [PayrollProcessingForm] Error checking for existing previews:",
        error
      );
      return false;
    }
  };

  const getEmployeeIdsForScope = async (scope, scopeId) => {
    try {
      switch (scope) {
        case "company":
          const allEmployeesResponse = await userModulesAPI.users.getAllUsers();
          if (allEmployeesResponse.success) {
            return allEmployeesResponse.data
              .filter((emp) => emp.isActive && emp.status === "ACTIVE")
              .map((emp) => emp._id);
          }
          return [];

        case "department":
          // For department scope, get employees in that department
          const deptEmployeesResponse =
            await userModulesAPI.users.getUsersByDepartment(scopeId);
          if (deptEmployeesResponse.success) {
            return deptEmployeesResponse.data
              .filter((emp) => emp.isActive && emp.status === "ACTIVE")
              .map((emp) => emp._id);
          }
          return [];

        case "individual":
          // For individual scope, scopeId is already the employee IDs
          return Array.isArray(scopeId) ? scopeId : [scopeId];

        default:
          return [];
      }
    } catch (error) {
      console.error("Error getting employee IDs for scope:", error);
      return [];
    }
  };

  // Helper function to extract employee IDs from a preview
  const getEmployeeIdsFromPreview = (preview) => {
    if (!preview.payrollData?.payrolls) return [];
    return preview.payrollData.payrolls
      .map((payroll) => payroll.employee?.id)
      .filter(Boolean);
  };

  // Helper function to extract employee IDs from a payroll
  const getEmployeeIdsFromPayroll = (payroll) => {
    if (payroll.payrolls && Array.isArray(payroll.payrolls)) {
      return payroll.payrolls.map((p) => p.employee).filter(Boolean);
    }
    if (payroll.employee) {
      return [payroll.employee];
    }
    return [];
  };

  const handlePreviewPayroll = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    if (formData.scope === "individual") {
      setFormData((prev) => ({
        ...prev,
        scopeId: selectedEmployees,
      }));
    }

    const finalScopeId =
      formData.scope === "individual" ? selectedEmployees : formData.scopeId;

    // Set loading state immediately
    setLoading(true);
    setProcessingStatus("previewing");

    try {
      // Check for existing preview before proceeding
      const hasDuplicate = await checkForExistingPreview(
        formData.month,
        formData.year,
        formData.frequency,
        formData.scope,
        finalScopeId
      );

      if (hasDuplicate) {
        setLoading(false);
        setProcessingStatus("idle");
        return; // Stop the process if duplicate found
      }

      console.log(
        "🔍 [PayrollProcessingForm] Calling getPayrollPreview with:",
        {
          month: formData.month,
          year: formData.year,
          frequency: formData.frequency,
          scope: formData.scope,
          scopeId: finalScopeId,
        }
      );

      const result = await userModulesAPI.payroll.getPayrollPreview({
        month: formData.month,
        year: formData.year,
        frequency: formData.frequency,
        scope: formData.scope,
        scopeId: finalScopeId,
      });

      console.log("✅ [PayrollProcessingForm] Preview Result:", result);
      console.log("🔍 [PayrollProcessingForm] Result structure:", {
        success: result.success,
        message: result.message,
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
        hasPreview: !!(result.data && result.data.preview),
        previewKeys:
          result.data && result.data.preview
            ? Object.keys(result.data.preview)
            : [],
      });

      const payrollData = result.data;

      console.log("📊 [SUMMARY CARDS] Data:", {
        totalEmployees: payrollData.totalEmployees,
        totalGrossPay: payrollData.totalGrossPay,
        totalDeductions: payrollData.totalDeductions,
        totalNetPay: payrollData.totalNetPay,
        totalTaxableIncome: payrollData.totalTaxableIncome,
        totalPAYE: payrollData.totalPAYE,
      });

      console.log("📋 [TABLE DATA] Payrolls:", payrollData.payrolls);

      if (payrollData.payrolls && payrollData.payrolls.length > 0) {
        console.log("🔍 [DEBUG] First payroll:", {
          employee: payrollData.payrolls[0].employee,
          baseSalary: payrollData.payrolls[0].baseSalary,
          summary: payrollData.payrolls[0].summary,
          deductions: payrollData.payrolls[0].deductions,
        });
      }

      // 🔍 DEBUG LOGS FOR PREVIEW DATA
      console.log(
        "🔍 [PREVIEW DEBUG] =========================================="
      );
      console.log("🔍 [PREVIEW DEBUG] FULL PREVIEW DATA:", payrollData);
      if (payrollData.payrolls && payrollData.payrolls.length > 0) {
        const firstPayroll = payrollData.payrolls[0];
        console.log("🔍 [PREVIEW DEBUG] FIRST PAYROLL:", {
          employee: firstPayroll.employee?.name,
          baseSalary: firstPayroll.baseSalary?.effectiveBaseSalary,
          allowances: {
            total: firstPayroll.allowances?.total,
            taxable: firstPayroll.allowances?.taxable,
            nonTaxable: firstPayroll.allowances?.nonTaxable,
            items: firstPayroll.allowances?.items?.length,
          },
          bonuses: {
            total: firstPayroll.bonuses?.total,
            taxable: firstPayroll.bonuses?.taxable,
            nonTaxable: firstPayroll.bonuses?.nonTaxable,
            items: firstPayroll.bonuses?.items?.length,
          },
          deductions: {
            total: firstPayroll.deductions?.total,
            paye: firstPayroll.deductions?.paye,
            statutory: firstPayroll.deductions?.statutory,
            voluntary: firstPayroll.deductions?.voluntary,
            items: firstPayroll.deductions?.items?.length,
          },
          summary: {
            grossPay: firstPayroll.summary?.grossPay,
            taxableIncome: firstPayroll.summary?.taxableIncome,
            totalDeductions: firstPayroll.summary?.totalDeductions,
            netPay: firstPayroll.summary?.netPay,
          },
        });
      }
      console.log(
        "🔍 [PREVIEW DEBUG] =========================================="
      );

      // Ensure payroll data is valid before setting
      const validPayrolls = Array.isArray(payrollData.payrolls)
        ? payrollData.payrolls
        : [];
      setPayrollData(validPayrolls);

      const totalPAYE = calculateTotalPAYE(payrollData.payrolls);

      setPayrollSummary({
        totalEmployees: payrollData.totalEmployees || 0,
        totalGrossPay: payrollData.totalGrossPay || 0,
        totalDeductions: payrollData.totalDeductions || 0,
        totalNetPay: payrollData.totalNetPay || 0,
        totalTaxableIncome: payrollData.totalTaxableIncome || 0,
        totalPAYE: totalPAYE,
      });

      const previewDataForProcessing = {
        ...payrollData,
        scope: {
          type: formData.scope,
          details:
            formData.scope === "individual"
              ? selectedEmployees
              : formData.scope === "department"
              ? formData.scopeId
              : null,
        },
      };
      setPreviewData(previewDataForProcessing);

      // Extract errors from the result if any
      const errors = payrollData?.errors || [];
      setPreviewErrors(errors);

      setProcessingStatus("previewed");

      if (errors.length > 0) {
        toast.warning(
          `Payroll preview generated with ${errors.length} employee(s) having issues`
        );
      } else {
        toast.success("Payroll preview generated successfully!");
      }
    } catch (error) {
      setProcessingStatus("error");
      toast.error(error.message || "Error generating preview");
      console.error("Preview error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    if (!previewData) {
      toast.error("Please generate a preview first");
      return;
    }

    try {
      setLoading(true);
      setProcessingStatus("processing");

      // Submit for finance approval instead of direct processing
      // Prepare the payroll data for submission with proper structure
      const submissionData = {
        ...previewData,
        scope: {
          type: formData.scope,
          details:
            formData.scope === "department"
              ? { scopeId: formData.scopeId }
              : formData.scope === "individual"
              ? { scopeId: formData.scopeId }
              : null,
        },
      };

      const result = await userModulesAPI.payroll.submitForApproval(
        submissionData
      );

      console.log("✅ [PayrollProcessingForm] Submit Result:", {
        success: result.success,
        message: result.message,
        approvalId: result.data?.approval?.approvalId,
        status: result.data?.approval?.status,
        totalEmployees: result.data?.payroll?.totalEmployees,
        totalNetPay: result.data?.payroll?.totalNetPay,
      });

      setProcessingStatus("completed");

      setPayrollBatchResult(result.data);

      if (result.data?.processingSummary) {
        const summary = result.data.processingSummary;
        const scopeDescription = getScopeDescription(
          formData.scope,
          formData.scopeId
        );
        toast.success(
          `✅ Payroll submitted for finance approval! ${scopeDescription} Approval ID: ${result.data?.approval?.approvalId}`
        );
      } else if (result.data?.approval?.approvalId) {
        toast.success(
          `✅ Payroll submitted for finance approval! Approval ID: ${result.data.approval.approvalId}`
        );
      } else {
        toast.success(
          "✅ Payroll submitted for finance approval successfully!"
        );
      }

      setTimeout(() => {
        console.log("🎉 [SUCCESS] Setting showSuccessOverlay to true");
        setShowSuccessOverlay(true);
      }, 100);

      setTimeout(() => {
        console.log("🎉 [SUCCESS] Auto-hiding success overlay");
        setShowSuccessOverlay(false);
      }, 5000);

      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch (error) {
      setProcessingStatus("error");
      toast.error(error.message || "Error processing payroll");
      console.error("Payroll processing error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendToFinance = async () => {
    if (!previewData) {
      toast.error("No payroll data available to resend");
      return;
    }

    try {
      setLoading(true);

      // Prepare the payroll data for resubmission
      const submissionData = {
        ...previewData,
        scope: {
          type: formData.scope,
          details:
            formData.scope === "department"
              ? { scopeId: formData.scopeId }
              : formData.scope === "individual"
              ? { scopeId: formData.scopeId }
              : null,
        },
      };

      const result = await userModulesAPI.payroll.submitForApproval(
        submissionData
      );

      setPayrollBatchResult(result.data);

      toast.success(
        `✅ Payroll resent for finance approval! New Approval ID: ${result.data?.approval?.approvalId}`
      );
    } catch (error) {
      toast.error(error.message || "Error resending payroll");
      console.error("Payroll resend error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPayroll = () => {
    // Reset all form data and state
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      frequency: "monthly",
      scope: "company",
      scopeId: null,
    });
    setSelectedEmployees([]);
    setPreviewData(null);
    setPayrollData([]);
    setPayrollBatchResult(null);
    setProcessingStatus("idle");
    setPreviewErrors([]);
    setShowBatchModal(false);
    setShowDetailModal(false);
    setSelectedPayrollDetail(null);

    toast.info("Form reset. You can now create a new payroll.");
  };

  const getScopeLabel = () => {
    const scope = scopes.find((s) => s.value === formData.scope);
    return scope ? scope.label : "";
  };

  const getScopeValue = () => {
    if (formData.scope === "department") {
      const dept = departments.find((d) => d._id === formData.scopeId);
      return dept ? dept.name : "";
    } else if (formData.scope === "individual") {
      const employeeIds = formData.scopeId || selectedEmployees;

      if (Array.isArray(employeeIds)) {
        if (employeeIds.length === 0) {
          return "No employees selected";
        } else if (employeeIds.length === 1) {
          const emp = employees.find((e) => e._id === employeeIds[0]);
          return emp
            ? `${emp.firstName} ${emp.lastName} (${emp.employeeId})`
            : "Selected employee";
        } else {
          return `${employeeIds.length} employees selected`;
        }
      } else {
        // Handle single employee ID
        const emp = employees.find((e) => e._id === employeeIds);
        return emp
          ? `${emp.firstName} ${emp.lastName} (${emp.employeeId})`
          : "";
      }
    }
    return "All Employees";
  };

  const getScopeDescription = () => {
    switch (formData.scope) {
      case "company":
        return "Process payroll for all active employees in the company";
      case "department":
        const dept = departments.find((d) => d._id === formData.scopeId);
        return dept
          ? `Process payroll for all employees in ${dept.name} department`
          : "Select a department to process payroll for its employees";
      case "individual":
        const employeeIds = formData.scopeId || selectedEmployees;

        if (Array.isArray(employeeIds)) {
          if (employeeIds.length === 0) {
            return "Select employees to process their individual payroll";
          } else if (employeeIds.length === 1) {
            const emp = employees.find((e) => e._id === employeeIds[0]);
            return emp
              ? `Process payroll for ${emp.firstName} ${emp.lastName} (${emp.employeeId})`
              : "Process payroll for selected employee";
          } else {
            return `Process payroll for ${employeeIds.length} selected employees`;
          }
        } else if (typeof employeeIds === "object" && employeeIds !== null) {
          console.error("🔍 [ERROR] employeeIds is an object:", employeeIds);
          return "Select employees to process their individual payroll";
        } else {
          const emp = employees.find((e) => e._id === employeeIds);
          return emp
            ? `Process payroll for ${emp.firstName} ${emp.lastName} (${emp.employeeId})`
            : "Select an employee to process their individual payroll";
        }
      default:
        return "Select payroll scope to continue";
    }
  };

  const getScopeIcon = () => {
    const scope = scopes.find((s) => s.value === formData.scope);
    return scope ? scope.icon : HiOfficeBuilding;
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

  // Pagination functions
  const getFilteredEmployees = () => {
    let filteredEmployees = employees;
    if (selectedDepartments.length > 0) {
      filteredEmployees = employees.filter((emp) =>
        selectedDepartments.includes(emp.department?._id || emp.department)
      );
    }
    return filteredEmployees;
  };

  const getPaginatedEmployees = () => {
    const filtered = getFilteredEmployees();
    const startIndex = (currentPage - 1) * employeesPerPage;
    const endIndex = startIndex + employeesPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(
    getFilteredEmployees().length / employeesPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const safeRender = (value) => {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Helper function to calculate total PAYE from payrolls
  const calculateTotalPAYE = (payrolls) => {
    if (!payrolls || payrolls.length === 0) return 0;
    return payrolls.reduce((sum, payroll) => {
      return sum + (payroll.deductions?.paye || 0);
    }, 0);
  };

  const tableColumns = [
    {
      header: "Employee",
      accessor: "employee",
      renderer: (row) => {
        const employee = row.employee;
        if (!employee) return <span className="text-gray-500">Unknown</span>;
        return (
          <div>
            <div className="font-medium text-gray-900">
              {employee.name || "Unknown"}
            </div>
            <div className="text-sm text-gray-500">
              {employee.employeeId || "No ID"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Department",
      accessor: "employee.department",
      renderer: (row) => {
        const department = row.employee?.department;
        if (!department)
          return <span className="text-gray-500">No Department</span>;
        return department;
      },
    },
    {
      header: "Base Salary",
      accessor: "baseSalary.effectiveBaseSalary",
      renderer: (row) => {
        const amount = row.baseSalary?.effectiveBaseSalary;
        if (!amount || isNaN(amount))
          return <span className="text-gray-500">₦0</span>;
        return (
          <span className="font-medium text-gray-900">
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      header: "Gross Pay",
      accessor: "summary.grossPay",
      renderer: (row) => {
        const amount = row.summary?.grossPay;
        if (!amount || isNaN(amount))
          return <span className="text-gray-500">₦0</span>;
        return (
          <span className="font-bold text-blue-600">
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      header: "Deductions",
      accessor: "summary.totalDeductions",
      renderer: (row) => {
        const amount = row.summary?.totalDeductions;
        if (!amount || isNaN(amount))
          return <span className="text-gray-500">₦0</span>;
        return (
          <span className="font-medium text-red-600">
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      header: "Net Pay",
      accessor: "summary.netPay",
      renderer: (row) => {
        const amount = row.summary?.netPay;
        if (!amount || isNaN(amount))
          return <span className="text-gray-500">₦0</span>;
        return (
          <span className="font-bold text-purple-600">
            {formatCurrency(amount)}
          </span>
        );
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <ELRALogo variant="dark" size="sm" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Process Payroll
              </h2>
              <p className="text-gray-600 mt-1">{getScopeDescription()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Form */}
          <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Payroll Period */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payroll Period
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <select
                      value={formData.month}
                      onChange={(e) =>
                        handleInputChange("month", parseInt(e.target.value))
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                        validationErrors.month
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    {validationErrors.month && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.month}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) =>
                        handleInputChange("year", parseInt(e.target.value))
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                        validationErrors.year
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {validationErrors.year && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.year}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payroll Frequency */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payroll Frequency
                </h3>
                <div className="space-y-3">
                  {frequencies.map((freq) => (
                    <label
                      key={freq.value}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="frequency"
                        value={freq.value}
                        checked={formData.frequency === freq.value}
                        onChange={(e) =>
                          handleInputChange("frequency", e.target.value)
                        }
                        className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {freq.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payroll Scope */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payroll Scope
                </h3>
                <div className="space-y-3">
                  {scopes.map((scope) => {
                    const Icon = scope.icon;
                    const isSelected = formData.scope === scope.value;
                    return (
                      <label
                        key={scope.value}
                        title={scope.tooltip}
                        className={`group flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-[var(--elra-primary)] bg-[var(--elra-primary)] text-white"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="scope"
                          value={scope.value}
                          checked={isSelected}
                          onChange={(e) =>
                            handleInputChange("scope", e.target.value)
                          }
                          className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300"
                        />
                        <Icon
                          className={`ml-3 h-5 w-5 ${
                            isSelected ? "text-white" : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`ml-3 text-sm font-medium ${
                            isSelected ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {scope.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handlePreviewPayroll}
                  disabled={
                    loading ||
                    processingStatus === "previewing" ||
                    processingStatus === "previewed" ||
                    processingStatus === "processing" ||
                    processingStatus === "completed" ||
                    loadingData ||
                    (formData.scope === "department" && !formData.scopeId) ||
                    (formData.scope === "individual" &&
                      selectedEmployees.length === 0)
                  }
                  className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer ${
                    processingStatus === "previewed" ||
                    processingStatus === "completed"
                      ? "text-gray-500 bg-gray-100 cursor-not-allowed"
                      : "text-white bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)]"
                  }`}
                >
                  {processingStatus === "previewing" ? (
                    <>
                      <HiRefresh className="w-4 h-4 mr-2 animate-spin" />
                      Generating Preview...
                    </>
                  ) : processingStatus === "processing" ? (
                    <>
                      <HiRefresh className="w-4 h-4 mr-2 animate-spin" />
                      Sending to Finance...
                    </>
                  ) : processingStatus === "completed" ? (
                    <>
                      <HiCheckCircle className="w-4 h-4 mr-2" />
                      Sent to Finance
                    </>
                  ) : loadingData ? (
                    <>
                      <HiRefresh className="w-4 h-4 mr-2 animate-spin" />
                      Loading Data...
                    </>
                  ) : (
                    <>
                      <HiDocumentText className="w-4 h-4 mr-2" />
                      Preview Payroll
                    </>
                  )}
                </button>
                <button
                  onClick={handleProcessPayroll}
                  disabled={
                    loading ||
                    processingStatus === "processing" ||
                    processingStatus === "completed" ||
                    !previewData ||
                    processingStatus !== "previewed"
                  }
                  className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer ${
                    processingStatus === "completed"
                      ? "text-gray-500 bg-gray-100 cursor-not-allowed"
                      : processingStatus === "previewed" && previewData
                      ? "text-white bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)]"
                      : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {processingStatus === "processing" ? (
                    <>
                      <HiRefresh className="w-4 h-4 mr-2 animate-spin" />
                      Sending to Finance...
                    </>
                  ) : processingStatus === "completed" ? (
                    <>
                      <HiCheckCircle className="w-4 h-4 mr-2" />
                      Sent to Finance
                    </>
                  ) : (
                    <>
                      <HiCalculator className="w-4 h-4 mr-2" />
                      {processingStatus === "previewed" && previewData
                        ? "Submit for Finance Approval"
                        : "Generate Preview First"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="w-2/3 p-6 overflow-y-auto">
            {/* Current Selection Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                {(() => {
                  const Icon = getScopeIcon();
                  return (
                    <Icon className="w-6 h-6 text-[var(--elra-primary)]" />
                  );
                })()}
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Current Selection
                  </h3>
                  {loadingData ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 border-2 border-[var(--elra-primary)] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-500">
                        Loading data...
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">
                        {getScopeDescription()}
                      </p>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          Period:{" "}
                          {
                            months.find((m) => m.value === formData.month)
                              ?.label
                          }{" "}
                          {formData.year}
                        </span>
                        <span>
                          Frequency:{" "}
                          {
                            frequencies.find(
                              (f) => f.value === formData.frequency
                            )?.label
                          }
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Company-wide Employee Display */}
            {formData.scope === "company" && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  All Employees {loadingData ? "" : `(${employees.length})`}
                </h3>
                <div className="space-y-4">
                  {loadingData ? (
                    <GreenSpinner text="Loading all employees" />
                  ) : (
                    <>
                      {/* Employee Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                        {getPaginatedEmployees().map((emp) => (
                          <div
                            key={emp._id}
                            className="p-3 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={getEmployeeAvatar(emp)}
                                alt={`${emp.firstName} ${emp.lastName}`}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.src = getDefaultAvatar(emp);
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {emp.firstName} {emp.lastName}
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                  {emp.employeeId}
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                  {emp.role?.name || "No Role"} •{" "}
                                  {emp.department?.name || "No Department"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      {Math.ceil(employees.length / employeesPerPage) > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          {/* Previous Button */}
                          <button
                            onClick={() =>
                              setCurrentPage(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-[var(--elra-primary)] bg-white border border-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center"
                          >
                            <HiChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                          </button>

                          {/* Page Info */}
                          <div className="text-sm text-gray-500">
                            Page {currentPage} of{" "}
                            {Math.ceil(employees.length / employeesPerPage)} •{" "}
                            {employees.length} total employees
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={() =>
                              setCurrentPage(
                                Math.min(
                                  Math.ceil(
                                    employees.length / employeesPerPage
                                  ),
                                  currentPage + 1
                                )
                              )
                            }
                            disabled={
                              currentPage >=
                              Math.ceil(employees.length / employeesPerPage)
                            }
                            className="px-4 py-2 text-sm font-medium text-[var(--elra-primary)] bg-white border border-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                          >
                            Next
                            <HiChevronRight className="w-4 h-4 ml-1" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Scope-Specific Selection */}
            {formData.scope === "department" && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Department
                </h3>
                {loadingData ? (
                  <GreenSpinner text="Loading departments" />
                ) : (
                  <select
                    value={formData.scopeId || ""}
                    onChange={(e) =>
                      handleInputChange("scopeId", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                      validationErrors.scopeId
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Choose a department</option>
                    {departments.map((dept) => {
                      const employeeCount = employees.filter(
                        (emp) =>
                          emp.department?._id === dept._id ||
                          emp.department === dept._id
                      ).length;
                      return (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({employeeCount}{" "}
                          {employeeCount === 1 ? "employee" : "employees"})
                        </option>
                      );
                    })}
                  </select>
                )}
                {validationErrors.scopeId && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.scopeId}
                  </p>
                )}
                {formData.scopeId && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    {(() => {
                      const selectedDept = departments.find(
                        (d) => d._id === formData.scopeId
                      );
                      const employeeCount = employees.filter(
                        (emp) =>
                          emp.department?._id === formData.scopeId ||
                          emp.department === formData.scopeId
                      ).length;
                      return `💡 Will process payroll for ${employeeCount} ${
                        employeeCount === 1 ? "employee" : "employees"
                      } in ${selectedDept?.name || "this department"}`;
                    })()}
                  </div>
                )}

                {/* Department Employees List */}
                {formData.scopeId && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Employees in Department
                    </h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                      {(() => {
                        const departmentEmployees = employees.filter(
                          (emp) =>
                            emp.department?._id === formData.scopeId ||
                            emp.department === formData.scopeId
                        );

                        if (departmentEmployees.length === 0) {
                          return (
                            <div className="text-center py-4 text-gray-500">
                              <p className="text-sm">
                                No employees found in this department
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            {departmentEmployees.map((emp) => (
                              <div
                                key={emp._id}
                                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                              >
                                <img
                                  src={getEmployeeAvatar(emp)}
                                  alt={`${emp.firstName} ${emp.lastName}`}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    e.target.src = getDefaultAvatar(emp);
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {emp.firstName} {emp.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {emp.employeeId} •{" "}
                                    {emp.role?.name || "No Role"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {formData.scope === "individual" && (
              <div className="mb-6 space-y-6">
                {/* Department Filter */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Filter by Department
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select departments to filter employees, or choose employees
                    from any department
                  </p>
                  {loadingData ? (
                    <GreenSpinner text="Loading departments" />
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {departments.map((dept) => {
                        const employeeCount = employees.filter(
                          (emp) =>
                            emp.department?._id === dept._id ||
                            emp.department === dept._id
                        ).length;
                        return (
                          <label
                            key={dept._id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedDepartments.includes(dept._id)}
                                onChange={(e) =>
                                  handleDepartmentChange(
                                    dept._id,
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded"
                              />
                              <span className="text-sm font-medium text-gray-900">
                                {dept.name}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {employeeCount}{" "}
                              {employeeCount === 1 ? "employee" : "employees"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Employee Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Select Employees
                  </h3>
                  {loadingData ? (
                    <GreenSpinner text="Loading employees" />
                  ) : (
                    <div className="space-y-4">
                      {/* Employee Count and Select All Button */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {(() => {
                            const visibleSelectedEmployees =
                              selectedEmployees.filter((id) =>
                                getFilteredEmployees().some(
                                  (emp) => emp._id === id
                                )
                              );
                            return visibleSelectedEmployees.length > 0 ? (
                              <>
                                {visibleSelectedEmployees.length} employee
                                {visibleSelectedEmployees.length !== 1
                                  ? "s"
                                  : ""}{" "}
                                selected • {getFilteredEmployees().length}{" "}
                                available
                              </>
                            ) : (
                              <>
                                {getFilteredEmployees().length} employee
                                {getFilteredEmployees().length !== 1
                                  ? "s"
                                  : ""}{" "}
                                available
                              </>
                            );
                          })()}
                        </div>
                        {getFilteredEmployees().length > 1 && (
                          <button
                            onClick={() => {
                              const allEmployeeIds = getFilteredEmployees().map(
                                (emp) => emp._id
                              );
                              const isAllSelected = allEmployeeIds.every((id) =>
                                selectedEmployees.includes(id)
                              );

                              if (isAllSelected) {
                                // Unselect all
                                setSelectedEmployees([]);
                                // Also unselect all departments that were auto-selected
                                setSelectedDepartments([]);
                              } else {
                                // Select all
                                setSelectedEmployees(allEmployeeIds);

                                // Auto-select all departments of the selected employees
                                const employeeDepartments =
                                  getFilteredEmployees()
                                    .map((emp) => emp.department?._id)
                                    .filter(
                                      (deptId) =>
                                        deptId &&
                                        !selectedDepartments.includes(deptId)
                                    );

                                if (employeeDepartments.length > 0) {
                                  setSelectedDepartments((prev) => [
                                    ...prev,
                                    ...employeeDepartments,
                                  ]);
                                }
                              }
                            }}
                            className="px-3 py-1 text-xs font-medium text-white bg-[var(--elra-primary)] rounded-lg cursor-pointer"
                          >
                            {(() => {
                              const allEmployeeIds = getFilteredEmployees().map(
                                (emp) => emp._id
                              );
                              const isAllSelected = allEmployeeIds.every((id) =>
                                selectedEmployees.includes(id)
                              );
                              return isAllSelected
                                ? `Unselect All (${
                                    getFilteredEmployees().length
                                  })`
                                : `Select All (${
                                    getFilteredEmployees().length
                                  })`;
                            })()}
                          </button>
                        )}
                      </div>

                      {/* Employee Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                        {getPaginatedEmployees().map((emp) => {
                          const isSelected = selectedEmployees.includes(
                            emp._id
                          );
                          return (
                            <div
                              key={emp._id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedEmployees((prev) =>
                                    prev.filter((id) => id !== emp._id)
                                  );

                                  const remainingEmployees =
                                    selectedEmployees.filter(
                                      (id) => id !== emp._id
                                    );
                                  const employeesInSameDept = employees.filter(
                                    (e) =>
                                      e.department?._id ===
                                        emp.department?._id &&
                                      remainingEmployees.includes(e._id)
                                  );

                                  // If no employees from this department are selected, deselect the department
                                  if (
                                    employeesInSameDept.length === 0 &&
                                    emp.department?._id
                                  ) {
                                    setSelectedDepartments((prev) =>
                                      prev.filter(
                                        (deptId) =>
                                          deptId !== emp.department._id
                                      )
                                    );
                                  }
                                } else {
                                  setSelectedEmployees((prev) => [
                                    ...prev,
                                    emp._id,
                                  ]);
                                  if (
                                    emp.department?._id &&
                                    !selectedDepartments.includes(
                                      emp.department._id
                                    )
                                  ) {
                                    setSelectedDepartments((prev) => [
                                      ...prev,
                                      emp.department._id,
                                    ]);
                                  }
                                }
                              }}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? "border-[var(--elra-primary)] bg-[var(--elra-primary)]"
                                  : "border-gray-200 hover:border-[var(--elra-primary)] hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <img
                                  src={getEmployeeAvatar(emp)}
                                  alt={`${emp.firstName} ${emp.lastName}`}
                                  className="w-10 h-10 rounded-full object-cover"
                                  onError={(e) => {
                                    e.target.src = getDefaultAvatar(emp);
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div
                                    className={`font-medium truncate ${
                                      isSelected
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {emp.firstName} {emp.lastName}
                                  </div>
                                  <div
                                    className={`text-sm truncate ${
                                      isSelected
                                        ? "text-white"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {emp.employeeId}
                                  </div>
                                  <div className="text-xs text-gray-400 truncate">
                                    {emp.role?.name || "No Role"} •{" "}
                                    {emp.department?.name || "No Department"}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                    <svg
                                      className="w-3 h-3 text-[var(--elra-primary)]"
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
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          {/* Previous Button */}
                          <button
                            onClick={() =>
                              setCurrentPage(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-[var(--elra-primary)] bg-white border border-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center"
                          >
                            <HiChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                          </button>

                          {/* Page Info */}
                          <div className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages} •{" "}
                            {getFilteredEmployees().length} total employees
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={() =>
                              setCurrentPage(
                                Math.min(totalPages, currentPage + 1)
                              )
                            }
                            disabled={currentPage >= totalPages}
                            className="px-4 py-2 text-sm font-medium text-[var(--elra-primary)] bg-white border border-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                          >
                            Next
                            <HiChevronRight className="w-4 h-4 ml-1" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {validationErrors.scopeId && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.scopeId}
                    </p>
                  )}
                  {formData.scopeId && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      💡 Will process individual payroll for this employee
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Processing Status */}
            {processingStatus !== "idle" && (
              <div className="mb-6">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  {processingStatus === "previewing" && (
                    <>
                      <HiRefresh className="w-6 h-6 animate-spin text-[var(--elra-primary)]" />
                      <span className="text-[var(--elra-primary)] font-medium">
                        Generating preview...
                      </span>
                    </>
                  )}
                  {processingStatus === "processing" && (
                    <>
                      <HiRefresh className="w-6 h-6 animate-spin text-[var(--elra-primary)]" />
                      <span className="text-[var(--elra-primary)] font-medium">
                        Sending to Finance...
                      </span>
                    </>
                  )}
                  {processingStatus === "previewed" && (
                    <>
                      <HiCheckCircle className="w-6 h-6 text-green-500" />
                      <span className="text-green-600 font-medium">
                        Preview generated successfully
                      </span>
                    </>
                  )}
                  {processingStatus === "completed" && (
                    <>
                      <HiCheckCircle className="w-6 h-6 text-green-500" />
                      <span className="text-green-600 font-medium">
                        Payroll sent to Finance for approval
                      </span>
                      {payrollBatchResult && (
                        <button
                          onClick={() => setShowBatchModal(true)}
                          className="ml-4 px-3 py-1 text-sm bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center gap-1"
                        >
                          <HiDocumentText className="w-4 h-4" />
                          View Details
                        </button>
                      )}
                    </>
                  )}
                  {processingStatus === "error" && (
                    <>
                      <HiExclamation className="w-6 h-6 text-red-500" />
                      <span className="text-red-600 font-medium">
                        Error processing payroll
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Submitted Payroll Information - Show after successful submission */}
            {processingStatus === "completed" && payrollBatchResult && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Submitted Payroll for Finance Approval
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <HiClock className="w-3 h-3 mr-1" />
                      Pending Finance Approval
                    </span>
                    <button
                      onClick={() => setShowBatchModal(true)}
                      className="px-3 py-1 text-sm bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center gap-1"
                    >
                      <HiDocumentText className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <HiInformationCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        Payroll Submitted Successfully
                      </p>
                      <p className="text-sm text-blue-700">
                        Your payroll has been submitted for finance approval.
                        Approval ID:{" "}
                        <span className="font-mono font-semibold">
                          {payrollBatchResult.approval?.approvalId}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <HiUserGroup className="w-8 h-8 text-blue-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-600">
                          Total Employees
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          {payrollBatchResult.payroll?.totalEmployees ||
                            payrollSummary.totalEmployees ||
                            0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <HiCurrencyDollar className="w-8 h-8 text-green-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600">
                          Total Gross Pay
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          {formatCurrency(
                            payrollBatchResult.payroll?.totalGrossPay ||
                              payrollSummary.totalGrossPay ||
                              0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <HiMinusCircle className="w-8 h-8 text-red-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-600">
                          Total Deductions
                        </p>
                        <p className="text-2xl font-bold text-red-900">
                          {formatCurrency(
                            payrollBatchResult.payroll?.totalDeductions ||
                              payrollSummary.totalDeductions ||
                              0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <HiCheckCircle className="w-8 h-8 text-purple-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-600">
                          Net Pay
                        </p>
                        <p className="text-2xl font-bold text-purple-900">
                          {formatCurrency(
                            payrollBatchResult.payroll?.totalNetPay ||
                              payrollSummary.totalNetPay ||
                              0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <HiCurrencyDollar className="w-8 h-8 text-orange-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-orange-600">
                          Taxable Income
                        </p>
                        <p className="text-2xl font-bold text-orange-900">
                          {formatCurrency(
                            payrollSummary.totalTaxableIncome || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <HiMinusCircle className="w-8 h-8 text-red-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-600">
                          PAYE Tax
                        </p>
                        <p className="text-2xl font-bold text-red-900">
                          {formatCurrency(payrollSummary.totalPAYE || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleResendToFinance}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-[var(--elra-primary)] bg-white border border-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary)] hover:text-white transition-colors flex items-center gap-2"
                  >
                    <HiRefresh className="w-4 h-4" />
                    Resend to Finance
                  </button>
                  <button
                    onClick={handleNewPayroll}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <HiPlus className="w-4 h-4" />
                    Create New Payroll
                  </button>
                </div>
              </div>
            )}

            {/* Payroll Summary - Only show after successful payroll */}
            {payrollData &&
              payrollData.length > 0 &&
              processingStatus !== "completed" && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Payroll Summary
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiUserGroup className="w-8 h-8 text-blue-500" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">
                            Total Employees
                          </p>
                          <p className="text-2xl font-bold text-blue-900">
                            {payrollSummary.totalEmployees || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiCurrencyDollar className="w-8 h-8 text-green-500" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">
                            Total Gross Pay
                          </p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatCurrency(payrollSummary.totalGrossPay || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiMinusCircle className="w-8 h-8 text-red-500" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-600">
                            Total Deductions
                          </p>
                          <p className="text-2xl font-bold text-red-900">
                            {formatCurrency(
                              payrollSummary.totalDeductions || 0
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiCheckCircle className="w-8 h-8 text-purple-500" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-600">
                            Net Pay
                          </p>
                          <p className="text-2xl font-bold text-purple-900">
                            {formatCurrency(payrollSummary.totalNetPay || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiCurrencyDollar className="w-8 h-8 text-orange-500" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-orange-600">
                            Taxable Income
                          </p>
                          <p className="text-2xl font-bold text-orange-900">
                            {formatCurrency(
                              payrollSummary.totalTaxableIncome || 0
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiMinusCircle className="w-8 h-8 text-red-500" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-600">
                            PAYE Tax
                          </p>
                          <p className="text-2xl font-bold text-red-900">
                            {formatCurrency(payrollSummary.totalPAYE || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Payroll Breakdown Table - Show preview or results */}
            {processingStatus === "processing" ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-[var(--elra-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sending to Finance...
                </h3>
                <p className="text-gray-600 text-center max-w-md">
                  Please wait while we submit the payroll for finance approval.
                  This may take a few moments.
                </p>
              </div>
            ) : (
              ((processingStatus === "previewed" && previewData?.payrolls) ||
                (payrollData && payrollData.length > 0)) && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {processingStatus === "previewed"
                        ? "Preview Breakdown"
                        : "Payroll Breakdown"}
                    </h3>
                    {previewErrors.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                        <HiExclamation className="w-4 h-4" />
                        <span>
                          {previewErrors.length} employee(s) with issues
                        </span>
                      </div>
                    )}
                  </div>
                  <DataTable
                    data={
                      processingStatus === "previewed"
                        ? previewData?.payrolls || []
                        : payrollData || []
                    }
                    columns={tableColumns}
                    loading={loading}
                    className="bg-white"
                    actions={{
                      showEdit: false,
                      showDelete: false,
                      showToggle: false,
                    }}
                    onRowClick={(rowData) => {
                      console.log(
                        "🔍 [FRONTEND DEBUG] =========================================="
                      );
                      console.log(
                        "🔍 [FRONTEND DEBUG] ROW DATA RECEIVED:",
                        rowData
                      );
                      console.log(
                        "🔍 [FRONTEND DEBUG] EMPLOYEE:",
                        rowData.employee?.name
                      );
                      console.log(
                        "🔍 [FRONTEND DEBUG] BASE SALARY:",
                        rowData.baseSalary?.effectiveBaseSalary
                      );
                      console.log("🔍 [FRONTEND DEBUG] ALLOWANCES:", {
                        total: rowData.allowances?.total,
                        taxable: rowData.allowances?.taxable,
                        nonTaxable: rowData.allowances?.nonTaxable,
                        items: rowData.allowances?.items?.length,
                      });
                      console.log("🔍 [FRONTEND DEBUG] BONUSES:", {
                        total: rowData.bonuses?.total,
                        taxable: rowData.bonuses?.taxable,
                        nonTaxable: rowData.bonuses?.nonTaxable,
                        items: rowData.bonuses?.items?.length,
                      });
                      console.log("🔍 [FRONTEND DEBUG] DEDUCTIONS:", {
                        total: rowData.deductions?.total,
                        paye: rowData.deductions?.paye,
                        statutory: rowData.deductions?.statutory,
                        voluntary: rowData.deductions?.voluntary,
                        items: rowData.deductions?.items?.length,
                      });
                      console.log("🔍 [FRONTEND DEBUG] SUMMARY:", {
                        grossPay: rowData.summary?.grossPay,
                        taxableIncome: rowData.summary?.taxableIncome,
                        totalDeductions: rowData.summary?.totalDeductions,
                        netPay: rowData.summary?.netPay,
                      });
                      console.log(
                        "🔍 [FRONTEND DEBUG] =========================================="
                      );
                      setSelectedPayrollDetail(rowData);
                      setShowDetailModal(true);
                    }}
                  />

                  {/* Error Details Section */}
                  {previewErrors.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <HiExclamation className="w-5 h-5 text-yellow-600" />
                        Employees with Issues
                      </h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="space-y-3">
                          {previewErrors.map((error, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-yellow-200"
                            >
                              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                {error.employee?.name?.charAt(0) || "?"}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900">
                                    {error.employee?.name || "Unknown Employee"}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    ({error.employee?.employeeId || "No ID"})
                                  </span>
                                </div>
                                <p className="text-sm text-red-600">
                                  {error.error || "Unknown error occurred"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> These employees will be
                            skipped during payroll processing. You can still
                            process payroll for the remaining employees.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Close Summary Button */}
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setPayrollData([]);
                        setPayrollSummary({
                          totalEmployees: 0,
                          totalGrossPay: 0,
                          totalDeductions: 0,
                          totalNetPay: 0,
                          totalTaxableIncome: 0,
                          totalPAYE: 0,
                        });
                        setProcessingStatus("idle");
                        setPreviewErrors([]);
                      }}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center mx-auto"
                    >
                      <HiX className="w-4 h-4 mr-2" />
                      Close Summary
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Modal */}
      {showDetailModal &&
        selectedPayrollDetail &&
        selectedPayrollDetail.employee && (
          <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl modal-shadow-enhanced w-full max-w-5xl max-h-[95vh] flex flex-col border border-gray-100">
              {/* ELRA Branded Header */}
              <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-8 rounded-t-2xl flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <ELRALogo variant="dark" size="md" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Employee Payroll Details
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                          {selectedPayrollDetail.employee?.name || "Unknown"} -{" "}
                          {selectedPayrollDetail.employee?.employeeId ||
                            "No ID"}
                        </p>
                        <p className="text-white/70 text-xs mt-1">
                          {selectedPayrollDetail.employee?.department ||
                            "No Department"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setSelectedPayrollDetail(null);
                        }}
                        className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-300 font-medium border border-white/30 backdrop-blur-sm"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setSelectedPayrollDetail(null);
                        }}
                        className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
                      >
                        <HiX className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Employee Info Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="relative">
                      <img
                        src={getEmployeeAvatar(selectedPayrollDetail.employee)}
                        alt={`${
                          selectedPayrollDetail.employee?.name || "Employee"
                        }`}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                        onError={(e) => {
                          e.target.src = getDefaultAvatar(
                            selectedPayrollDetail.employee
                          );
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <HiCheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedPayrollDetail.employee?.name || "Unknown"}
                      </h3>
                      <p className="text-lg text-gray-600 mb-1">
                        {selectedPayrollDetail.employee?.employeeId || "No ID"}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <HiUserGroup className="w-4 h-4" />
                          {selectedPayrollDetail.employee?.department ||
                            "No Department"}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiBriefcase className="w-4 h-4" />
                          {selectedPayrollDetail.employee?.role || "No Role"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Salary Components */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-lg mr-2">💰</span>
                    SALARY COMPONENTS
                  </h4>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">
                          Basic Salary:
                        </span>
                        <span className="font-bold text-blue-600 text-lg">
                          {formatCurrency(
                            selectedPayrollDetail.baseSalary
                              ?.actualBaseSalary || 0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">
                          Step Increment:
                        </span>
                        <span className="font-bold text-purple-600 text-lg">
                          {formatCurrency(
                            selectedPayrollDetail.baseSalary?.stepIncrement || 0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">
                          Grade Allowances:
                        </span>
                        <span className="font-bold text-green-600 text-lg">
                          {formatCurrency(
                            selectedPayrollDetail.baseSalary
                              ?.totalGradeAllowances || 0
                          )}
                        </span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-800 font-semibold">
                            Effective Base Salary:
                          </span>
                          <span className="font-bold text-indigo-700 text-xl">
                            {formatCurrency(
                              selectedPayrollDetail.baseSalary
                                ?.effectiveBaseSalary || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Grade Allowances Breakdown */}
                    {selectedPayrollDetail.baseSalary?.gradeAllowances && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <h5 className="text-xs font-medium text-blue-700 mb-2 uppercase tracking-wide">
                          Grade Allowances Breakdown:
                        </h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Housing:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                selectedPayrollDetail.baseSalary
                                  ?.gradeAllowances?.housing || 0
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transport:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                selectedPayrollDetail.baseSalary
                                  ?.gradeAllowances?.transport || 0
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Meal:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                selectedPayrollDetail.baseSalary
                                  ?.gradeAllowances?.meal || 0
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Other:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                selectedPayrollDetail.baseSalary
                                  ?.gradeAllowances?.other || 0
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-600">
                      Base Salary
                    </div>
                    <div className="text-xl font-bold text-blue-900">
                      {formatCurrency(
                        selectedPayrollDetail.baseSalary?.effectiveBaseSalary ||
                          0
                      )}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-600">
                      Gross Pay
                    </div>
                    <div className="text-xl font-bold text-green-900">
                      {formatCurrency(
                        selectedPayrollDetail.summary?.grossPay || 0
                      )}
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-red-600">
                      Total Deductions
                    </div>
                    <div className="text-xl font-bold text-red-900">
                      {formatCurrency(
                        selectedPayrollDetail.summary?.totalDeductions || 0
                      )}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-purple-600">
                      Net Pay
                    </div>
                    <div className="text-xl font-bold text-purple-900">
                      {formatCurrency(
                        selectedPayrollDetail.summary?.netPay || 0
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="space-y-6">
                  {/* Allowances */}
                  {selectedPayrollDetail.allowances?.items &&
                    selectedPayrollDetail.allowances.items.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="text-lg mr-2">🎁</span>
                          PERSONAL ALLOWANCES
                        </h4>

                        {/* Summary Box */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-xs text-gray-600 mb-1">
                                Total Allowances
                              </div>
                              <div className="font-bold text-green-700 text-lg">
                                {formatCurrency(
                                  selectedPayrollDetail.allowances?.total || 0
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-600 mb-1">
                                Taxable
                              </div>
                              <div className="font-bold text-orange-600 text-lg">
                                {formatCurrency(
                                  selectedPayrollDetail.allowances?.taxable || 0
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-600 mb-1">
                                Non-taxable
                              </div>
                              <div className="font-bold text-green-600 text-lg">
                                {formatCurrency(
                                  selectedPayrollDetail.allowances
                                    ?.nonTaxable || 0
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Items List */}
                        <div className="space-y-2">
                          {selectedPayrollDetail.allowances.items.map(
                            (allowance, index) => (
                              <div
                                key={index}
                                className="bg-white border border-gray-200 rounded-lg p-3"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900">
                                        {allowance.name || "Unknown Allowance"}
                                      </span>
                                      <span
                                        className={`px-2 py-1 text-xs rounded-full ${
                                          allowance.taxable
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-green-100 text-green-700"
                                        }`}
                                      >
                                        {allowance.taxable
                                          ? "Taxable"
                                          : "Non-taxable"}
                                      </span>
                                      {allowance.scope && (
                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                          {allowance.scope}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {allowance.calculationType === "fixed"
                                        ? "Fixed Amount"
                                        : `${
                                            allowance.percentage || 0
                                          }% of Base`}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-green-600">
                                      {formatCurrency(allowance.amount || 0)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Bonuses */}
                  {selectedPayrollDetail.bonuses?.items &&
                    selectedPayrollDetail.bonuses.items.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="text-lg mr-2">🏆</span>
                          PERSONAL BONUSES
                        </h4>

                        {/* Summary Box */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-xs text-gray-600 mb-1">
                                Total Bonuses
                              </div>
                              <div className="font-bold text-blue-700 text-lg">
                                {formatCurrency(
                                  selectedPayrollDetail.bonuses?.total || 0
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-600 mb-1">
                                Taxable
                              </div>
                              <div className="font-bold text-orange-600 text-lg">
                                {formatCurrency(
                                  selectedPayrollDetail.bonuses?.taxable || 0
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-600 mb-1">
                                Non-taxable
                              </div>
                              <div className="font-bold text-blue-600 text-lg">
                                {formatCurrency(
                                  selectedPayrollDetail.bonuses?.nonTaxable || 0
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Items List */}
                        <div className="space-y-2">
                          {selectedPayrollDetail.bonuses.items.map(
                            (bonus, index) => (
                              <div
                                key={index}
                                className="bg-white border border-gray-200 rounded-lg p-3"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900">
                                        {bonus.name || "Unknown Bonus"}
                                      </span>
                                      <span
                                        className={`px-2 py-1 text-xs rounded-full ${
                                          bonus.taxable
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-blue-100 text-blue-700"
                                        }`}
                                      >
                                        {bonus.taxable
                                          ? "Taxable"
                                          : "Non-taxable"}
                                      </span>
                                      {bonus.scope && (
                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                          {bonus.scope}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {bonus.calculationType === "fixed"
                                        ? "Fixed Amount"
                                        : `${bonus.percentage || 0}% of Base`}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-blue-600">
                                      {formatCurrency(bonus.amount || 0)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Deductions */}
                  {selectedPayrollDetail.deductions?.items &&
                    selectedPayrollDetail.deductions.items.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Deductions Applied
                        </h4>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <table className="min-w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Deduction
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Amount
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Calculation
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {selectedPayrollDetail.deductions.items.map(
                                (deduction, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                      {deduction.name || "Unknown Deduction"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {deduction.type || "Standard"}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-red-600">
                                      {formatCurrency(deduction.amount || 0)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {deduction.name === "PAYE Tax Deduction"
                                        ? "Tax Brackets"
                                        : deduction.calculationType === "fixed"
                                        ? "Fixed Amount"
                                        : `${
                                            deduction.percentage || 0
                                          }% of Base`}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  {/* Tax Information */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                      Tax Information
                    </h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">Taxable Income:</span>
                          <span className="ml-2 font-medium text-orange-600">
                            {formatCurrency(
                              selectedPayrollDetail.summary?.taxableIncome || 0
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">PAYE Tax:</span>
                          <span className="ml-2 font-medium text-red-600">
                            {formatCurrency(
                              selectedPayrollDetail.deductions?.paye || 0
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Tax Bracket Breakdown */}
                      {selectedPayrollDetail.taxBreakdown &&
                        selectedPayrollDetail.taxBreakdown.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">
                              Tax Bracket Breakdown:
                            </h5>
                            <div className="space-y-2">
                              {selectedPayrollDetail.taxBreakdown.map(
                                (bracket, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                                  >
                                    <span className="text-gray-700">
                                      {bracket.bracket} ({bracket.rate})
                                    </span>
                                    <span className="font-medium text-red-600">
                                      {formatCurrency(bracket.taxAmount / 12)}
                                    </span>
                                  </div>
                                )
                              )}

                              {/* Total calculation */}
                              <div className="border-t border-gray-200 pt-2 mt-2">
                                <div className="flex justify-between items-center text-sm font-medium">
                                  <span className="text-gray-700">
                                    Total PAYE Tax:
                                  </span>
                                  <span className="text-red-600">
                                    {formatCurrency(
                                      selectedPayrollDetail.taxBreakdown.reduce(
                                        (sum, bracket) =>
                                          sum + bracket.taxAmount,
                                        0
                                      ) / 12
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Success Overlay */}
      {console.log("🎉 [RENDER] showSuccessOverlay:", showSuccessOverlay)}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center">
              {/* Success Icon - Simplified */}
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Success Message */}
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                ✅ Payroll Submitted for Approval!
              </h3>
              <p className="text-gray-600 mb-6">
                Your payroll has been submitted for finance approval. You will
                be notified once it's approved and processed.
              </p>

              {/* Success Details */}
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600">
                    ✅ Completed
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Employees:</span>
                  <span className="font-semibold text-gray-800">
                    {payrollSummary.totalEmployees}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(payrollSummary.totalNetPay)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowSuccessOverlay(false);
                    setShowBatchModal(true);
                  }}
                  className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--elra-primary)]/90 transition-colors flex items-center gap-2"
                >
                  <HiDocumentText className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => setShowSuccessOverlay(false)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Batch Details Modal */}
      {showBatchModal && payrollBatchResult && (
        <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl modal-shadow-enhanced max-w-[95vw] w-full max-h-[95vh] flex flex-col border border-gray-100">
            {/* ELRA Branded Header */}
            <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-8 rounded-t-2xl flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <ELRALogo variant="dark" size="md" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Payroll Batch Details
                      </h2>
                      <p className="text-white/80 text-sm mt-1">
                        {payrollBatchResult.scope?.type === "company"
                          ? "Company-wide"
                          : payrollBatchResult.scope?.type === "department"
                          ? "Department"
                          : "Individual"}{" "}
                        Payroll -{" "}
                        {months.find((m) => m.value === formData.month)?.label}{" "}
                        {formData.year}
                      </p>
                      {payrollBatchResult.approval?.approvalId && (
                        <p className="text-white/70 text-xs mt-1 font-mono">
                          Approval ID: {payrollBatchResult.approval.approvalId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowBatchModal(false)}
                      className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-300 font-medium border border-white/30 backdrop-blur-sm"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setShowBatchModal(false)}
                      className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
                    >
                      <HiX className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Financial Summary Cards */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <HiCurrencyDollar className="w-6 h-6 text-[var(--elra-primary)]" />
                  Financial Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <HiUserGroup className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-blue-800">
                        Total Employees
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-blue-900">
                      {payrollBatchResult.payroll?.totalEmployees ||
                        payrollSummary.totalEmployees ||
                        0}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                        <HiCurrencyDollar className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-green-800">
                        Total Gross Pay
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-green-900">
                      {formatCurrency(
                        payrollBatchResult.payroll?.totalGrossPay ||
                          payrollSummary.totalGrossPay ||
                          0
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                        <HiMinusCircle className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-red-800">
                        Total Deductions
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-red-900">
                      {formatCurrency(
                        payrollBatchResult.payroll?.totalDeductions ||
                          payrollSummary.totalDeductions ||
                          0
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                        <HiCheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-purple-800">
                        Net Pay
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-purple-900">
                      {formatCurrency(
                        payrollBatchResult.payroll?.totalNetPay ||
                          payrollSummary.totalNetPay ||
                          0
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Processing Summary */}
              {payrollBatchResult.processingSummary && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <HiCheckCircle className="w-6 h-6 text-[var(--elra-primary)]" />
                    Processing Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <HiCheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Successful
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {payrollBatchResult.processingSummary.successful}
                      </div>
                    </div>

                    {payrollBatchResult.processingSummary.duplicates > 0 && (
                      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <HiExclamation className="w-5 h-5 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">
                            Duplicates
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {payrollBatchResult.processingSummary.duplicates}
                        </div>
                      </div>
                    )}

                    {payrollBatchResult.processingSummary.failed > 0 && (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <HiMinusCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-red-800">
                            Failed
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {payrollBatchResult.processingSummary.failed}
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <HiUserGroup className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Total
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {payrollBatchResult.processingSummary.totalEmployees}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Employee Details Section */}
              {previewData &&
                previewData.payrolls &&
                previewData.payrolls.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <HiUserGroup className="w-6 h-6 text-[var(--elra-primary)]" />
                      Employee Details ({previewData.payrolls.length} employees)
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Employee
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Department
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Gross Pay
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Deductions
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Net Pay
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {previewData.payrolls.map((payroll, index) => (
                              <tr
                                key={index}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                      {payroll.employee.name.charAt(0)}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {payroll.employee.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {payroll.employee.employeeId}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {payroll.employee.department?.name || "N/A"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-green-600">
                                    {formatCurrency(
                                      payroll.summary?.grossPay || 0
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-red-600">
                                    {formatCurrency(
                                      payroll.summary?.totalDeductions || 0
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-bold text-[var(--elra-primary)]">
                                    {formatCurrency(
                                      payroll.summary?.netPay || 0
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      setSelectedPayrollDetail(payroll);
                                      setShowDetailModal(true);
                                    }}
                                    className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium text-sm transition-colors px-3 py-1 rounded-lg hover:bg-[var(--elra-primary)]/10"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              {/* Fallback for payrollBatchResult.payrolls if previewData is not available */}
              {(!previewData || !previewData.payrolls) &&
                payrollBatchResult.payrolls && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <HiUserGroup className="w-6 h-6 text-[var(--elra-primary)]" />
                      Employee Details ({payrollBatchResult.payrolls.length}{" "}
                      employees)
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Employee
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Department
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Gross Pay
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Net Pay
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {payrollBatchResult.payrolls.map(
                              (payroll, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-10 h-10 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                        {payroll.employee.name.charAt(0)}
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                          {payroll.employee.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {payroll.employee.employeeId}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {payroll.employee.department || "N/A"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-green-600">
                                      {formatCurrency(
                                        payroll.summary?.grossPay || 0
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-[var(--elra-primary)]">
                                      {formatCurrency(
                                        payroll.summary?.netPay || 0
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                      onClick={() => {
                                        setSelectedPayrollDetail(payroll);
                                        setShowDetailModal(true);
                                      }}
                                      className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium text-sm transition-colors px-3 py-1 rounded-lg hover:bg-[var(--elra-primary)]/10"
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
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

export default PayrollProcessingForm;
