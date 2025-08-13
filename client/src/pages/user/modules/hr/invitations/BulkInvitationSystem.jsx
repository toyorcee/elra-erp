import React, { useState, useEffect } from "react";
import {
  EnvelopeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ArrowPathIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";
import { userModulesAPI } from "../../../../../services/userModules.js";
import { toast } from "react-toastify";

const BulkInvitationSystem = () => {
  const [formData, setFormData] = useState({
    emails: "",
    salaryGrade: "",
    departmentId: "",
    roleId: "",
    batchName: "",
    isBatch: false,
    invitationMethod: "simple",
    requiresApproval: false,
  });

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [salaryGrades, setSalaryGrades] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [result, setResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Recent invitations list (single and batch)
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationsError, setInvitationsError] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [invitationPagination, setInvitationPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [invitationFilter, setInvitationFilter] = useState("all");
  const [resendingId, setResendingId] = useState(null);

  const [showResendModal, setShowResendModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);

  const [csvFile, setCsvFile] = useState(null);
  const [csvEmails, setCsvEmails] = useState([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);

  // CSV Employee data states
  const [employeeCsvFile, setEmployeeCsvFile] = useState(null);
  const [employeeCsvData, setEmployeeCsvData] = useState(null);
  const [showEmployeeCsvPreview, setShowEmployeeCsvPreview] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [showSubmissionSummary, setShowSubmissionSummary] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchInvitations(1, 10);
  }, []);

  const loadData = async () => {
    setDataLoading(true);
    setError(null);
    try {
      const [gradesRes, departmentsRes, rolesRes] = await Promise.all([
        userModulesAPI.invitations.getSalaryGrades(),
        userModulesAPI.departments.getAllDepartments(),
        userModulesAPI.roles.getAllRoles(),
      ]);

      if (gradesRes.success) {
        setSalaryGrades(gradesRes.data.salaryGrades || []);
      }

      if (departmentsRes.success) {
        setDepartments(departmentsRes.data || []);
      }

      if (rolesRes.success) {
        setRoles(rolesRes.data || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setDataLoading(false);
    }
  };

  const fetchInvitations = async (page = 1, limit = 10) => {
    setInvitationsLoading(true);
    setInvitationsError(null);
    try {
      const response = await userModulesAPI.invitations.getAllInvitations({
        page,
        limit,
      });
      if (response.success) {
        setInvitations(response.data.invitations || []);
        setInvitationPagination(
          response.data.pagination || { page, limit, total: 0, pages: 1 }
        );
      } else {
        setInvitations([]);
        setInvitationPagination({ page, limit, total: 0, pages: 1 });
      }
    } catch (error) {
      console.error("Error loading invitations:", error);
      setInvitationsError(
        error.response?.data?.message || "Failed to load invitations"
      );
    } finally {
      setInvitationsLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      setResendingId(invitationId);
      await userModulesAPI.invitations.resendInvitation(invitationId);
      // Refresh list to reflect potential status changes
      await fetchInvitations(
        invitationPagination.page,
        invitationPagination.limit
      );
      setShowResendModal(false);
      setSelectedInvitation(null);

      // Show success toast
      toast.success(
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-6 w-6 text-green-500 animate-bounce" />
          </div>
          <div>
            <div className="font-medium">Invitation Resent Successfully!</div>
            <div className="text-sm text-gray-600">
              New invitation code has been sent
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error resending invitation:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to resend invitation";
      setInvitationsError(errorMessage);

      // Show error toast
      toast.error(
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <div className="font-medium">Resend Failed</div>
            <div className="text-sm text-gray-600">{errorMessage}</div>
          </div>
        </div>
      );
    } finally {
      setResendingId(null);
    }
  };

  const openResendModal = (invitation) => {
    setSelectedInvitation(invitation);
    setShowResendModal(true);
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split("\n").filter((line) => line.trim());
        const emails = [];

        lines.forEach((line) => {
          const email = line.trim().replace(/"/g, "").replace(/\s+/g, "");
          if (email && email.includes("@")) {
            emails.push(email.toLowerCase());
          }
        });

        setCsvEmails(emails);
        setFormData((prev) => ({ ...prev, emails: emails.join("\n") }));
        setShowCsvPreview(true);
      };
      reader.readAsText(file);
    } else {
      setError("Please select a valid CSV file");
    }
  };

  const clearCsvData = () => {
    setCsvFile(null);
    setCsvEmails([]);
    setShowCsvPreview(false);
    setFormData((prev) => ({ ...prev, emails: "" }));
  };

  // CSV Employee data functions
  const handleEmployeeCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      setEmployeeCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        // Send to server for parsing
        const formData = new FormData();
        formData.append("csvFile", file);

        // For now, just show the file was uploaded
        setEmployeeCsvData([
          {
            email: "sample@example.com",
            firstName: "Sample",
            lastName: "User",
          },
        ]);
        setShowEmployeeCsvPreview(true);
        setError(null);
      };
      reader.readAsText(file);
    } else {
      setError("Please select a valid CSV file");
    }
  };

  const clearEmployeeCsvData = () => {
    setEmployeeCsvFile(null);
    setEmployeeCsvData(null);
    setShowEmployeeCsvPreview(false);
  };

  const downloadCSVTemplate = () => {
    const template = [
      {
        email: "john.doe@company.com",
        firstName: "John",
        lastName: "Doe",
        department: "IT Department",
        role: "Software Developer",
        salaryGrade: "Grade 05",
        jobTitle: "Senior Software Developer",
        phone: "+1234567890",
        employeeId: "EMP001",
        position: "Developer",
      },
      {
        email: "jane.smith@company.com",
        firstName: "Jane",
        lastName: "Smith",
        department: "Human Resources",
        role: "HR Manager",
        salaryGrade: "Grade 08",
        jobTitle: "Human Resources Manager",
        phone: "+1234567891",
        employeeId: "EMP002",
        position: "Manager",
      },
    ];

    const csvContent = template
      .map((row) => Object.values(row).join(","))
      .join("\n");

    const headers =
      "email,firstName,lastName,department,role,salaryGrade,jobTitle,phone,employeeId,position\n";
    const fullContent = headers + csvContent;

    const blob = new Blob([fullContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_invitation_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateBatchNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `BATCH-${timestamp}-${random}`;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const response = await userModulesAPI.invitations.searchBatches(
        searchQuery
      );
      setSearchResults(response);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching batches:", error);
      setError(
        error.response?.data?.message ||
          "Error searching batches. Please try again."
      );
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Auto-generate batch name if isBatch is checked and batchName is empty
    if (name === "isBatch" && checked && !formData.batchName) {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        batchName: generateBatchNumber(),
      }));
    }
  };

  const validateEmails = (emails) => {
    const emailList = emails
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter((email) => email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = [];
    const invalidEmails = [];

    emailList.forEach((email) => {
      if (emailRegex.test(email)) {
        validEmails.push(email.toLowerCase());
      } else {
        invalidEmails.push(email);
      }
    });

    return { validEmails, invalidEmails };
  };

  const handlePreview = () => {
    const { validEmails, invalidEmails } = validateEmails(formData.emails);

    if (validEmails.length === 0) {
      setError("Please enter at least one valid email address");
      return;
    }

    if (invalidEmails.length > 0) {
      setError(`Invalid email addresses: ${invalidEmails.join(", ")}`);
      return;
    }

    if (!formData.salaryGrade || !formData.departmentId || !formData.roleId) {
      setError(
        "Please fill in all required fields (Salary Grade, Department, and Role)"
      );
      return;
    }

    setError(null);
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmissionProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setSubmissionProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const { validEmails } = validateEmails(formData.emails);

      const invitationData = {
        emails: validEmails,
        salaryGrade: formData.salaryGrade,
        departmentId: formData.departmentId,
        roleId: formData.roleId,
        batchName: formData.isBatch ? formData.batchName : undefined,
        isBatch: formData.isBatch,
      };

      const response = await userModulesAPI.invitations.createBulkInvitations(
        invitationData
      );

      setSubmissionProgress(100);
      setResult(response);
      setShowPreview(false);
      setShowSubmissionSummary(true);

      toast.success(
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-6 w-6 text-green-500 animate-bounce" />
          </div>
          <div>
            <div className="font-medium">Invitations Sent Successfully!</div>
            <div className="text-sm text-gray-600">
              {response.data?.statistics?.successfulInvitations || 0}{" "}
              invitations sent
            </div>
          </div>
        </div>
      );

      // Reset form after successful submission
      setFormData({
        emails: "",
        salaryGrade: "",
        departmentId: "",
        roleId: "",
        batchName: "",
        isBatch: false,
      });

      // Clear CSV data
      clearCsvData();
    } catch (error) {
      console.error("Error creating invitations:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Error creating invitations. Please try again.";
      setError(errorMessage);

      // Show error toast
      toast.error(
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <div className="font-medium text-white">Invitation Failed</div>
            <div className="text-sm text-red-100">{errorMessage}</div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          style: {
            background: "#EF4444",
            color: "white",
          },
        }
      );
    } finally {
      clearInterval(progressInterval);
      setSubmitting(false);
      setSubmissionProgress(0);
    }
  };

  const emailCount = formData.emails
    ? validateEmails(formData.emails).validEmails.length
    : 0;

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[var(--elra-bg-light)] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
          <p className="mt-4 text-[var(--elra-text-secondary)]">
            Loading invitation system...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--elra-bg-light)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
              <EnvelopeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--elra-text-primary)]">
                Bulk Invitation System
              </h1>
              <p className="text-[var(--elra-text-secondary)]">
                Send invitations to multiple users at once
              </p>
            </div>
          </div>
        </div>

        {/* Tips and Guidelines */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-3">
            <LightBulbIcon className="h-6 w-6 text-[var(--elra-primary)] mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-black mb-3">
                💡 Tips for Successful Bulk Invitations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-black">
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-[var(--elra-primary)] mr-2" />
                    Email Format
                  </h4>
                  <ul className="space-y-1">
                    <li>• One email per line or comma-separated</li>
                    <li>• Use valid email addresses only</li>
                    <li>• Maximum 100 emails per batch</li>
                    <li>• Example: john.doe@company.com</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-[var(--elra-primary)] mr-2" />
                    Batch Management
                  </h4>
                  <ul className="space-y-1">
                    <li>• Use descriptive batch names</li>
                    <li>• Sequential batch numbers are auto-generated</li>
                    <li>• Search batches by ID or name</li>
                    <li>• Track invitation status per batch</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <UserGroupIcon className="h-4 w-4 text-[var(--elra-primary)] mr-2" />
                    User Assignment
                  </h4>
                  <ul className="space-y-1">
                    <li>• Select appropriate salary grade</li>
                    <li>• Assign correct department</li>
                    <li>• Choose suitable role level</li>
                    <li>• Names auto-generated from email</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-[var(--elra-primary)] mr-2" />
                    Best Practices
                  </h4>
                  <ul className="space-y-1">
                    <li>• Preview before sending</li>
                    <li>• Check for existing users</li>
                    <li>• Monitor email delivery status</li>
                    <li>• Use meaningful batch names</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
              <MagnifyingGlassIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--elra-text-primary)]">
                Search Batches
              </h2>
              <p className="text-[var(--elra-text-secondary)]">
                Find and track existing invitation batches
              </p>
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by batch ID (e.g., BATCH001) or batch name..."
                className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-6 py-3 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {searching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Results */}
        {showSearchResults && searchResults && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--elra-text-primary)]">
                Search Results ({searchResults.data.batches.length} batches
                found)
              </h3>
              <button
                onClick={() => setShowSearchResults(false)}
                className="text-[var(--elra-text-secondary)] hover:text-[var(--elra-text-primary)]"
              >
                Close
              </button>
            </div>

            {searchResults.data.batches.length > 0 ? (
              <div className="space-y-4">
                {searchResults.data.batches.map((batch) => (
                  <div
                    key={batch._id}
                    className="border border-[var(--elra-border-primary)] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-[var(--elra-text-primary)]">
                          {batch.batchName || batch._id}
                        </h4>
                        <p className="text-sm text-[var(--elra-text-secondary)]">
                          Batch ID: {batch._id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[var(--elra-text-secondary)]">
                          {new Date(batch.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-[var(--elra-text-secondary)]">
                          {batch.totalInvitations} invitations
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-bold text-green-600">
                          {batch.activeInvitations}
                        </div>
                        <div className="text-green-600">Active</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-bold text-blue-600">
                          {batch.sentInvitations}
                        </div>
                        <div className="text-blue-600">Sent</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="font-bold text-purple-600">
                          {batch.usedInvitations}
                        </div>
                        <div className="text-purple-600">Used</div>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="font-bold text-yellow-600">
                          {batch.expiredInvitations}
                        </div>
                        <div className="text-yellow-600">Expired</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="font-bold text-red-600">
                          {batch.failedInvitations}
                        </div>
                        <div className="text-red-600">Failed</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold text-gray-600">
                          {batch.salaryGrade}
                        </div>
                        <div className="text-gray-600">Grade</div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-[var(--elra-text-secondary)]">
                      Department: {batch.department} | Role: {batch.role}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <InformationCircleIcon className="h-12 w-12 text-[var(--elra-text-secondary)] mx-auto mb-4" />
                <p className="text-[var(--elra-text-secondary)]">
                  No batches found matching your search.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recent Invitations */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
                <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[var(--elra-text-primary)]">
                Recent Invitations
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className={`px-3 py-1 rounded-md border text-sm ${
                  invitationFilter === "all"
                    ? "bg-[var(--elra-primary)] text-white"
                    : "border-[var(--elra-border-primary)] text-[var(--elra-text-primary)]"
                }`}
                onClick={() => setInvitationFilter("all")}
              >
                All
              </button>
              <button
                className={`px-3 py-1 rounded-md border text-sm ${
                  invitationFilter === "single"
                    ? "bg-[var(--elra-primary)] text-white"
                    : "border-[var(--elra-border-primary)] text-[var(--elra-text-primary)]"
                }`}
                onClick={() => setInvitationFilter("single")}
              >
                Single
              </button>
              <button
                className={`px-3 py-1 rounded-md border text-sm ${
                  invitationFilter === "batch"
                    ? "bg-[var(--elra-primary)] text-white"
                    : "border-[var(--elra-border-primary)] text-[var(--elra-text-primary)]"
                }`}
                onClick={() => setInvitationFilter("batch")}
              >
                Batch
              </button>
              <button
                className="ml-2 px-3 py-1 rounded-md border border-[var(--elra-border-primary)] text-[var(--elra-text-primary)]"
                onClick={() =>
                  fetchInvitations(
                    invitationPagination.page,
                    invitationPagination.limit
                  )
                }
              >
                Refresh
              </button>
            </div>
          </div>

          {invitationsError && (
            <div className="mb-4 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
              {invitationsError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm font-medium">
              <thead>
                <tr className="text-left text-[var(--elra-text-secondary)] border-b border-[var(--elra-border-primary)]">
                  <th className="py-3 pr-4 font-semibold">Email</th>
                  <th className="py-3 pr-4 font-semibold">Name</th>
                  <th className="py-3 pr-4 font-semibold">Department</th>
                  <th className="py-3 pr-4 font-semibold">Role</th>
                  <th className="py-3 pr-4 font-semibold">Type</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                  <th className="py-3 pr-4 font-semibold">Sent At</th>
                  <th className="py-3 pr-4 font-semibold">Batch ID</th>
                  <th className="py-3 pr-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitationsLoading ? (
                  <tr>
                    <td
                      className="py-8 text-center text-[var(--elra-text-secondary)]"
                      colSpan="9"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--elra-primary)]"></div>
                        <span>Loading invitations...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (invitations || [])
                    .filter((inv) => {
                      if (invitationFilter === "single") return !inv.batchId;
                      if (invitationFilter === "batch") return !!inv.batchId;
                      return true;
                    })
                    .map((inv) => (
                      <tr
                        key={inv._id}
                        className="border-b border-[var(--elra-border-primary)] hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 pr-4 text-[var(--elra-text-primary)] font-medium">
                          {inv.email}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {inv.firstName} {inv.lastName}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {inv.department?.name || inv.department || "-"}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {(inv.role?.name || inv.role || "-").replace(
                            /_/g,
                            " "
                          )}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {inv.batchId ? "Batch" : "Single"}
                        </td>
                        <td className="py-3 pr-4 font-medium">{inv.status}</td>
                        <td className="py-3 pr-4 font-medium">
                          {inv.emailSentAt
                            ? new Date(inv.emailSentAt).toLocaleString()
                            : "-"}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {inv.batchId || "-"}
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => openResendModal(inv)}
                            disabled={
                              resendingId === inv._id || inv.status !== "active"
                            }
                            className={`inline-flex items-center px-3 py-1 rounded-md border text-sm cursor-pointer font-medium ${
                              resendingId === inv._id ? "opacity-60" : ""
                            } border-[var(--elra-primary)] text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            {resendingId === inv._id
                              ? "Resending..."
                              : "Resend"}
                          </button>
                        </td>
                      </tr>
                    ))
                )}
                {!invitationsLoading &&
                  invitations &&
                  invitations.length === 0 && (
                    <tr>
                      <td className="py-12 text-center" colSpan="9">
                        <div className="empty-state">
                          <div className="empty-state-icon mb-4">
                            <InformationCircleIcon className="h-16 w-16 text-[var(--elra-text-secondary)] mx-auto" />
                          </div>
                          <p className="text-[var(--elra-text-secondary)] font-medium text-lg mb-2">
                            No invitations found
                          </p>
                          <p className="text-[var(--elra-text-muted)] text-sm">
                            Try adjusting your filters or create new invitations
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          {/* Simple pagination controls */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-[var(--elra-text-secondary)]">
              Page {invitationPagination.page} of {invitationPagination.pages}
            </span>
            <div className="space-x-2">
              <button
                className="px-3 py-1 rounded-md border border-[var(--elra-border-primary)] text-[var(--elra-text-primary)] disabled:opacity-50"
                onClick={() =>
                  invitationPagination.page > 1 &&
                  fetchInvitations(
                    invitationPagination.page - 1,
                    invitationPagination.limit
                  )
                }
                disabled={invitationPagination.page <= 1}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 rounded-md border border-[var(--elra-border-primary)] text-[var(--elra-text-primary)] disabled:opacity-50"
                onClick={() =>
                  invitationPagination.page < invitationPagination.pages &&
                  fetchInvitations(
                    invitationPagination.page + 1,
                    invitationPagination.limit
                  )
                }
                disabled={
                  invitationPagination.page >= invitationPagination.pages
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Invitation Method Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[var(--elra-border-primary)]">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
              <UserGroupIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--elra-text-primary)]">
                Choose Invitation Method
              </h2>
              <p className="text-[var(--elra-text-secondary)]">
                Select how you want to send invitations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Simple Email Method */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.invitationMethod === "simple"
                  ? "border-[var(--elra-primary)] bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() =>
                setFormData((prev) => ({ ...prev, invitationMethod: "simple" }))
              }
            >
              <div className="flex items-center space-x-3 mb-2">
                <EnvelopeIcon className="h-6 w-6 text-[var(--elra-primary)]" />
                <h3 className="font-semibold text-[var(--elra-text-primary)]">
                  Simple Email Invitations
                </h3>
              </div>
              <p className="text-sm text-[var(--elra-text-secondary)]">
                Quick invitations with just email addresses. Names
                auto-generated from email.
              </p>
              <div className="mt-2 text-xs text-[var(--elra-text-muted)]">
                • One salary grade for all • Same department/role • Instant
                codes
              </div>
            </div>

            {/* CSV Employee Onboarding */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.invitationMethod === "csv"
                  ? "border-[var(--elra-primary)] bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() =>
                setFormData((prev) => ({ ...prev, invitationMethod: "csv" }))
              }
            >
              <div className="flex items-center space-x-3 mb-2">
                <DocumentArrowUpIcon className="h-6 w-6 text-[var(--elra-primary)]" />
                <h3 className="font-semibold text-[var(--elra-text-primary)]">
                  CSV Employee Onboarding
                </h3>
              </div>
              <p className="text-sm text-[var(--elra-text-secondary)]">
                Detailed employee data from CSV. Individual departments, roles,
                and approval workflow.
              </p>
              <div className="mt-2 text-xs text-[var(--elra-text-muted)]">
                • Individual employee details • Approval workflow • Batch
                management
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-[var(--elra-border-primary)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Email Input */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                  Email Addresses *
                </label>

                {/* CSV Upload Section */}
                <div className="mb-4 p-4 border-2 border-dashed border-[var(--elra-border-primary)] rounded-lg bg-gray-50">
                  <div className="text-center">
                    <DocumentArrowUpIcon className="h-8 w-8 text-[var(--elra-primary)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--elra-text-secondary)] mb-2">
                      Upload CSV file with email addresses
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary)] cursor-pointer transition-colors"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                      {csvFile ? "Change CSV File" : "Choose CSV File"}
                    </label>
                    <p className="text-xs text-[var(--elra-text-muted)] mt-2">
                      CSV should contain only email addresses (one per line)
                    </p>

                    {/* Show selected file name */}
                    {csvFile && (
                      <div className="mt-3 p-2 bg-white border border-[var(--elra-border-primary)] rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DocumentArrowUpIcon className="h-4 w-4 text-[var(--elra-primary)]" />
                            <span className="text-sm font-medium text-[var(--elra-text-primary)]">
                              {csvFile.name}
                            </span>
                          </div>
                          <button
                            onClick={clearCsvData}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-xs text-[var(--elra-text-secondary)] mt-1">
                          Size: {(csvFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CSV Preview */}
                {showCsvPreview && csvEmails.length > 0 && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-green-800">
                        📊 CSV Uploaded: {csvEmails.length} emails found
                      </span>
                    </div>
                    <div className="max-h-20 overflow-y-auto">
                      <p className="text-xs text-green-700">
                        {csvEmails.slice(0, 5).join(", ")}
                        {csvEmails.length > 5 &&
                          ` ... and ${csvEmails.length - 5} more`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Manual Email Input */}
                <div>
                  <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                    Or enter emails manually:
                  </label>
                  <textarea
                    name="emails"
                    value={formData.emails}
                    onChange={handleInputChange}
                    placeholder="📧 Enter email addresses (one per line or comma-separated)"
                    className="w-full h-32 p-4 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)] resize-none"
                  />
                  <p className="text-sm text-[var(--elra-text-secondary)] mt-2">
                    {emailCount} valid email{emailCount !== 1 ? "s" : ""}{" "}
                    detected
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isBatch"
                  checked={formData.isBatch}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-[var(--elra-text-primary)]">
                  Create as batch invitation
                </label>
              </div>

              {formData.isBatch && (
                <div>
                  <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                    Batch Name
                  </label>
                  <input
                    type="text"
                    name="batchName"
                    value={formData.batchName}
                    onChange={handleInputChange}
                    placeholder="e.g., IT Department Q1 2024, Marketing Team Batch, New Hires January"
                    className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)]"
                  />
                  <p className="text-xs text-[var(--elra-text-secondary)] mt-1">
                    💡 Leave empty to auto-generate sequential batch number
                    (BATCH001, BATCH002, etc.)
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Settings */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                  <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                  Salary Grade *
                </label>
                <select
                  name="salaryGrade"
                  value={formData.salaryGrade}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)] bg-white text-[var(--elra-primary)]"
                >
                  <option value="" className="text-gray-500">
                    💰 Select Salary Grade (Required)
                  </option>
                  {salaryGrades.map((grade) => (
                    <option
                      key={grade}
                      value={grade}
                      className="text-[var(--elra-primary)]"
                    >
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                  <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                  Department *
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)] bg-white text-[var(--elra-primary)]"
                >
                  <option value="" className="text-gray-500">
                    🏢 Select Department (Required)
                  </option>
                  {departments.map((dept) => (
                    <option
                      key={dept._id}
                      value={dept._id}
                      className="text-[var(--elra-primary)]"
                    >
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                  <UserGroupIcon className="h-4 w-4 inline mr-1" />
                  Role *
                </label>
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)] bg-white text-[var(--elra-primary)]"
                >
                  <option value="" className="text-gray-500">
                    👥 Select Role (Required)
                  </option>
                  {roles.map((role) => (
                    <option
                      key={role._id}
                      value={role._id}
                      className="text-[var(--elra-primary)]"
                    >
                      {role.name.replace(/_/g, " ")} (Level {role.level})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-[var(--elra-border-primary)]">
            <button
              onClick={handlePreview}
              disabled={
                !formData.emails ||
                !formData.salaryGrade ||
                !formData.departmentId ||
                !formData.roleId
              }
              className="px-6 py-3 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <ClipboardDocumentListIcon className="h-5 w-5" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border-2 border-[var(--elra-primary)]">
              <div className="p-6">
                <h3 className="text-xl font-bold text-[var(--elra-text-primary)] mb-4">
                  Preview Invitations
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <span className="text-[var(--elra-text-primary)]">
                      {emailCount} email{emailCount !== 1 ? "s" : ""} will
                      receive invitations
                    </span>
                  </div>

                  <div className="bg-[var(--elra-bg-secondary)] p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-[var(--elra-text-secondary)]">
                          Salary Grade:
                        </span>
                        <p className="text-[var(--elra-text-primary)]">
                          {formData.salaryGrade}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--elra-text-secondary)]">
                          Department:
                        </span>
                        <p className="text-[var(--elra-text-primary)]">
                          {departments.find(
                            (d) => d._id === formData.departmentId
                          )?.name || formData.departmentId}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--elra-text-secondary)]">
                          Role:
                        </span>
                        <p className="text-[var(--elra-text-primary)]">
                          {roles.find((r) => r._id === formData.roleId)?.name ||
                            formData.roleId}
                        </p>
                      </div>
                      {formData.isBatch && formData.batchName && (
                        <div>
                          <span className="font-medium text-[var(--elra-text-secondary)]">
                            Batch Name:
                          </span>
                          <p className="text-[var(--elra-text-primary)]">
                            {formData.batchName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowPreview(false)}
                    disabled={submitting}
                    className="px-4 py-2 text-[var(--elra-text-secondary)] hover:text-[var(--elra-text-primary)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary)] disabled:opacity-50 flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="relative">
                          <div className="w-5 h-5 border-2 border-white border-opacity-30 rounded-full"></div>
                          <div
                            className="absolute top-0 left-0 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                            style={{
                              transform: `rotate(${
                                submissionProgress * 3.6
                              }deg)`,
                            }}
                          ></div>
                        </div>
                        <span>
                          Processing... {Math.round(submissionProgress)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Send Invitations</span>
                        <ArrowRightIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && showSubmissionSummary && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6 border border-[var(--elra-border-primary)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                <h3 className="text-xl font-bold text-[var(--elra-text-primary)]">
                  Invitations Sent Successfully!
                </h3>
              </div>
              <button
                onClick={() => setShowSubmissionSummary(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.data?.statistics?.successfulInvitations || 0}
                </div>
                <div className="text-sm text-[var(--elra-text-secondary)]">
                  Sent
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {result.data?.statistics?.emailsSent || 0}
                </div>
                <div className="text-sm text-[var(--elra-text-secondary)]">
                  Delivered
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {result.data?.statistics?.emailsFailed || 0}
                </div>
                <div className="text-sm text-[var(--elra-text-secondary)]">
                  Failed
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {result.data?.statistics?.failedInvitations || 0}
                </div>
                <div className="text-sm text-[var(--elra-text-secondary)]">
                  Errors
                </div>
              </div>
            </div>

            {/* Email Details */}
            {result.data?.invitations && result.data.invitations.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">
                  📧 Invitations Sent ({result.data.invitations.length}):
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {result.data.invitations.map((invitation, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-800">
                          {invitation.email}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {invitation.firstName} {invitation.lastName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Details */}
            {result.data?.errors && result.data.errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Issues Found:</h4>
                <div className="max-h-32 overflow-y-auto">
                  {result.data.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700 mb-1">
                      • {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* What happens next? */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-[var(--elra-primary)] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-black">
                  <h4 className="font-normal text-black mb-2">
                    What happens next?
                  </h4>
                  <ul className="space-y-1">
                    <li>
                      • Email Delivery: Invitations are sent immediately after
                      confirmation
                    </li>
                    <li>
                      • Tracking: Monitor delivery status and user registrations
                    </li>
                    <li>
                      • Expiration: Invitations expire in 7 days if not used
                    </li>
                    <li>
                      • Search: Use the search bar above to find and track
                      batches
                    </li>
                    <li>
                      • Management: View and manage all invitations in the table
                      below
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setShowSubmissionSummary(false)}
                className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary)]"
              >
                Close Summary
              </button>
              <button
                onClick={() => {
                  setShowSubmissionSummary(false);
                  setResult(null);
                }}
                className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary)]"
              >
                Send Another Batch
              </button>
            </div>
          </div>
        )}

        {/* Resend Confirmation Modal */}
        {showResendModal && selectedInvitation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 ease-out border border-gray-100">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
                    <ArrowPathIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-black">
                      Resend Invitation
                    </h3>
                    <p className="text-sm text-gray-600">
                      Send a new invitation email
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowResendModal(false);
                    setSelectedInvitation(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-black">
                          {selectedInvitation.email}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-black">
                          {selectedInvitation.firstName}{" "}
                          {selectedInvitation.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium text-black">
                          {selectedInvitation.department?.name ||
                            selectedInvitation.department ||
                            "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-medium text-black">
                          {(
                            selectedInvitation.role?.name ||
                            selectedInvitation.role ||
                            "-"
                          ).replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Status:</span>
                        <span className="font-medium text-black">
                          {selectedInvitation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <InformationCircleIcon className="h-5 w-5 text-[var(--elra-primary)] mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-black">
                      <h4 className="font-medium text-black mb-2">
                        What happens when you resend?
                      </h4>
                      <ul className="space-y-1">
                        <li>• A new invitation code will be generated</li>
                        <li>• The old invitation code will be invalidated</li>
                        <li>• A new email will be sent to the recipient</li>
                        <li>• The invitation will expire in 7 days</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowResendModal(false);
                      setSelectedInvitation(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleResendInvitation(selectedInvitation._id)
                    }
                    disabled={resendingId === selectedInvitation._id}
                    className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {resendingId === selectedInvitation._id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Resending...</span>
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="h-4 w-4" />
                        <span>Resend Invitation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkInvitationSystem;
