import React, { useState, useRef } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  UserPlusIcon,
  DocumentArrowUpIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const BulkInvitationSystem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("manual");
  const [invitations, setInvitations] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [bulkSettings, setBulkSettings] = useState({
    department: "",
    role: "",
    defaultPermissions: [],
  });

  // Mock data for demonstration
  const departments = [
    "HR",
    "IT",
    "Finance",
    "Marketing",
    "Operations",
    "Legal",
  ];
  const roles = [
    { value: "HOD", label: "Head of Department", level: 600 },
    { value: "MANAGER", label: "Manager", level: 500 },
    { value: "STAFF", label: "Staff", level: 300 },
    { value: "VIEWER", label: "Viewer", level: 200 },
  ];

  const permissions = [
    { value: "canManageUsers", label: "Manage Users" },
    { value: "canViewReports", label: "View Reports" },
    { value: "canManagePayroll", label: "Manage Payroll" },
    { value: "canManageDocuments", label: "Manage Documents" },
  ];

  // Manual invitation form
  const [manualForm, setManualForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    department: "",
    role: "",
    jobTitle: "",
    salaryGrade: "",
    permissions: [],
  });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const newInvitation = {
      id: Date.now(),
      email: manualForm.email,
      firstName: manualForm.firstName,
      lastName: manualForm.lastName,
      department: manualForm.department,
      role: manualForm.role,
      jobTitle: manualForm.jobTitle,
      salaryGrade: manualForm.salaryGrade,
      permissions: manualForm.permissions,
      status: "pending",
      createdAt: new Date(),
    };

    setInvitations([...invitations, newInvitation]);
    setManualForm({
      email: "",
      firstName: "",
      lastName: "",
      department: "",
      role: "",
      jobTitle: "",
      salaryGrade: "",
      permissions: [],
    });
  };

  // CSV Processing
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map((h) => h.trim());

      const data = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",").map((v) => v.trim());
          const row = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          // Validate required fields
          if (
            !row.email ||
            !row.firstName ||
            !row.lastName ||
            !row.department ||
            !row.role
          ) {
            errors.push(`Row ${i + 1}: Missing required fields`);
          } else if (!isValidEmail(row.email)) {
            errors.push(`Row ${i + 1}: Invalid email format`);
          } else {
            data.push({
              id: Date.now() + i,
              email: row.email,
              firstName: row.firstName,
              lastName: row.lastName,
              department: row.department,
              role: row.role,
              jobTitle: row.jobTitle || "",
              salaryGrade: row.salaryGrade || "",
              permissions: row.permissions ? row.permissions.split(";") : [],
              status: "pending",
              createdAt: new Date(),
            });
          }
        }
      }

      setCsvData(data);
      setCsvErrors(errors);
    };
    reader.readAsText(file);
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const downloadCSVTemplate = () => {
    const template = `email,firstName,lastName,department,role,jobTitle,salaryGrade,permissions
john.doe@company.com,John,Doe,IT,STAFF,Software Developer,Grade 3,canViewReports;canManageDocuments
jane.smith@company.com,Jane,Smith,HR,HOD,HR Manager,Grade 5,canManageUsers;canViewReports
mike.johnson@company.com,Mike,Johnson,Finance,MANAGER,Finance Manager,Grade 4,canViewReports;canManagePayroll`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_invitation_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processBulkInvitations = async () => {
    setIsProcessing(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const allInvitations = [...invitations, ...csvData];
    setInvitations(allInvitations);
    setCsvData([]);
    setCsvErrors([]);
    setIsProcessing(false);
  };

  const sendInvitations = async () => {
    setIsProcessing(true);

    // Simulate sending invitations
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Update status to sent
    setInvitations(invitations.map((inv) => ({ ...inv, status: "sent" })));
    setIsProcessing(false);
  };

  const removeInvitation = (id) => {
    setInvitations(invitations.filter((inv) => inv.id !== id));
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--elra-text-primary)] mb-2">
          Bulk Employee Invitation System
        </h1>
        <p className="text-[var(--elra-text-secondary)]">
          Invite multiple employees to the system efficiently
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("manual")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "manual"
                  ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <UserPlusIcon className="h-5 w-5 inline mr-2" />
              Manual Invitation
            </button>
            <button
              onClick={() => setActiveTab("csv")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "csv"
                  ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <DocumentArrowUpIcon className="h-5 w-5 inline mr-2" />
              CSV Bulk Upload
            </button>
            <button
              onClick={() => setActiveTab("review")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "review"
                  ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <UsersIcon className="h-5 w-5 inline mr-2" />
              Review & Send ({invitations.length + csvData.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Manual Invitation Tab */}
      {activeTab === "manual" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Manual Employee Invitation
          </h2>

          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={manualForm.email}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  placeholder="employee@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={manualForm.firstName}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  placeholder="John"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={manualForm.lastName}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  placeholder="Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={manualForm.department}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, department: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={manualForm.role}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={manualForm.jobTitle}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, jobTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  placeholder="Software Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Grade
                </label>
                <select
                  value={manualForm.salaryGrade}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      salaryGrade: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                >
                  <option value="">Select Grade</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {permissions.map((permission) => (
                  <label key={permission.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={manualForm.permissions.includes(
                        permission.value
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setManualForm({
                            ...manualForm,
                            permissions: [
                              ...manualForm.permissions,
                              permission.value,
                            ],
                          });
                        } else {
                          setManualForm({
                            ...manualForm,
                            permissions: manualForm.permissions.filter(
                              (p) => p !== permission.value
                            ),
                          });
                        }
                      }}
                      className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {permission.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
              >
                Add to Invitation List
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CSV Upload Tab */}
      {activeTab === "csv" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            CSV Bulk Upload
          </h2>

          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                CSV Template
              </h3>
              <p className="text-blue-800 mb-4">
                Download the template below and fill in your employee data.
                Required fields: email, firstName, lastName, department, role.
              </p>
              <button
                onClick={downloadCSVTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download CSV Template
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            />
          </div>

          {csvErrors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-900 mb-2">
                CSV Errors
              </h3>
              <ul className="text-red-800 space-y-1">
                {csvErrors.map((error, index) => (
                  <li key={index} className="flex items-center">
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {csvData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                CSV Data Preview ({csvData.length} employees)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {csvData.slice(0, 5).map((row) => (
                      <tr key={row.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.firstName} {row.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.jobTitle}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.length > 5 && (
                <p className="text-sm text-gray-600 mt-2">
                  Showing first 5 rows. Total: {csvData.length} employees
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setCsvData([]);
                setCsvErrors([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={processBulkInvitations}
              disabled={csvData.length === 0 || isProcessing}
              className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Add to Invitation List"}
            </button>
          </div>
        </div>
      )}

      {/* Review & Send Tab */}
      {activeTab === "review" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Review & Send Invitations ({invitations.length} total)
          </h2>

          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No invitations ready
              </h3>
              <p className="text-gray-600">
                Add employees using the Manual or CSV tabs first.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invitations.map((invitation) => (
                      <tr key={invitation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {invitation.firstName} {invitation.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invitation.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invitation.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {invitation.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invitation.jobTitle || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              invitation.status === "sent"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {invitation.status === "sent" ? "Sent" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => removeInvitation(invitation.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {invitations.filter((inv) => inv.status === "pending").length}{" "}
                  pending invitations
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setInvitations([])}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={sendInvitations}
                    disabled={
                      invitations.filter((inv) => inv.status === "pending")
                        .length === 0 || isProcessing
                    }
                    className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50"
                  >
                    {isProcessing
                      ? "Sending Invitations..."
                      : "Send All Invitations"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkInvitationSystem;
