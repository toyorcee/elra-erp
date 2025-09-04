import React, { useState, useEffect } from "react";
import {
  EnvelopeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ClipboardDocumentListIcon,
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
    manualEmails: "",
    departmentId: "",
    roleId: "",
    batchName: "",
    isBatch: false,
  });

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [result, setResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("batch");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

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
  const [showRetryConfirmation, setShowRetryConfirmation] = useState(false);
  const [retryType, setRetryType] = useState(null);
  const [retryTarget, setRetryTarget] = useState(null);

  const [csvFile, setCsvFile] = useState(null);
  const [csvEmails, setCsvEmails] = useState([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [emailMethod, setEmailMethod] = useState("csv");
  const [manualEmailError, setManualEmailError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [nextBatchNumber, setNextBatchNumber] = useState("");
  const [batchNumberLoading, setBatchNumberLoading] = useState(false);
  const [retryingSingleEmail, setRetryingSingleEmail] = useState(null);
  const [retryingBatchEmails, setRetryingBatchEmails] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [showSubmissionSummary, setShowSubmissionSummary] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchInvitations(1, 10);
    setLastRefreshTime(new Date());
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey && event.key === "r") || event.key === "F5") {
        event.preventDefault();
        handleRefresh();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    fetchNextBatchNumber();
  }, []);

  useEffect(() => {
    setManualEmailError("");
    setIsDragOver(false);
  }, [emailMethod]);

  const loadData = async () => {
    setDataLoading(true);
    setError(null);
    try {
      const [departmentsRes, rolesRes] = await Promise.all([
        userModulesAPI.departments.getAllDepartments(),
        userModulesAPI.roles.getAllRoles(),
      ]);

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

  const fetchNextBatchNumber = async () => {
    console.log("🔍 [FRONTEND] Fetching next batch number...");
    setBatchNumberLoading(true);
    try {
      const response = await userModulesAPI.invitations.getNextBatchNumber();
      setNextBatchNumber(response.data.nextBatchNumber);
    } catch (error) {
      console.error("❌ [FRONTEND] Error fetching next batch number:", error);
    } finally {
      setBatchNumberLoading(false);
    }
  };

  const showRetryBatchConfirmation = (batchId) => {
    setRetryType("batch");
    setRetryTarget(batchId);
    setShowRetryConfirmation(true);
  };

  const showRetrySingleConfirmation = (invitationId) => {
    setRetryType("single");
    setRetryTarget(invitationId);
    setShowRetryConfirmation(true);
  };

  const handleRetryEmails = async (batchId) => {
    console.log("🔄 [FRONTEND] Retrying emails for batch:", batchId);
    setRetryingBatchEmails(batchId);
    try {
      const response = await userModulesAPI.invitations.retryFailedEmails(
        batchId
      );
      console.log("✅ [FRONTEND] Email retry successful:", response.data);

      // Update the result with new statistics
      setResult(response);

      // Refresh the invitations list to update status
      await fetchInvitations(
        invitationPagination.page,
        invitationPagination.limit,
        true
      );
      setLastRefreshTime(new Date());

      // Show success confirmation modal
      setRetryType("batch");
      setRetryTarget(batchId);
      setShowRetryConfirmation(true);
      console.log(
        "🎉 [FRONTEND] Setting confirmation modal to show for batch retry"
      );

      toast.success(
        <div className="flex items-center space-x-3">
          <div>
            <div className="font-medium">
              Batch Emails Retried Successfully!
            </div>
            <div className="text-sm text-gray-600">
              {response.data?.statistics?.emailsSent || 0} emails sent
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error("❌ [FRONTEND] Error retrying emails:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to retry emails";
      toast.error(errorMessage);
    } finally {
      setRetryingBatchEmails(null);
    }
  };

  const handleRetrySingleEmail = async (invitationId) => {
    console.log(
      "🔄 [FRONTEND] Retrying single email for invitation:",
      invitationId
    );
    setRetryingSingleEmail(invitationId);
    try {
      const response = await userModulesAPI.invitations.retrySingleEmail(
        invitationId
      );
      console.log(
        "✅ [FRONTEND] Single email retry successful:",
        response.data
      );

      // Update the result with new statistics
      setResult(response);

      // Refresh the invitations list to update status
      await fetchInvitations(
        invitationPagination.page,
        invitationPagination.limit,
        true
      );
      setLastRefreshTime(new Date());

      setRetryType("single");
      setRetryTarget(invitationId);
      setShowRetryConfirmation(true);
      console.log(
        "🎉 [FRONTEND] Setting confirmation modal to show for single retry"
      );

      toast.success(
        <div className="flex items-center space-x-3">
          <div>
            <div className="font-medium">Email Retried Successfully!</div>
            <div className="text-sm text-gray-600">
              Email sent to {response.data?.invitation?.email}
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error("❌ [FRONTEND] Error retrying single email:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to retry email";
      toast.error(errorMessage);
    } finally {
      setRetryingSingleEmail(null);
    }
  };

  const fetchInvitations = async (
    page = 1,
    limit = 10,
    forceRefresh = false
  ) => {
    setInvitationsLoading(true);
    setInvitationsError(null);

    if (forceRefresh) {
      setInvitations([]);
      setResult(null);
    }

    try {
      const params = {
        page,
        limit,
      };

      // Add cache-busting parameter for force refresh
      if (forceRefresh) {
        params._t = Date.now();
      }

      const response = await userModulesAPI.invitations.getAllInvitations(
        params
      );
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchInvitations(
        invitationPagination.page,
        invitationPagination.limit,
        true
      );
      setLastRefreshTime(new Date());
      toast.success("Invitations refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing invitations:", error);
      toast.error("Failed to refresh invitations");
    } finally {
      setRefreshing(false);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      setResendingId(invitationId);
      await userModulesAPI.invitations.resendInvitation(invitationId);
      // Refresh list to reflect potential status changes
      await fetchInvitations(
        invitationPagination.page,
        invitationPagination.limit,
        true
      );
      setLastRefreshTime(new Date());
      setShowResendModal(false);
      setSelectedInvitation(null);

      // Show success toast
      toast.success(
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-6 w-6 text-[var(--elra-primary)] animate-bounce" />
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
    processCsvFile(file);
  };

  const validateCsvFile = (file) => {
    const fileName = file.name.toLowerCase();
    const validExtensions = [".csv"];
    const hasValidExtension = validExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: "File size must be less than 5MB" };
    }

    const validMimeTypes = [
      "text/csv",
      "text/plain",
      "application/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const hasValidMimeType = validMimeTypes.includes(file.type);

    // Accept if either extension or MIME type is valid
    if (hasValidExtension || hasValidMimeType) {
      return { isValid: true, error: null };
    }

    return {
      isValid: false,
      error: "Please select a valid CSV file (.csv) with email addresses",
    };
  };

  const processCsvFile = (file) => {
    const validation = validateCsvFile(file);

    if (validation.isValid) {
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

        if (emails.length === 0) {
          setError(
            "No valid email addresses found in the file. Please ensure each row contains a valid email address."
          );
          setCsvFile(null);
          return;
        }

        setCsvEmails(emails);
        setFormData((prev) => ({ ...prev, emails: emails.join("\n") }));
        setShowCsvPreview(true);
        setError(null);
      };
      reader.readAsText(file);
    } else {
      setError(validation.error);
      setCsvFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);

    if (files.length === 0) {
      setError("No files were dropped");
      return;
    }

    if (files.length > 1) {
      setError("Please drop only one file at a time");
      return;
    }

    const file = files[0];
    const validation = validateCsvFile(file);

    if (validation.isValid) {
      processCsvFile(file);
    } else {
      setError(validation.error);
    }
  };

  const clearCsvData = () => {
    setCsvFile(null);
    setCsvEmails([]);
    setShowCsvPreview(false);
    setFormData((prev) => ({ ...prev, emails: "" }));
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
        searchQuery,
        1,
        10,
        searchType
      );

      setSearchResults(response);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching:", error);
      setError(
        error.response?.data?.message || "Error searching. Please try again."
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

  const validateManualEmails = (emails) => {
    if (!emails.trim()) {
      setManualEmailError("");
      return { validEmails: [], invalidEmails: [] };
    }

    const emailList = emails
      .split(/[,\n\s]+/)
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

    if (invalidEmails.length > 0) {
      setManualEmailError(
        `Invalid email addresses: ${invalidEmails.join(", ")}`
      );
    } else {
      setManualEmailError("");
    }

    return { validEmails, invalidEmails };
  };

  const handlePreview = () => {
    let validEmails, invalidEmails;

    if (emailMethod === "manual") {
      const validation = validateManualEmails(formData.manualEmails);
      validEmails = validation.validEmails;
      invalidEmails = validation.invalidEmails;
    } else {
      const validation = validateEmails(formData.emails);
      validEmails = validation.validEmails;
      invalidEmails = validation.invalidEmails;
    }

    if (validEmails.length === 0) {
      setError("Please enter at least one valid email address");
      return;
    }

    if (invalidEmails.length > 0) {
      setError(`Invalid email addresses: ${invalidEmails.join(", ")}`);
      return;
    }

    if (!formData.departmentId || !formData.roleId) {
      setError("Please fill in all required fields (Department and Role)");
      return;
    }

    setError(null);
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    console.log("🚀 [FRONTEND] Starting invitation submission process");
    setSubmitting(true);
    setSubmissionProgress(0);
    setError(null);

    console.log("📋 [FRONTEND] Current form data:", formData);

    const progressInterval = setInterval(() => {
      setSubmissionProgress((prev) => {
        if (prev >= 90) return prev;
        return Math.min(prev + Math.random() * 15, 90);
      });
    }, 200);

    try {
      let validEmails;
      console.log("✉️ [FRONTEND] Email method:", emailMethod);

      if (emailMethod === "manual") {
        console.log("📝 [FRONTEND] Processing manual emails");
        const validation = validateManualEmails(formData.manualEmails);
        validEmails = validation.validEmails;
        console.log("✅ [FRONTEND] Valid manual emails:", validEmails);
      } else {
        console.log("📎 [FRONTEND] Processing CSV emails");
        const validation = validateEmails(formData.emails);
        validEmails = validation.validEmails;
        console.log("✅ [FRONTEND] Valid CSV emails:", validEmails);
      }

      const invitationData = {
        emails: validEmails,
        departmentId: formData.departmentId,
        roleId: formData.roleId,
        isBatch: formData.isBatch,
      };

      console.log("📤 [FRONTEND] Sending invitation request:", invitationData);

      let response;
      if (!invitationData.isBatch && invitationData.emails.length === 1) {
        console.log("👤 [FRONTEND] Sending single invitation");
        try {
          response = await userModulesAPI.invitations.createSingleInvitation({
            email: invitationData.emails[0],
            departmentId: invitationData.departmentId,
            roleId: invitationData.roleId,
          });
          console.log(
            "✅ [FRONTEND] Single invitation response received:",
            response
          );
        } catch (singleError) {
          console.error("❌ [FRONTEND] Single invitation failed:", singleError);
          throw singleError;
        }
      } else {
        console.log("👥 [FRONTEND] Sending bulk invitation");
        response = await userModulesAPI.invitations.createBulkInvitations(
          invitationData
        );
      }

      console.log("📥 [FRONTEND] Received response:", response);
      console.log(
        "📊 [FRONTEND] Invitation statistics:",
        response.data?.statistics
      );

      setSubmissionProgress(100);
      setResult(response);
      setShowPreview(false);
      setShowSubmissionSummary(true);

      console.log("🔄 [FRONTEND] Refreshing invitations list");
      await fetchInvitations(1, 10, true);
      setLastRefreshTime(new Date());

      console.log("✅ [FRONTEND] Invitation process completed successfully");

      toast.success(
        <div className="flex items-center space-x-3">
          <div>
            <div className="font-medium">Invitations Sent Successfully!</div>
            <div className="text-sm text-gray-600">
              {response.data?.statistics?.successfulInvitations || 0}{" "}
              invitations sent
            </div>
          </div>
        </div>
      );

      setFormData({
        emails: "",
        manualEmails: "",
        departmentId: "",
        roleId: "",
        batchName: "",
        isBatch: false,
      });

      // Clear CSV data
      clearCsvData();

      // Refresh next batch number after successful creation
      fetchNextBatchNumber();
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

  const emailCount = (() => {
    if (emailMethod === "manual") {
      if (!formData.manualEmails.trim()) return 0;
      const emailList = formData.manualEmails
        .split(/[,\n\s]+/)
        .map((email) => email.trim())
        .filter((email) => email);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailList.filter((email) => emailRegex.test(email)).length;
    } else {
      return formData.emails
        ? validateEmails(formData.emails).validEmails.length
        : 0;
    }
  })();

  const emailCountText = emailCount === 1 ? "email" : "emails";

  const showBatchOption = emailCount >= 2;

  useEffect(() => {
    if (emailCount < 2 && formData.isBatch) {
      setFormData((prev) => ({
        ...prev,
        isBatch: false,
        batchName: "",
      }));
    } else if (emailCount >= 2 && !formData.isBatch) {
      setFormData((prev) => ({
        ...prev,
        isBatch: true,
      }));
    }
  }, [emailCount, formData.isBatch]);

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--elra-primary)] rounded-lg">
                <EnvelopeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--elra-text-primary)]">
                  Invitation Management System
                </h1>
                <p className="text-[var(--elra-text-secondary)]">
                  Create and manage user invitations individually or in batches
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors font-medium cursor-pointer"
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              {showCreateForm ? "Hide Form" : "Create Invitation"}
            </button>
          </div>
        </div>

        {/* Tips and Guidelines */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-3">
            <LightBulbIcon className="h-6 w-6 text-[var(--elra-primary)] mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-black mb-3">
                Tips for Successful Invitations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-black">
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-[var(--elra-primary)] mr-2" />
                    Email Input Methods
                  </h4>
                  <ul className="space-y-1">
                    <li>
                      • Manual entry: Type or paste emails (separated by commas)
                    </li>
                    <li>• CSV upload: Drag & drop or browse files</li>
                    <li>• Real-time validation shows valid/invalid emails</li>
                    <li>
                      • Supports commas, spaces, and newlines as separators
                    </li>
                    <li>• CSV format: One email address per row (max 5MB)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-[var(--elra-primary)] mr-2" />
                    Smart Invitation Management
                  </h4>
                  <ul className="space-y-1">
                    <li>• Single email: Individual invitation (no batch)</li>
                    <li>• 2+ emails: Auto-enables batch mode</li>
                    <li>
                      • Sequential batch numbers: BATCH001, BATCH002, etc.
                    </li>
                    <li>• Batch numbers auto-generated by system</li>
                    <li>• Search by batch number: "BATCH001" or "BATCH 001"</li>
                    <li>
                      • Search by email address, department, role, or invitation
                      code
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <UserGroupIcon className="h-4 w-4 text-[var(--elra-primary)] mr-2" />
                    User Assignment
                  </h4>
                  <ul className="space-y-1">
                    <li>• Salary grade automatically assigned based on role</li>
                    <li>• Select department and role for all invitations</li>
                    <li>• Names auto-generated from email addresses</li>
                    <li>• Preview before sending to verify details</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-[var(--elra-primary)] mr-2" />
                    Best Practices
                  </h4>
                  <ul className="space-y-1">
                    <li>• Always preview before sending invitations</li>
                    <li>• System automatically checks for existing users</li>
                    <li>• Monitor email delivery status in the table below</li>
                    <li>• Use batch numbers for easy tracking and search</li>
                    <li>• Retry failed emails using the retry buttons</li>
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
                Search Invitations
              </h2>
              <p className="text-[var(--elra-text-secondary)]">
                Find invitations by batch, email, department, role, or code
              </p>
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="flex-shrink-0">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)] bg-white"
              >
                <option value="batch">Batch</option>
                <option value="email">Email</option>
                <option value="department">Department</option>
                <option value="role">Role</option>
                <option value="code">Invitation Code</option>
              </select>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchType === "batch"
                    ? "Search by batch ID (e.g., BATCH001) or batch name..."
                    : searchType === "email"
                    ? "Search by email address..."
                    : searchType === "department"
                    ? "Search by department name..."
                    : searchType === "role"
                    ? "Search by role name..."
                    : "Search by invitation code..."
                }
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
                Search Results (
                {searchType === "batch"
                  ? `${searchResults.data.batches?.length || 0} batches found`
                  : `${
                      searchResults.data.invitations?.length || 0
                    } invitations found`}
                )
              </h3>
              <button
                onClick={() => setShowSearchResults(false)}
                className="text-[var(--elra-text-secondary)] hover:text-[var(--elra-text-primary)]"
              >
                Close
              </button>
            </div>

            {searchType === "batch" ? (
              // Batch search results
              searchResults.data.batches?.length > 0 ? (
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
              )
            ) : // Invitation search results
            searchResults.data.invitations?.length > 0 ? (
              <div className="space-y-4">
                {searchResults.data.invitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className="border border-[var(--elra-border-primary)] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-[var(--elra-text-primary)]">
                          {invitation.email}
                        </h4>
                        <p className="text-sm text-[var(--elra-text-secondary)]">
                          {invitation.firstName} {invitation.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[var(--elra-text-secondary)]">
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-[var(--elra-text-secondary)]">
                          Code: {invitation.code}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-bold text-blue-600">
                          {invitation.department?.name || "N/A"}
                        </div>
                        <div className="text-blue-600">Department</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="font-bold text-purple-600">
                          {invitation.role?.name || "N/A"}
                        </div>
                        <div className="text-purple-600">Role</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-bold text-green-600">
                          {invitation.batchId || "Single"}
                        </div>
                        <div className="text-green-600">Type</div>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="font-bold text-yellow-600">
                          {invitation.status}
                        </div>
                        <div className="text-yellow-600">Status</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <InformationCircleIcon className="h-12 w-12 text-[var(--elra-text-secondary)] mx-auto mb-4" />
                <p className="text-[var(--elra-text-secondary)]">
                  No invitations found matching your search.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-[var(--elra-border-primary)] mb-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                Email Addresses *
              </label>

              {/* Email Input Method Toggle */}
              <div className="mb-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="emailMethod"
                      value="csv"
                      checked={emailMethod === "csv"}
                      onChange={(e) => setEmailMethod(e.target.value)}
                      className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-[var(--elra-text-primary)] cursor-pointer">
                      Upload CSV File
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="emailMethod"
                      value="manual"
                      checked={emailMethod === "manual"}
                      onChange={(e) => setEmailMethod(e.target.value)}
                      className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-[var(--elra-text-primary)] cursor-pointer">
                      Enter Manually
                    </span>
                  </label>
                </div>
              </div>

              {/* CSV Upload Section */}
              {emailMethod === "csv" && (
                <div
                  className={`mb-4 p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
                    isDragOver
                      ? "border-[var(--elra-primary)] bg-blue-50 scale-105"
                      : "border-[var(--elra-border-primary)] bg-gray-50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <DocumentArrowUpIcon
                      className={`h-8 w-8 mx-auto mb-2 transition-all duration-200 ${
                        isDragOver
                          ? "text-[var(--elra-primary)] animate-bounce scale-110"
                          : "text-[var(--elra-primary)]"
                      }`}
                    />
                    <p
                      className={`text-sm mb-2 transition-colors duration-200 ${
                        isDragOver
                          ? "text-[var(--elra-primary)] font-medium"
                          : "text-[var(--elra-text-secondary)]"
                      }`}
                    >
                      {isDragOver
                        ? "Drop your CSV file here!"
                        : "Upload CSV file with email addresses"}
                    </p>
                    <p className="text-xs text-[var(--elra-text-muted)] mb-3">
                      Drag and drop your CSV file here, or click to browse
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
                      {csvFile ? "Change File" : "Choose File"}
                    </label>
                    <p className="text-xs text-[var(--elra-text-muted)] mt-2">
                      CSV should contain only email addresses (one per row). Max
                      size: 5MB
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
              )}

              {/* Manual Email Entry Section */}
              {emailMethod === "manual" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                    Enter Email Addresses
                  </label>
                  <textarea
                    name="manualEmails"
                    value={formData.manualEmails}
                    onChange={(e) => {
                      handleInputChange(e);
                      // Debounce the validation to avoid too many calls
                      clearTimeout(window.validationTimeout);
                      window.validationTimeout = setTimeout(() => {
                        validateManualEmails(e.target.value);
                      }, 300);
                    }}
                    onBlur={(e) => {
                      validateManualEmails(e.target.value);
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = e.clipboardData.getData("text");
                      const normalizedText = pastedText
                        .replace(/\r\n/g, "\n")
                        .replace(/\r/g, "\n")
                        .replace(/[,\s]+/g, "\n")
                        .split("\n")
                        .map((email) => email.trim())
                        .filter((email) => email)
                        .join("\n");

                      const newValue = formData.manualEmails
                        ? formData.manualEmails + "\n" + normalizedText
                        : normalizedText;

                      setFormData((prev) => ({
                        ...prev,
                        manualEmails: newValue,
                      }));
                      validateManualEmails(newValue);
                    }}
                    placeholder="Enter email addresses separated by commas, spaces, or new lines&#10;Example:&#10;john@company.com&#10;jane@company.com&#10;mike@company.com&#10;&#10;💡 You can also paste a list of emails from Excel, Word, or any text source"
                    rows={6}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-white/80 backdrop-blur-sm shadow-sm ${
                      manualEmailError
                        ? "border-red-500"
                        : "border-[var(--elra-border-primary)]"
                    }`}
                  />
                  {manualEmailError && (
                    <p className="text-xs text-red-600 mt-1 flex items-center">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      {manualEmailError}
                    </p>
                  )}
                  {formData.manualEmails && !manualEmailError && (
                    <div className="mt-2 p-2 bg-[var(--elra-secondary-3)] rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="h-4 w-4 text-[var(--elra-primary)]" />
                        <span className="text-sm text-[var(--elra-primary)]">
                          {(() => {
                            if (!formData.manualEmails.trim()) return 0;
                            const emailList = formData.manualEmails
                              .split(/[,\n\s]+/)
                              .map((email) => email.trim())
                              .filter((email) => email);
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            const count = emailList.filter((email) =>
                              emailRegex.test(email)
                            ).length;
                            return `${count} valid ${
                              count === 1 ? "email" : "emails"
                            } detected`;
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-[var(--elra-text-secondary)] mt-1">
                    💡 You can separate emails with commas, spaces, or new
                    lines. You can also paste email lists from Excel, Word, or
                    any text source. Validation happens in real-time.
                  </p>
                </div>
              )}

              {/* CSV Preview */}
              {showCsvPreview && csvEmails.length > 0 && (
                <div className="mb-4 p-3 bg-[var(--elra-secondary-3)] border border-[var(--elra-primary)] rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircleIcon className="h-4 w-4 text-[var(--elra-primary)]" />
                    <span className="text-sm font-medium text-[var(--elra-primary)]">
                      📊 CSV Uploaded: {csvEmails.length} emails found
                    </span>
                  </div>
                  <div className="max-h-20 overflow-y-auto">
                    <p className="text-xs text-[var(--elra-primary)]">
                      {csvEmails.slice(0, 5).join(", ")}
                      {csvEmails.length > 5 &&
                        ` ... and ${csvEmails.length - 5} more`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Layout based on batch option visibility */}
            <div
              className={`grid gap-6 ${
                showBatchOption
                  ? "grid-cols-1 md:grid-cols-2"
                  : "grid-cols-1 md:grid-cols-2"
              }`}
            >
              {/* Left Column - Only show when batch option is available */}
              {showBatchOption && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="isBatch"
                      checked={formData.isBatch}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded cursor-pointer"
                    />
                    <label className="text-sm font-medium text-[var(--elra-text-primary)] cursor-pointer">
                      Create as batch invitation
                    </label>
                  </div>
                </div>
              )}

              {/* Single Email Info - Show when batch option is hidden */}
              {!showBatchOption && emailCount === 1 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <InformationCircleIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-blue-700">
                      Single email invitation - batch option not available
                    </span>
                  </div>
                </div>
              )}

              {/* Department, Role, and Batch Number Selection */}
              <div
                className={`grid gap-6 ${
                  showBatchOption && formData.isBatch && emailCount >= 2
                    ? "grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {/* Batch Number - Only show when batch is enabled and 2+ emails */}
                {showBatchOption && formData.isBatch && emailCount >= 2 && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                      Next Batch Number:
                    </label>
                    <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg">
                      {batchNumberLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                      ) : (
                        <span className="text-lg font-bold text-black uppercase tracking-wider">
                          {(nextBatchNumber || "BATCH_001").replace(
                            /[_-]/g,
                            ""
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-2">
                    Department *
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)] bg-white text-[var(--elra-primary)]"
                  >
                    <option value="" className="text-gray-500">
                      Select Department
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
                    Role *
                  </label>
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-[var(--elra-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--elra-border-focus)] focus:border-[var(--elra-border-focus)] bg-white text-[var(--elra-primary)]"
                  >
                    <option value="" className="text-gray-500">
                      Select Role
                    </option>
                    {roles.map((role) => (
                      <option
                        key={role._id}
                        value={role._id}
                        className="text-[var(--elra-primary)]"
                      >
                        {role.name.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Informational text about automatic salary grade assignment */}
              <p className="text-sm text-[var(--elra-text-secondary)] mt-4">
                When you select a role, the system automatically assigns the
                appropriate salary grade, compensation structure, and
                allowances. This ensures consistency across your organization.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-[var(--elra-border-primary)]">
              <button
                onClick={handlePreview}
                disabled={
                  (emailMethod === "manual"
                    ? !formData.manualEmails
                    : !formData.emails) ||
                  !formData.departmentId ||
                  !formData.roleId ||
                  (emailMethod === "manual" && manualEmailError)
                }
                className="px-6 py-3 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <ClipboardDocumentListIcon className="h-5 w-5" />
                <span>Preview</span>
              </button>
            </div>
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
              {(() => {
                const failedBatchEmails = (
                  result?.data?.invitations ||
                  invitations ||
                  []
                ).filter(
                  (inv) =>
                    inv.batchId &&
                    (!inv.emailSent ||
                      inv.emailError ||
                      inv.status === "failed")
                );
                const uniqueBatches = [
                  ...new Set(failedBatchEmails.map((inv) => inv.batchId)),
                ];

                if (uniqueBatches.length > 0) {
                  const batchGroups = {};
                  failedBatchEmails.forEach((inv) => {
                    if (!batchGroups[inv.batchId]) {
                      batchGroups[inv.batchId] = [];
                    }
                    batchGroups[inv.batchId].push(inv);
                  });

                  return (
                    <div className="flex items-center space-x-2">
                      {Object.entries(batchGroups).map(([batchId, emails]) => (
                        <button
                          key={batchId}
                          onClick={() => showRetryBatchConfirmation(batchId)}
                          disabled={retryingBatchEmails === batchId}
                          className="inline-flex items-center px-3 py-1 rounded-md border text-sm cursor-pointer font-medium border-[var(--elra-primary)] text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Retry ${emails.length} failed emails in ${batchId}`}
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          {retryingBatchEmails === batchId
                            ? "Retrying..."
                            : `${batchId} (${emails.length})`}
                        </button>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
              <button
                className={`px-3 py-1 rounded-md border text-sm cursor-pointer ${
                  invitationFilter === "all"
                    ? "bg-[var(--elra-primary)] text-white"
                    : "border-[var(--elra-border-primary)] text-[var(--elra-text-primary)]"
                }`}
                onClick={() => setInvitationFilter("all")}
              >
                All
              </button>
              <button
                className={`px-3 py-1 rounded-md border text-sm cursor-pointer ${
                  invitationFilter === "single"
                    ? "bg-[var(--elra-primary)] text-white"
                    : "border-[var(--elra-border-primary)] text-[var(--elra-text-primary)]"
                }`}
                onClick={() => setInvitationFilter("single")}
              >
                Single
              </button>
              <button
                className={`px-3 py-1 rounded-md border text-sm cursor-pointer ${
                  invitationFilter === "batch"
                    ? "bg-[var(--elra-primary)] text-white"
                    : "border-[var(--elra-border-primary)] text-[var(--elra-text-primary)]"
                }`}
                onClick={() => setInvitationFilter("batch")}
              >
                Batch
              </button>
              <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-2 rounded-md border border-[var(--elra-primary)] text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors duration-200"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh invitations (Ctrl+R or F5)"
                >
                  {refreshing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-4 w-4" />
                      <span>Refresh</span>
                    </>
                  )}
                </button>
                {lastRefreshTime && (
                  <span className="text-xs text-[var(--elra-text-secondary)]">
                    Last updated: {lastRefreshTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
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
                  <th className="py-3 pr-4 font-semibold">Department</th>
                  <th className="py-3 pr-4 font-semibold">Role</th>
                  <th className="py-3 pr-4 font-semibold">Type</th>
                  <th className="py-3 pr-4 font-semibold">Invitation Status</th>
                  <th className="py-3 pr-4 font-semibold">Email Status</th>
                  <th className="py-3 pr-4 font-semibold">Created At</th>
                  <th className="py-3 pr-4 font-semibold">Batch ID</th>
                  <th className="py-3 pr-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitationsLoading ? (
                  <tr>
                    <td
                      className="py-8 text-center text-[var(--elra-text-secondary)]"
                      colSpan="10"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--elra-primary)]"></div>
                        <span>Loading invitations...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (result?.data?.invitations || invitations || [])
                    .filter((inv) => {
                      if (invitationFilter === "single") return !inv.batchId;
                      if (invitationFilter === "batch") return !!inv.batchId;
                      return true;
                    })
                    .map((inv) => (
                      <tr
                        key={inv._id || inv.id}
                        className="border-b border-[var(--elra-border-primary)] hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 pr-4 text-[var(--elra-text-primary)] font-medium">
                          {inv.email}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {inv.department || "N/A"}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {(inv.role || "N/A").replace(/_/g, " ")}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {inv.batchId ? "Batch" : "Single"}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              inv.status === "active" || inv.status === "sent"
                                ? "bg-green-100 text-green-800"
                                : inv.status === "used"
                                ? "bg-blue-100 text-blue-800"
                                : inv.status === "expired"
                                ? "bg-red-100 text-red-800"
                                : inv.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {inv.status === "failed"
                              ? "Failed"
                              : inv.status === "sent"
                              ? "Active"
                              : inv.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              inv.emailSent
                                ? "bg-green-100 text-green-800"
                                : inv.emailError
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {inv.emailSent
                              ? "Sent"
                              : inv.emailError
                              ? "Failed"
                              : "Pending"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {inv.createdAt
                            ? new Date(inv.createdAt).toLocaleString()
                            : inv.created_at
                            ? new Date(inv.created_at).toLocaleString()
                            : inv.emailSentAt
                            ? new Date(inv.emailSentAt).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {inv.batchId || "N/A"}
                        </td>
                        <td className="py-3 pr-4">
                          {(!inv.emailSent ||
                            inv.emailError ||
                            inv.status === "failed") && (
                            <button
                              onClick={() => {
                                showRetrySingleConfirmation(inv._id || inv.id);
                              }}
                              disabled={
                                retryingSingleEmail === (inv._id || inv.id)
                              }
                              className="inline-flex items-center px-3 py-1 rounded-md border text-sm cursor-pointer font-medium border-[var(--elra-primary)] text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ArrowPathIcon className="h-4 w-4 mr-1" />
                              {retryingSingleEmail === (inv._id || inv.id)
                                ? "Retrying..."
                                : "Retry Email"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                )}
                {!invitationsLoading &&
                  (result?.data?.invitations || invitations) &&
                  (result?.data?.invitations || invitations).length === 0 && (
                    <tr>
                      <td className="py-12 text-center" colSpan="10">
                        <div className="empty-state">
                          <div className="empty-state-icon mb-4">
                            <InformationCircleIcon className="h-16 w-16 text-[var(--elra-primary)] mx-auto" />
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

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border-2 border-[var(--elra-primary)]">
              <div className="p-6">
                <h3 className="text-xl font-bold text-[var(--elra-text-primary)] mb-4">
                  Preview Invitations
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <span className="text-[var(--elra-text-primary)]">
                      {emailCount} {emailCountText} will receive invitations
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                <CheckCircleIcon className="h-8 w-8 text-[var(--elra-primary)] animate-bounce" />
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
              <div className="text-center p-4 bg-[var(--elra-secondary-3)] rounded-lg">
                <div className="text-2xl font-bold text-[var(--elra-primary)]">
                  {result.data?.statistics?.successfulInvitations || 0}
                </div>
                <div className="text-sm text-black">Created</div>
              </div>
              <div className="text-center p-4 bg-[var(--elra-secondary-3)] rounded-lg">
                <div className="text-2xl font-bold text-[var(--elra-primary)]">
                  {result.data?.statistics?.emailsSent || 0}
                </div>
                <div className="text-sm text-black">Sent</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {result.data?.statistics?.emailsFailed || 0}
                </div>
                <div className="text-sm text-black">Email Failed</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {result.data?.statistics?.failedInvitations || 0}
                </div>
                <div className="text-sm text-black">Errors</div>
              </div>
            </div>

            {/* Email Details */}
            {result.data?.invitations && result.data.invitations.length > 0 && (
              <div className="mb-4 p-4 bg-[var(--elra-secondary-3)] rounded-lg">
                <h4 className="font-medium text-black mb-2">
                  📧 Invitations Created ({result.data.invitations.length}):
                </h4>
                <div className="h-32 overflow-y-auto space-y-2">
                  {result.data.invitations.map((invitation, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-[var(--elra-primary)] rounded-full"></div>
                        <span className="text-sm font-medium text-black">
                          {invitation.email}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Details */}
            {result.data?.errors && result.data.errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-black mb-2">Issues Found:</h4>
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
            <div className="mt-6 p-4 bg-[var(--elra-secondary-3)] rounded-lg">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-[var(--elra-primary)] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-black">
                  <h4 className="font-normal text-black mb-2">
                    What happens next?
                  </h4>
                  <ul className="space-y-1 text-black">
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

            {/* Retry Email Buttons */}
            {result.data?.statistics?.emailsFailed > 0 && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => {
                    if (result.data.batchId) {
                      handleRetryEmails(result.data.batchId);
                    } else {
                      handleRetrySingleEmail(result.data.invitation?.id);
                    }
                  }}
                  disabled={retryingBatchEmails || retryingSingleEmail}
                  className="px-6 py-3 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
                >
                  {retryingBatchEmails || retryingSingleEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Retrying...</span>
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-4 w-4" />
                      <span>
                        Retry Failed Email{result.data.batchId ? "s" : ""} (
                        {result.data.statistics.emailsFailed})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => {
                  setShowSubmissionSummary(false);
                  fetchInvitations(1, 10);
                }}
                className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary)] cursor-pointer"
              >
                Close Summary
              </button>
              <button
                onClick={() => {
                  setShowSubmissionSummary(false);
                  setResult(null);
                  fetchInvitations(1, 10);
                }}
                className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary)] cursor-pointer"
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

        {/* Retry Confirmation Modal */}
        {showRetryConfirmation && (
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
                      Confirm Email Retry
                    </h3>
                    <p className="text-sm text-gray-600">
                      {retryType === "batch"
                        ? "Are you sure you want to retry this batch?"
                        : "Are you sure you want to retry this email?"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRetryConfirmation(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <InformationCircleIcon className="h-5 w-5 text-[var(--elra-primary)] mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-black">
                        <h4 className="font-medium text-black mb-2">
                          What will happen?
                        </h4>
                        <ul className="space-y-1">
                          <li>• A new invitation email will be sent</li>
                          <li>
                            • The previous invitation link will be invalidated
                          </li>
                          <li>• Email status will be updated</li>
                          <li>• Retry button will be hidden after success</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowRetryConfirmation(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowRetryConfirmation(false);
                      if (retryType === "batch") {
                        handleRetryEmails(retryTarget);
                      } else {
                        handleRetrySingleEmail(retryTarget);
                      }
                    }}
                    className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors cursor-pointer"
                  >
                    Confirm Retry
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
