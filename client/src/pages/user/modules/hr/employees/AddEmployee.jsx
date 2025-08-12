import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GradientSpinner } from "../../../../../components/common";
import {
  UserPlusIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const AddEmployee = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    departmentId: "",
    roleId: "",
    hireDate: "",
    employeeId: "",
    salaryGrade: "",
    salaryStep: "1",
    address: "",
    employeeType: "existing",
    startDate: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  });

  const [errors, setErrors] = useState({});

  // Mock data - replace with actual API calls
  const mockDepartments = [
    { id: 1, name: "HR", code: "HR" },
    { id: 2, name: "IT", code: "IT" },
    { id: 3, name: "Finance", code: "FIN" },
    { id: 4, name: "Marketing", code: "MKT" },
    { id: 5, name: "Operations", code: "OPS" },
  ];

  const mockRoles = [
    { id: 1, name: "Staff", level: 300 },
    { id: 2, name: "Manager", level: 600 },
    { id: 3, name: "HOD", level: 700 },
  ];

  // Salary Grade System - Standard Government/Corporate Structure
  const salaryGrades = [
    {
      grade: "1",
      name: "Grade 1",
      minSalary: 30000,
      maxSalary: 45000,
      description: "Entry Level",
    },
    {
      grade: "2",
      name: "Grade 2",
      minSalary: 45000,
      maxSalary: 60000,
      description: "Junior Staff",
    },
    {
      grade: "3",
      name: "Grade 3",
      minSalary: 60000,
      maxSalary: 80000,
      description: "Senior Staff",
    },
    {
      grade: "4",
      name: "Grade 4",
      minSalary: 80000,
      maxSalary: 100000,
      description: "Assistant Manager",
    },
    {
      grade: "5",
      name: "Grade 5",
      minSalary: 100000,
      maxSalary: 130000,
      description: "Manager",
    },
    {
      grade: "6",
      name: "Grade 6",
      minSalary: 130000,
      maxSalary: 160000,
      description: "Senior Manager",
    },
    {
      grade: "7",
      name: "Grade 7",
      minSalary: 160000,
      maxSalary: 200000,
      description: "Assistant Director",
    },
    {
      grade: "8",
      name: "Grade 8",
      minSalary: 200000,
      maxSalary: 250000,
      description: "Deputy Director",
    },
    {
      grade: "9",
      name: "Grade 9",
      minSalary: 250000,
      maxSalary: 300000,
      description: "Director",
    },
    {
      grade: "10",
      name: "Grade 10",
      minSalary: 300000,
      maxSalary: 400000,
      description: "Executive Director",
    },
  ];

  const salarySteps = [
    { step: "1", name: "Step 1", increment: 0 },
    { step: "2", name: "Step 2", increment: 5 }, // 5% increment
    { step: "3", name: "Step 3", increment: 10 },
    { step: "4", name: "Step 4", increment: 15 },
    { step: "5", name: "Step 5", increment: 20 },
  ];

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setDepartments(mockDepartments);
      setRoles(mockRoles);
      setLoading(false);
    }, 1000);
  }, []);

  // Get user role level for permissions
  const getUserRoleLevel = () => {
    if (!user) return 0;
    const roleValue = user.role?.name || user.role;

    switch (roleValue) {
      case "SUPER_ADMIN":
        return 1000;
      case "HOD":
        return 700;
      case "MANAGER":
        return 600;
      case "STAFF":
        return 300;
      default:
        return 100;
    }
  };

  const roleLevel = getUserRoleLevel();

  // Permission checks
  const canAddEmployees = roleLevel >= 600;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [name]: value,
      },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.position.trim()) {
      newErrors.position = "Position is required";
    }

    if (!formData.departmentId) {
      newErrors.departmentId = "Department is required";
    }

    if (!formData.roleId) {
      newErrors.roleId = "Role is required";
    }

    if (formData.employeeType === "existing") {
      if (!formData.startDate) {
        newErrors.startDate = "Start date in system is required";
      }
    } else {
      if (!formData.hireDate) {
        newErrors.hireDate = "Hire date is required";
      }
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required";
    }

    if (!formData.salaryGrade) {
      newErrors.salaryGrade = "Salary grade is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Success - navigate back to employee directory
      navigate("/dashboard/modules/hr/employees");
    } catch (error) {
      console.error("Error adding employee:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/modules/hr/employees");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GradientSpinner title="Loading Form" />
      </div>
    );
  }

  if (!canAddEmployees) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to add employees.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={handleCancel}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[var(--elra-text-primary)] mb-2">
              Add Employee to System
            </h1>
            <p className="text-[var(--elra-text-secondary)]">
              Add existing employee or create new hire profile
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <UserPlusIcon className="h-5 w-5 mr-2 text-[var(--elra-primary)]" />
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                  errors.firstName ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                  errors.lastName ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  {errors.lastName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                  errors.email ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position *
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                  errors.position ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter job position"
              />
              {errors.position && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  {errors.position}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID *
              </label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                  errors.employeeId ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter employee ID"
              />
              {errors.employeeId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  {errors.employeeId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Employee Type & Assignment */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Employee Type & Assignment
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Type *
              </label>
              <select
                name="employeeType"
                value={formData.employeeType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              >
                <option value="existing">
                  Existing Employee (Already Working)
                </option>
                <option value="new">New Hire (From Position Request)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {formData.employeeType === "existing"
                  ? "Employee already works here, adding to system"
                  : "New employee from approved position request"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.employeeType === "existing"
                  ? "Start Date in System"
                  : "Hire Date"}{" "}
                *
              </label>
              <input
                type="date"
                name={
                  formData.employeeType === "existing"
                    ? "startDate"
                    : "hireDate"
                }
                value={
                  formData.employeeType === "existing"
                    ? formData.startDate
                    : formData.hireDate
                }
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                  (
                    formData.employeeType === "existing"
                      ? errors.startDate
                      : errors.hireDate
                  )
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
              />
              {(formData.employeeType === "existing"
                ? errors.startDate
                : errors.hireDate) && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  {formData.employeeType === "existing"
                    ? errors.startDate
                    : errors.hireDate}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                  errors.departmentId ? "border-red-300" : "border-gray-300"
                }`}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  {errors.departmentId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                  errors.roleId ? "border-red-300" : "border-gray-300"
                }`}
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  {errors.roleId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hire Date *
              </label>
              <input
                type="date"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                  errors.hireDate ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.hireDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  {errors.hireDate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Additional Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Grade *
              </label>
              <select
                name="salaryGrade"
                value={formData.salaryGrade}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                  errors.salaryGrade ? "border-red-300" : "border-gray-300"
                }`}
              >
                <option value="">Select Salary Grade</option>
                {salaryGrades.map((grade) => (
                  <option key={grade.grade} value={grade.grade}>
                    {grade.name} - ₦{grade.minSalary.toLocaleString()} - ₦
                    {grade.maxSalary.toLocaleString()} ({grade.description})
                  </option>
                ))}
              </select>
              {errors.salaryGrade && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  {errors.salaryGrade}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Step
              </label>
              <select
                name="salaryStep"
                value={formData.salaryStep}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              >
                {salarySteps.map((step) => (
                  <option key={step.step} value={step.step}>
                    {step.name}{" "}
                    {step.increment > 0 ? `(+${step.increment}%)` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Step determines increment within the grade
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                placeholder="Enter address"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Emergency Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.emergencyContact.name}
                onChange={handleEmergencyContactChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                placeholder="Enter contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.emergencyContact.phone}
                onChange={handleEmergencyContactChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                placeholder="Enter contact phone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship
              </label>
              <input
                type="text"
                name="relationship"
                value={formData.emergencyContact.relationship}
                onChange={handleEmergencyContactChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                placeholder="e.g., Spouse, Parent"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 flex items-center"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Adding Employee...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Add Employee
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;
