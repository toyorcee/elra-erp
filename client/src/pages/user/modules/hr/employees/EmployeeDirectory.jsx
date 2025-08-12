import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GradientSpinner } from "../../../../../components/common";
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

const EmployeeDirectory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const mockEmployees = [
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@company.com",
      position: "Software Engineer",
      department: "IT",
      status: "Active",
      hireDate: "2023-01-15",
      employeeId: "EMP001",
    },
    {
      id: 2,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@company.com",
      position: "HR Manager",
      department: "HR",
      status: "Active",
      hireDate: "2022-08-20",
      employeeId: "EMP002",
    },
    {
      id: 3,
      firstName: "Mike",
      lastName: "Johnson",
      email: "mike.johnson@company.com",
      position: "Accountant",
      department: "Finance",
      status: "Active",
      hireDate: "2023-03-10",
      employeeId: "EMP003",
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      setEmployees(mockEmployees);
      setLoading(false);
    }, 1000);
  }, []);

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
  const canViewEmployees = roleLevel >= 300;
  const canAddEmployees = roleLevel >= 600;
  const canEditEmployees = roleLevel >= 600;
  const canDeleteEmployees = roleLevel >= 700;

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "all" ||
      employee.department === selectedDepartment;
    const matchesStatus =
      selectedStatus === "all" || employee.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = ["all", "HR", "IT", "Finance", "Marketing", "Operations"];
  const statuses = ["all", "Active", "Inactive", "On Leave", "Terminated"];

  const handleAddEmployee = () => {
    navigate("/dashboard/modules/hr/employees/add");
  };

  const handleViewEmployee = (employeeId) => {
    navigate(`/dashboard/modules/hr/employees/profile/${employeeId}`);
  };

  const handleEditEmployee = (employeeId) => {
    navigate(`/dashboard/modules/hr/employees/edit/${employeeId}`);
  };

  const handleDeleteEmployee = (employeeId) => {
    // Implement delete functionality
    console.log("Delete employee:", employeeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GradientSpinner title="Loading Employees" />
      </div>
    );
  }

  if (!canViewEmployees) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to view employee directory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--elra-text-primary)] mb-2">
              Employee Directory
            </h1>
            <p className="text-[var(--elra-text-secondary)]">
              Manage and view all employees in the organization
            </p>
          </div>
          {canAddEmployees && (
            <button
              onClick={handleAddEmployee}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "all" ? "All Departments" : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All Status" : status}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-600">
              {filteredEmployees.length} employee
              {filteredEmployees.length !== 1 ? "s" : ""} found
            </span>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hire Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-[var(--elra-secondary-3)] flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-[var(--elra-primary)]" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {employee.employeeId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : employee.status === "Inactive"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(employee.hireDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewEmployee(employee.id)}
                        className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] transition-colors"
                        title="View Employee"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {canEditEmployees && (
                        <button
                          onClick={() => handleEditEmployee(employee.id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit Employee"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                      {canDeleteEmployees && (
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete Employee"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No employees found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ||
              selectedDepartment !== "all" ||
              selectedStatus !== "all"
                ? "Try adjusting your search or filters."
                : "Get started by adding your first employee."}
            </p>
            {canAddEmployees && (
              <div className="mt-6">
                <button
                  onClick={handleAddEmployee}
                  className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors duration-200"
                >
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Add Employee
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDirectory;
