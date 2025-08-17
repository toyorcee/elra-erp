import api from "./api";

// Get all deductions with filtering and pagination
export const fetchDeductions = async (params = {}) => {
  const response = await api.get("/deductions", { params });
  return response.data;
};

// Get deduction categories
export const fetchDeductionCategories = async () => {
  const response = await api.get("/deductions/categories");
  return response.data;
};

// Get deduction types
export const fetchDeductionTypes = async () => {
  const response = await api.get("/deductions/types");
  return response.data;
};

// Get employees by department IDs
export const fetchEmployeesByDepartments = async (departmentIds) => {
  const response = await api.get(`/deductions/employees-by-departments?departmentIds=${departmentIds.join(',')}`);
  return response.data;
};

// Get deductions for specific employee
export const fetchEmployeeDeductions = async (employeeId, params = {}) => {
  const response = await api.get(`/deductions/employee/${employeeId}`, {
    params,
  });
  return response.data;
};

// Get active deductions for payroll processing
export const fetchActiveDeductionsForPayroll = async (
  employeeId,
  payrollDate
) => {
  const response = await api.get("/deductions/payroll", {
    params: { employeeId, payrollDate },
  });
  return response.data;
};

// Create new deduction
export const createDeduction = async (deductionData) => {
  const response = await api.post("/deductions", deductionData);
  return response.data;
};

// Get deduction by ID
export const getDeductionById = async (id) => {
  const response = await api.get(`/deductions/${id}`);
  return response.data;
};

// Update deduction
export const updateDeduction = async (id, deductionData) => {
  const response = await api.put(`/deductions/${id}`, deductionData);
  return response.data;
};

// Delete deduction
export const deleteDeduction = async (id) => {
  const response = await api.delete(`/deductions/${id}`);
  return response.data;
};

// Toggle deduction active status
export const toggleDeductionStatus = async (id) => {
  const response = await api.put(`/deductions/${id}/toggle`);
  return response.data;
};

// Update deduction usage for payroll
export const updateDeductionUsage = async (
  deductionIds,
  payrollId,
  payrollDate
) => {
  const response = await api.put("/deductions/usage/update", {
    deductionIds,
    payrollId,
    payrollDate,
  });
  return response.data;
};
