import React, { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CalendarDaysIcon,
  EyeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  XMarkIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";
import DataTable from "../../../../components/common/DataTable";
import {
  getELRAWallet,
  getPendingPayrollApprovals,
  approvePayroll,
  rejectPayroll,
} from "../../../../services/financeAPI";
import defaultAvatar from "../../../../assets/defaulticon.jpg";

const PayrollApprovals = () => {
  const { user } = useAuth();

  const canApprove = () => {
    const userDepartment = user?.department?.name;
    const isSuperAdmin = user?.role?.level === 1000;
    const isFinanceHOD =
      user?.role?.level === 700 && userDepartment === "Finance & Accounting";

    return isSuperAdmin || isFinanceHOD;
  };
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] =
    useState(false);
  const [financeStats, setFinanceStats] = useState({
    totalBudget: 0,
    allocatedAmount: 0,
    remainingBudget: 0,
    pendingAllocations: 0,
    usedBudget: 0,
    reservedBudget: 0,
    monthlyLimit: 0,
  });

  const fetchELRABudget = async () => {
    try {
      const response = await getELRAWallet();

      if (response.success) {
        const budgetCategories =
          response.data?.financialSummary?.budgetCategories;

        if (budgetCategories?.payroll) {
          return {
            totalBudget: budgetCategories.payroll.allocated || 0,
            availableBudget: budgetCategories.payroll.available || 0,
            usedBudget: budgetCategories.payroll.used || 0,
            reservedBudget: budgetCategories.payroll.reserved || 0,
            monthlyLimit: 0,
          };
        }

        return {
          totalBudget: response.data?.financialSummary?.totalFunds || 0,
          availableBudget: response.data?.financialSummary?.availableFunds || 0,
          usedBudget: 0,
          reservedBudget: 0,
          monthlyLimit: 0,
        };
      } else {
        console.warn("Failed to fetch ELRA wallet budget, using fallback");
        return {
          totalBudget: 0,
          availableBudget: 0,
          usedBudget: 0,
          reservedBudget: 0,
          monthlyLimit: 0,
        };
      }
    } catch (error) {
      console.error("Error fetching ELRA wallet budget:", error);
      return {
        totalBudget: 0,
        availableBudget: 0,
        usedBudget: 0,
        reservedBudget: 0,
        monthlyLimit: 0,
      };
    }
  };

  // Calculate finance statistics
  const calculateFinanceStats = async (approvalsData) => {
    const budgetData = await fetchELRABudget();

    // Calculate amounts from approval data
    const allocatedAmount = approvalsData
      .filter(
        (approval) =>
          approval.approvalStatus === "approved_finance" ||
          approval.approvalStatus === "approved_hr" ||
          approval.approvalStatus === "processed"
      )
      .reduce(
        (sum, approval) => sum + (approval.financialSummary?.totalNetPay || 0),
        0
      );

    const pendingAllocations = approvalsData
      .filter((approval) => approval.approvalStatus === "pending_finance")
      .reduce(
        (sum, approval) => sum + (approval.financialSummary?.totalNetPay || 0),
        0
      );

    setFinanceStats({
      totalBudget: budgetData.totalBudget || 0,
      allocatedAmount:
        (budgetData.usedBudget || 0) + (budgetData.reservedBudget || 0),
      remainingBudget: budgetData.availableBudget || 0,
      pendingAllocations,
      usedBudget: budgetData.usedBudget || 0,
      reservedBudget: budgetData.reservedBudget || 0,
      monthlyLimit: budgetData.monthlyLimit || 0,
    });
  };

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await getPendingPayrollApprovals();

      if (response.success) {
        setApprovals(response.data || []);
        await calculateFinanceStats(response.data || []);
      } else {
        throw new Error(response.message || "Failed to fetch approvals");
      }
    } catch (error) {
      console.error("Error fetching approvals:", error);
      toast.error("Failed to load payroll approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // Handle approval action
  const handleApproval = async (approvalId, action) => {
    try {
      setActionLoading(true);

      const response =
        action === "approve"
          ? await approvePayroll(approvalId, { comments: approvalComment })
          : await rejectPayroll(approvalId, { reason: rejectionReason });

      if (response.success) {
        toast.success(response.message || `Payroll ${action}ed successfully`);
        setShowModal(false);
        setShowRejectModal(false);
        setShowApproveModal(false);
        setRejectionReason("");
        setApprovalComment("");
        fetchApprovals(); // Refresh the list
      } else {
        throw new Error(response.message || `Failed to ${action} payroll`);
      }
    } catch (error) {
      console.error(`Error ${action}ing payroll:`, error);
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle process payroll action
  const handleProcessPayroll = async () => {
    try {
      setActionLoading(true);

      // Call the process payroll API
      const response = await fetch(
        `/api/payroll/process/${selectedApproval.approvalId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Payroll processed successfully");
        setShowProcessModal(false);
        fetchApprovals(); // Refresh the list
      } else {
        throw new Error(result.message || "Failed to process payroll");
      }
    } catch (error) {
      console.error("Error processing payroll:", error);
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_finance: {
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: ClockIcon,
        text: "Pending Finance Approval",
      },
      approved_finance: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: CheckCircleIcon,
        text: "Finance Approved - Pending HR",
      },
      approved_hr: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckBadgeIcon,
        text: "Ready for Processing",
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircleIcon,
        text: "Rejected",
      },
      processed: {
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: CheckBadgeIcon,
        text: "Processed",
      },
    };

    const config = statusConfig[status] || statusConfig.pending_finance;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  // Filter approvals based on current user role
  const getFilteredApprovals = () => {
    let filtered = approvals;

    // Filter by status
    if (filter !== "all") {
      filtered = filtered.filter((approval) => {
        switch (filter) {
          case "pending":
            return approval.approvalStatus === "pending_finance";
          case "approved":
            return approval.approvalStatus === "approved_finance";
          case "rejected":
            return approval.approvalStatus === "rejected";
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Image utility functions
  const getDefaultAvatar = () => {
    return defaultAvatar;
  };

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) return getDefaultAvatar();
    if (avatarPath.startsWith("http")) return avatarPath;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");
    return `${baseUrl}${avatarPath}`;
  };

  const getEmployeeAvatar = (employee) => {
    if (employee?.avatar) {
      return getImageUrl(employee.avatar);
    }
    return getDefaultAvatar();
  };

  const handleViewEmployeeDetails = (payroll) => {
    setSelectedEmployee(payroll);
    setIsEmployeeDetailModalOpen(true);
  };

  const filteredApprovals = getFilteredApprovals();

  const columns = [
    {
      header: "Period",
      accessor: "period",
      renderer: (approval) => (
        <div className="text-sm font-medium text-gray-900">
          {approval.period.monthName} {approval.period.year}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "approvalStatus",
      renderer: (approval) => getStatusBadge(approval.approvalStatus),
    },
    {
      header: "Total Net Pay",
      accessor: "financialSummary.totalNetPay",
      renderer: (approval) => (
        <div className="text-sm font-medium text-green-600">
          {formatCurrency(approval.financialSummary?.totalNetPay || 0)}
        </div>
      ),
    },
    {
      header: "Employees",
      accessor: "financialSummary.totalEmployees",
      renderer: (approval) => (
        <div className="text-sm text-gray-900">
          {approval.financialSummary?.totalEmployees || 0}
        </div>
      ),
    },
    {
      header: "Requested By",
      accessor: "requestedBy",
      renderer: (approval) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {approval.requestedBy?.firstName} {approval.requestedBy?.lastName}
          </div>
          <div className="text-sm text-gray-500">
            {approval.requestedBy?.department?.name}
          </div>
        </div>
      ),
    },
    {
      header: "Request Date",
      accessor: "createdAt",
      renderer: (approval) => (
        <div className="text-sm text-gray-900">
          {formatDate(approval.createdAt)}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Payroll Approval & Allocation
                </h1>
                <p className="mt-2 text-slate-600">
                  Review and approve payroll allocations for funding
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchApprovals}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50"
                >
                  <ArrowPathIcon
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Approval Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Pending Finance Approval Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg border border-amber-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                  <ClockIcon className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
                    Pending Finance
                  </p>
                  <p className="text-3xl font-bold text-amber-900">
                    {
                      approvals.filter(
                        (a) => a.approvalStatus === "pending_finance"
                      ).length
                    }
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Awaiting Finance HOD Review
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Finance Approved Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <CheckCircleIcon className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                    Finance Approved
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {
                      approvals.filter(
                        (a) => a.approvalStatus === "approved_finance"
                      ).length
                    }
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Ready for HR Review
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Ready for Processing Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <CheckBadgeIcon className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                    Ready for Processing
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {
                      approvals.filter(
                        (a) => a.approvalStatus === "approved_hr"
                      ).length
                    }
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    All Approvals Complete
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Rejected Card */}
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-lg border border-red-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                  <XCircleIcon className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                    Rejected
                  </p>
                  <p className="text-3xl font-bold text-red-900">
                    {
                      approvals.filter((a) => a.approvalStatus === "rejected")
                        .length
                    }
                  </p>
                  <p className="text-xs text-red-600 mt-1">Requires Revision</p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Finance Allocation Tracking */}
        <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              Payroll Finance Allocation Tracking
            </h2>
            <div className="p-3 bg-white rounded-lg shadow-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-[var(--elra-primary)]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-sm font-bold text-[var(--elra-primary)] mb-1">
                ELRA Wallet Balance
              </p>
              <p className="text-2xl font-black text-[var(--elra-primary)]">
                {formatCurrency(financeStats.remainingBudget)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Available for Payroll
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-sm font-bold text-blue-600 mb-1">
                Total Payroll Budget
              </p>
              <p className="text-2xl font-black text-blue-600">
                {formatCurrency(financeStats.totalBudget)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Allocated to Payroll</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-sm font-bold text-green-600 mb-1">
                Approved Payroll Amount
              </p>
              <p className="text-2xl font-black text-green-600">
                {formatCurrency(financeStats.allocatedAmount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Processed & Reserved</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-sm font-bold text-amber-600 mb-1">
                Pending Payroll Requests
              </p>
              <p className="text-2xl font-black text-amber-600">
                {formatCurrency(financeStats.pendingAllocations)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Awaiting Approval</p>
            </div>
          </div>

          {/* Payroll Budget Usage Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm font-bold text-white mb-2">
              <span>Payroll Budget Utilization</span>
              <span>
                {financeStats.totalBudget > 0
                  ? (
                      (financeStats.allocatedAmount /
                        financeStats.totalBudget) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{
                  width: `${
                    financeStats.totalBudget > 0
                      ? Math.min(
                          (financeStats.allocatedAmount /
                            financeStats.totalBudget) *
                            100,
                          100
                        )
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Payroll Approval Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">
              Filter payroll approvals by status:
            </span>
            <div className="flex gap-2">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "approved", label: "Approved" },
                { key: "rejected", label: "Rejected" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? "bg-[var(--elra-primary)] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payroll Approvals DataTable */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Payroll Approvals Summary
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Detailed breakdown of all payroll approval requests
            </p>
          </div>

          <DataTable
            data={filteredApprovals}
            columns={columns}
            loading={loading}
            emptyState={{
              icon: <DocumentTextIcon className="w-8 h-8 text-slate-400" />,
              title: "No payroll approvals found",
              description:
                "There are no payroll approval requests matching your current filter.",
            }}
            actions={{
              showEdit: false,
              showDelete: false,
              showToggle: false,
              customActions: (approval) => (
                <div className="flex flex-wrap items-center gap-2 w-24">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApproval(approval);
                      setShowModal(true);
                    }}
                    title="View Payroll Details"
                    className="bg-white text-[var(--elra-primary)] p-2 rounded-lg transition-colors duration-300 cursor-pointer shadow-sm hover:bg-[var(--elra-primary)] hover:text-white border border-[var(--elra-primary)]"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  {approval.approvalStatus === "pending_finance" &&
                    canApprove() && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApproval(approval);
                            setShowApproveModal(true);
                          }}
                          title="Approve Payroll"
                          disabled={actionLoading}
                          className="bg-white text-green-600 p-2 rounded-lg transition-colors duration-300 cursor-pointer disabled:opacity-50 shadow-sm hover:bg-green-600 hover:text-white border border-green-600"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApproval(approval);
                            setShowRejectModal(true);
                          }}
                          title="Reject Payroll"
                          className="bg-white text-red-600 p-2 rounded-lg transition-colors duration-300 cursor-pointer shadow-sm hover:bg-red-600 hover:text-white border border-red-600"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                </div>
              ),
            }}
            searchable={true}
            sortable={true}
            pagination={true}
            itemsPerPage={10}
          />
        </div>
      </div>

      {/* Approval Details Modal */}
      {showModal && selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl modal-shadow-enhanced max-w-7xl w-full max-h-[95vh] flex flex-col border border-gray-100 relative z-10">
            {/* ELRA Branded Header */}
            <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-8 rounded-t-2xl flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <DocumentTextIcon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Payroll Approval Details
                      </h2>
                      <p className="text-white/80 text-sm mt-1">
                        {selectedApproval.period?.monthName}{" "}
                        {selectedApproval.period?.year} -{" "}
                        {selectedApproval.financialSummary?.totalEmployees || 0}{" "}
                        employees
                      </p>
                      <p className="text-white/70 text-xs mt-1 font-mono">
                        Approval ID: {selectedApproval.approvalId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-300 font-medium border border-white/30 backdrop-blur-sm"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Basic Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CalendarDaysIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-blue-800">
                      Payroll Period
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {selectedApproval.period?.monthName}{" "}
                    {selectedApproval.period?.year}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CurrencyDollarIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-green-800">
                      Total Net Pay
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatCurrency(
                      selectedApproval.financialSummary?.totalNetPay || 0
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <UsersIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-purple-800">
                      Total Employees
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {selectedApproval.financialSummary?.totalEmployees || 0}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                      <ClockIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-amber-800">
                      Request Date
                    </span>
                  </div>
                  <div className="text-sm font-bold text-amber-900">
                    {formatDate(selectedApproval.createdAt)}
                  </div>
                </div>
              </div>

              {/* Status and Requester Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckBadgeIcon className="w-5 h-5 text-[var(--elra-primary)]" />
                    Approval Status
                  </h3>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(selectedApproval.approvalStatus)}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-[var(--elra-primary)]" />
                    Requested By
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={getEmployeeAvatar(selectedApproval.requestedBy)}
                        alt={`${selectedApproval.requestedBy?.firstName} ${selectedApproval.requestedBy?.lastName}`}
                        className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-white"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div
                        className="w-10 h-10 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md border-2 border-white"
                        style={{ display: "none" }}
                      >
                        {selectedApproval.requestedBy?.firstName?.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedApproval.requestedBy?.firstName}{" "}
                        {selectedApproval.requestedBy?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedApproval.requestedBy?.department?.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              {selectedApproval.financialSummary && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CurrencyDollarIcon className="w-6 h-6 text-[var(--elra-primary)]" />
                    Financial Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                          <CurrencyDollarIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-blue-800">
                          Total Gross Pay
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {formatCurrency(
                          selectedApproval.financialSummary.totalGrossPay || 0
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                          <XCircleIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-red-800">
                          Total Deductions
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-red-900">
                        {formatCurrency(
                          selectedApproval.financialSummary.totalDeductions || 0
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                          <CheckCircleIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-green-800">
                          Net Pay
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {formatCurrency(
                          selectedApproval.financialSummary.totalNetPay || 0
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <CurrencyDollarIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-purple-800">
                          Available Budget
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">
                        {formatCurrency(financeStats.remainingBudget)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scope-Based Aggregated Data */}
              {selectedApproval.payrollData &&
                selectedApproval.payrollData.payrolls && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <UsersIcon className="w-6 h-6 text-[var(--elra-primary)]" />
                      {selectedApproval.scope?.type === "company" &&
                        "Company-Wide Breakdown"}
                      {selectedApproval.scope?.type === "department" &&
                        "Department Breakdown"}
                      {selectedApproval.scope?.type === "individual" &&
                        "Individual Employee Summary"}
                    </h3>

                    {/* Department Breakdown for Company and Department Scopes */}
                    {(selectedApproval.scope?.type === "company" ||
                      selectedApproval.scope?.type === "department") && (
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800">
                            Department Breakdown
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {selectedApproval.scope?.type === "company"
                              ? "All departments included in this payroll"
                              : "Selected department(s) for this payroll"}
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Employees
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Gross Pay
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Deductions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Net Pay
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {(() => {
                                // Calculate department breakdown
                                const deptBreakdown = {};
                                selectedApproval.payrollData.payrolls.forEach(
                                  (payroll) => {
                                    const deptName =
                                      payroll.employee?.department?.name ||
                                      (typeof payroll.employee?.department ===
                                      "string"
                                        ? payroll.employee.department
                                        : "Unknown Department");
                                    if (!deptBreakdown[deptName]) {
                                      deptBreakdown[deptName] = {
                                        name: deptName,
                                        employeeCount: 0,
                                        grossPay: 0,
                                        deductions: 0,
                                        netPay: 0,
                                      };
                                    }
                                    deptBreakdown[deptName].employeeCount++;
                                    deptBreakdown[deptName].grossPay +=
                                      payroll.summary?.grossPay || 0;
                                    deptBreakdown[deptName].deductions +=
                                      payroll.summary?.totalDeductions || 0;
                                    deptBreakdown[deptName].netPay +=
                                      payroll.summary?.netPay || 0;
                                  }
                                );

                                return Object.values(deptBreakdown).map(
                                  (dept, index) => (
                                    <tr
                                      key={index}
                                      className="hover:bg-gray-50 transition-colors"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <div className="w-8 h-8 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                            {dept.name.charAt(0)}
                                          </div>
                                          <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">
                                              {dept.name}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                          {dept.employeeCount}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-green-600">
                                          {formatCurrency(dept.grossPay)}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-red-600">
                                          {formatCurrency(dept.deductions)}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-[var(--elra-primary)]">
                                          {formatCurrency(dept.netPay)}
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Individual Employee Summary for Individual Scope */}
                    {selectedApproval.scope?.type === "individual" && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <UsersIcon className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-800">
                                Total Employees
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-blue-900">
                              {selectedApproval.payrollData.payrolls.length}
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                              <span className="text-sm font-semibold text-green-800">
                                Total Gross Pay
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-green-900">
                              {formatCurrency(
                                selectedApproval.payrollData.payrolls.reduce(
                                  (sum, p) => sum + (p.summary?.grossPay || 0),
                                  0
                                )
                              )}
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircleIcon className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-semibold text-purple-800">
                                Total Net Pay
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-purple-900">
                              {formatCurrency(
                                selectedApproval.payrollData.payrolls.reduce(
                                  (sum, p) => sum + (p.summary?.netPay || 0),
                                  0
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* Comprehensive Financial Breakdown */}
              {selectedApproval.payrollData?.breakdown?.aggregatedData && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CurrencyDollarIcon className="w-6 h-6 text-[var(--elra-primary)]" />
                    Detailed Financial Analysis
                  </h3>

                  {/* Detailed Aggregated Data */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Income Breakdown */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-green-50 border-b border-green-200">
                        <h4 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                          <CurrencyDollarIcon className="w-5 h-5" />
                          Income Breakdown
                        </h4>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">
                            Basic Salary
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              selectedApproval.payrollData.breakdown
                                .aggregatedData.totalBasicSalary || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">
                            Grade Allowances
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              selectedApproval.payrollData.breakdown
                                .aggregatedData.totalGradeAllowances || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">
                            Personal Allowances
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              selectedApproval.payrollData.breakdown
                                .aggregatedData.totalPersonalAllowances || 0
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 border-b border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Taxable Portion
                            </span>
                            <span className="text-xs font-semibold text-gray-700">
                              {formatCurrency(
                                selectedApproval.payrollData.breakdown
                                  .aggregatedData
                                  .totalPersonalAllowancesTaxable || 0
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Non‑Taxable Portion
                            </span>
                            <span className="text-xs font-semibold text-gray-700">
                              {formatCurrency(
                                selectedApproval.payrollData.breakdown
                                  .aggregatedData
                                  .totalPersonalAllowancesNonTaxable || 0
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">
                            Personal Bonuses
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              selectedApproval.payrollData.breakdown
                                .aggregatedData.totalPersonalBonuses || 0
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 border-b border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Taxable Portion
                            </span>
                            <span className="text-xs font-semibold text-gray-700">
                              {formatCurrency(
                                selectedApproval.payrollData.breakdown
                                  .aggregatedData.totalPersonalBonusesTaxable ||
                                  0
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Non‑Taxable Portion
                            </span>
                            <span className="text-xs font-semibold text-gray-700">
                              {formatCurrency(
                                selectedApproval.payrollData.breakdown
                                  .aggregatedData
                                  .totalPersonalBonusesNonTaxable || 0
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
                          <span className="text-base font-bold text-green-800">
                            Total Gross Pay
                          </span>
                          <span className="text-lg font-bold text-green-900">
                            {formatCurrency(
                              selectedApproval.payrollData.breakdown
                                .aggregatedData.totalGrossPay || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions Breakdown */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                        <h4 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                          <CurrencyDollarIcon className="w-5 h-5" />
                          Deductions Breakdown
                        </h4>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">
                            PAYE Tax
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              selectedApproval.payrollData.breakdown
                                .aggregatedData.totalPAYE || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">
                            Statutory Deductions
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              selectedApproval.payrollData.breakdown
                                .aggregatedData.totalDeductionsStatutory || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">
                            Voluntary Deductions
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              selectedApproval.payrollData.breakdown
                                .aggregatedData.totalDeductionsVoluntary || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-4">
                          <span className="text-base font-bold text-red-800">
                            Total Deductions
                          </span>
                          <span className="text-lg font-bold text-red-900">
                            {formatCurrency(
                              selectedApproval.payrollData.breakdown
                                .aggregatedData.totalDeductions || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tax Information */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5" />
                        Tax Information
                      </h4>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-900">
                            {formatCurrency(
                              selectedApproval.payrollData.breakdown
                                .aggregatedData.totalTaxableIncome || 0
                            )}
                          </div>
                          <div className="text-sm text-blue-700 font-medium">
                            Total Taxable Income
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-900">
                            {formatCurrency(
                              selectedApproval.payrollData.breakdown
                                .aggregatedData.totalPAYE || 0
                            )}
                          </div>
                          <div className="text-sm text-blue-700 font-medium">
                            Total PAYE Tax
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-900">
                            {formatCurrency(
                              selectedApproval.payrollData.breakdown
                                .aggregatedData.totalNetPay || 0
                            )}
                          </div>
                          <div className="text-sm text-blue-700 font-medium">
                            Total Net Pay
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payroll Data Details */}
              {selectedApproval.payrollData &&
                selectedApproval.payrollData.payrolls && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <UsersIcon className="w-6 h-6 text-[var(--elra-primary)]" />
                      Employee Payroll Details (
                      {selectedApproval.payrollData.payrolls.length} employees)
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
                            {selectedApproval.payrollData.payrolls.map(
                              (payroll, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                                  onClick={() =>
                                    handleViewEmployeeDetails(payroll)
                                  }
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <img
                                          src={getEmployeeAvatar(
                                            payroll.employee
                                          )}
                                          alt={
                                            payroll.employee?.name || "Employee"
                                          }
                                          className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                          onError={(e) => {
                                            e.target.src = getDefaultAvatar();
                                          }}
                                        />
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
                                      {payroll.employee.department?.name ||
                                        (typeof payroll.employee.department ===
                                        "string"
                                          ? payroll.employee.department
                                          : "N/A")}
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewEmployeeDetails(payroll);
                                      }}
                                      className="text-[var(--elra-primary)] hover:text-white p-2 rounded-lg hover:bg-[var(--elra-primary)] transition-all duration-200 cursor-pointer"
                                      title="View employee details"
                                    >
                                      <EyeIcon className="w-5 h-5" />
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

              {/* Budget Impact Analysis */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CurrencyDollarIcon className="w-6 h-6 text-[var(--elra-primary)]" />
                  Budget Impact Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <CurrencyDollarIcon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-blue-800">
                        Budget Impact
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">
                          Required Amount:
                        </span>
                        <span className="text-sm font-bold text-blue-900">
                          {formatCurrency(
                            selectedApproval.financialSummary?.totalNetPay || 0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">
                          Available Budget:
                        </span>
                        <span className="text-sm font-bold text-blue-900">
                          {formatCurrency(financeStats.remainingBudget)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">
                          Remaining After Approval:
                        </span>
                        <span className="text-sm font-bold text-blue-900">
                          {formatCurrency(
                            financeStats.remainingBudget -
                              (selectedApproval.financialSummary?.totalNetPay ||
                                0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                        <CheckCircleIcon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-green-800">
                        Allocation Impact
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm text-green-700">
                        <p className="mb-2">
                          This approval will <strong>reserve</strong> the
                          required amount from the ELRA wallet for payroll
                          processing.
                        </p>
                        <p className="mb-2">
                          Funds will move from <strong>available</strong> to{" "}
                          <strong>reserved</strong> in the payroll budget
                          category.
                        </p>
                        <p>
                          After approval, the payroll will be ready for HR
                          review and final processing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval History */}
              {selectedApproval.financeApproval?.status === "approved" && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Finance Approval
                  </h4>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span className="text-blue-900">
                      Approved by{" "}
                      {selectedApproval.financeApproval.approvedBy?.firstName}{" "}
                      {selectedApproval.financeApproval.approvedBy?.lastName}
                    </span>
                    <span className="text-blue-600">
                      on{" "}
                      {formatDate(selectedApproval.financeApproval.approvedAt)}
                    </span>
                  </div>
                  {selectedApproval.financeApproval.comments && (
                    <p className="text-blue-800 mt-2 text-sm">
                      {selectedApproval.financeApproval.comments}
                    </p>
                  )}
                </div>
              )}

              {selectedApproval.hrApproval?.status === "approved" && (
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-900 mb-2">
                    HR Approval
                  </h4>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span className="text-green-900">
                      Approved by{" "}
                      {selectedApproval.hrApproval.approvedBy?.firstName}{" "}
                      {selectedApproval.hrApproval.approvedBy?.lastName}
                    </span>
                    <span className="text-green-600">
                      on {formatDate(selectedApproval.hrApproval.approvedAt)}
                    </span>
                  </div>
                  {selectedApproval.hrApproval.comments && (
                    <p className="text-green-800 mt-2 text-sm">
                      {selectedApproval.hrApproval.comments}
                    </p>
                  )}
                </div>
              )}

              {selectedApproval.rejectionReason && (
                <div className="bg-red-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-red-900 mb-2">
                    Rejection Reason
                  </h4>
                  <p className="text-red-800">
                    {selectedApproval.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium border border-gray-300 shadow-sm"
                >
                  Close
                </button>

                {/* Removed redundant approve/reject buttons as they exist in the main UI */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApproveModal && selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm"></div>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full relative z-10">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg shadow-md">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-green-900">
                  Approve Payroll Request
                </h2>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckBadgeIcon className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">
                      Approval Confirmation
                    </h4>
                    <p className="text-green-700 text-sm">
                      You are about to approve a payroll request for{" "}
                      {formatCurrency(
                        selectedApproval.financialSummary?.totalNetPay || 0
                      )}
                      . This will allocate funds from the ELRA wallet for
                      payroll processing.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Approval Comments (Optional)
                </label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Add any comments about this approval..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setApprovalComment("");
                  }}
                  className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={() =>
                    handleApproval(selectedApproval.approvalId, "approve")
                  }
                  disabled={actionLoading}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Confirm Approval</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm"></div>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full relative z-10">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg shadow-md">
                  <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-red-900">
                  Reject Payroll Approval
                </h2>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-red-50 rounded-lg p-4 mb-4 border border-red-200">
                <div className="flex items-start gap-3">
                  <XCircleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1">
                      Rejection Notice
                    </h4>
                    <p className="text-red-700 text-sm">
                      You are about to reject a payroll request for{" "}
                      {formatCurrency(
                        selectedApproval.financialSummary?.totalNetPay || 0
                      )}
                      . Please provide a clear reason for the rejection.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter the reason for rejection..."
                  required
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={() =>
                    handleApproval(selectedApproval.approvalId, "reject")
                  }
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-5 h-5" />
                      <span>Confirm Rejection</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Payroll Modal */}
      {showProcessModal && selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm"></div>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full relative z-10">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-emerald-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg shadow-md">
                  <PlayIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-emerald-900">
                  Process Payroll
                </h2>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-800">
                      Ready to Process
                    </span>
                  </div>
                  <p className="text-sm text-emerald-700">
                    This payroll has been approved by both Finance and HR.
                    Processing will deduct funds from the ELRA Wallet and
                    generate payslips for all employees.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Period:</span>
                    <span className="font-semibold">
                      {selectedApproval.period?.monthName}{" "}
                      {selectedApproval.period?.year}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Employees:</span>
                    <span className="font-semibold">
                      {selectedApproval.financialSummary?.totalEmployees || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Net Pay:</span>
                    <span className="font-semibold text-emerald-600">
                      ₦
                      {selectedApproval.financialSummary?.totalNetPay?.toLocaleString() ||
                        0}
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-amber-800">
                      Important
                    </span>
                  </div>
                  <p className="text-sm text-amber-700">
                    This action cannot be undone. Make sure all approvals are
                    correct before processing.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleProcessPayroll}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      <span>Process Payroll</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {isEmployeeDetailModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsEmployeeDetailModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
                    aria-label="Back to payroll overview"
                    title="Back"
                  >
                    <ArrowLeftIcon className="w-6 h-6" />
                  </button>
                  <img
                    src={getEmployeeAvatar(selectedEmployee.employee)}
                    alt={`${selectedEmployee.employee?.firstName} ${selectedEmployee.employee?.lastName}`}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                    onError={(e) => {
                      e.target.src = getDefaultAvatar();
                    }}
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedEmployee.employee?.firstName}{" "}
                      {selectedEmployee.employee?.lastName}
                    </h2>
                    <p className="text-gray-600">
                      {selectedEmployee.employee?.employeeId} •{" "}
                      {selectedEmployee.employee?.department?.name || "N/A"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEmployeeDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-8 h-8" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CurrencyDollarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-blue-800">
                        Base Salary
                      </h4>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-900">
                    {formatCurrency(
                      selectedEmployee.baseSalary?.effectiveBaseSalary || 0
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CurrencyDollarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-green-800">
                        Gross Pay
                      </h4>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-900">
                    {formatCurrency(selectedEmployee.summary?.grossPay || 0)}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CurrencyDollarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-red-800">
                        Deductions
                      </h4>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-red-900">
                    {formatCurrency(
                      selectedEmployee.summary?.totalDeductions || 0
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-purple-800">
                        Net Pay
                      </h4>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-900">
                    {formatCurrency(selectedEmployee.summary?.netPay || 0)}
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Allowances */}
                {selectedEmployee.allowances?.items &&
                  selectedEmployee.allowances.items.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                        Personal Allowances
                      </h3>
                      <div className="space-y-3">
                        {selectedEmployee.allowances.items.map(
                          (allowance, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center py-2 border-b border-gray-100"
                            >
                              <span className="text-sm text-gray-600">
                                {allowance.name}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(allowance.amount)}
                              </span>
                            </div>
                          )
                        )}
                        <div className="flex justify-between items-center py-2 bg-green-50 rounded-lg px-4">
                          <span className="text-base font-bold text-green-800">
                            Total Allowances
                          </span>
                          <span className="text-lg font-bold text-green-900">
                            {formatCurrency(
                              selectedEmployee.allowances?.total || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Bonuses */}
                {selectedEmployee.bonuses?.items &&
                  selectedEmployee.bonuses.items.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-yellow-600" />
                        Personal Bonuses
                      </h3>
                      <div className="space-y-3">
                        {selectedEmployee.bonuses.items.map((bonus, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center py-2 border-b border-gray-100"
                          >
                            <span className="text-sm text-gray-600">
                              {bonus.name}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(bonus.amount)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center py-2 bg-yellow-50 rounded-lg px-4">
                          <span className="text-base font-bold text-yellow-800">
                            Total Bonuses
                          </span>
                          <span className="text-lg font-bold text-yellow-900">
                            {formatCurrency(
                              selectedEmployee.bonuses?.total || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Deductions */}
                {selectedEmployee.deductions?.items &&
                  selectedEmployee.deductions.items.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-red-600" />
                        Deductions
                      </h3>
                      <div className="space-y-3">
                        {selectedEmployee.deductions.items.map(
                          (deduction, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center py-2 border-b border-gray-100"
                            >
                              <span className="text-sm text-gray-600">
                                {deduction.name}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(deduction.amount)}
                              </span>
                            </div>
                          )
                        )}
                        <div className="flex justify-between items-center py-2 bg-red-50 rounded-lg px-4">
                          <span className="text-base font-bold text-red-800">
                            Total Deductions
                          </span>
                          <span className="text-lg font-bold text-red-900">
                            {formatCurrency(
                              selectedEmployee.deductions?.total || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Tax Information */}
                {selectedEmployee.taxBreakdown && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                      Tax Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">
                          Taxable Income
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(
                            selectedEmployee.summary?.taxableIncome || 0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">PAYE Tax</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(
                            selectedEmployee.deductions?.paye || 0
                          )}
                        </span>
                      </div>
                      {selectedEmployee.taxBreakdown?.taxRate && (
                        <div className="flex justify-between items-center py-2 bg-blue-50 rounded-lg px-4">
                          <span className="text-sm font-bold text-blue-800">
                            Effective Tax Rate
                          </span>
                          <span className="text-sm font-bold text-blue-900">
                            {selectedEmployee.taxBreakdown.taxRate}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-4 rounded-b-2xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsEmployeeDetailModalOpen(false)}
                  className="px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl hover:bg-[var(--elra-primary-dark)] transition-all duration-300 font-medium shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollApprovals;
