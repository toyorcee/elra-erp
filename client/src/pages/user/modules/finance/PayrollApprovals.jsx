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
  const [filter, setFilter] = useState("all");
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
            monthlyLimit: 0, // No monthly limits in new system
          };
        }

        // Fallback to total funds if budget categories not set
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

  // Fetch pending approvals
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
          ? await approvePayroll(approvalId)
          : await rejectPayroll(approvalId, { reason: rejectionReason });

      if (response.success) {
        toast.success(response.message || `Payroll ${action}ed successfully`);
        setShowModal(false);
        setShowRejectModal(false);
        setRejectionReason("");
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

  const filteredApprovals = getFilteredApprovals();

  // DataTable columns configuration
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
                Total Payroll Budget
              </p>
              <p className="text-2xl font-black text-[var(--elra-primary)]">
                {formatCurrency(financeStats.totalBudget)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-sm font-bold text-green-600 mb-1">
                Approved Payroll Amount
              </p>
              <p className="text-2xl font-black text-green-600">
                {formatCurrency(financeStats.allocatedAmount)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-sm font-bold text-blue-600 mb-1">
                Available Payroll Budget
              </p>
              <p className="text-2xl font-black text-blue-600">
                {formatCurrency(financeStats.remainingBudget)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-sm font-bold text-amber-600 mb-1">
                Pending Payroll Requests
              </p>
              <p className="text-2xl font-black text-amber-600">
                {formatCurrency(financeStats.pendingAllocations)}
              </p>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApproval(approval);
                      setShowModal(true);
                    }}
                    title="View Details"
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  {approval.approvalStatus === "pending_finance" &&
                    canApprove() && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproval(approval._id, "approve");
                          }}
                          title="Approve"
                          disabled={actionLoading}
                          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApproval(approval);
                            setShowRejectModal(true);
                          }}
                          title="Reject"
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <XCircleIcon className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  Payroll Approval Details
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Period
                    </label>
                    <p className="text-lg font-semibold text-slate-900">
                      {selectedApproval.period.monthName}{" "}
                      {selectedApproval.period.year}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Status
                    </label>
                    {getStatusBadge(selectedApproval.approvalStatus)}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Requested By
                    </label>
                    <p className="text-slate-900">
                      {selectedApproval.requestedBy?.firstName}{" "}
                      {selectedApproval.requestedBy?.lastName}
                    </p>
                    <p className="text-sm text-slate-600">
                      {selectedApproval.requestedBy?.department?.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Total Net Pay
                    </label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        selectedApproval.financialSummary?.totalNetPay || 0
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Number of Employees
                    </label>
                    <p className="text-xl font-semibold text-slate-900">
                      {selectedApproval.financialSummary?.totalEmployees || 0}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Request Date
                    </label>
                    <p className="text-slate-900">
                      {formatDate(selectedApproval.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              {selectedApproval.financialSummary && (
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Financial Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-slate-600">Total Gross Pay</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatCurrency(
                          selectedApproval.financialSummary.totalGrossPay || 0
                        )}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600">Total Deductions</p>
                      <p className="text-lg font-semibold text-red-600">
                        {formatCurrency(
                          selectedApproval.financialSummary.totalDeductions || 0
                        )}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600">Total Net Pay</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(
                          selectedApproval.financialSummary.totalNetPay || 0
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval History */}
              {selectedApproval.financeApproval && (
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

              {selectedApproval.hrApproval && (
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

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Close
                </button>

                {selectedApproval.approvalStatus === "pending_finance" && (
                  <>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        handleApproval(selectedApproval._id, "approve");
                      }}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Approve Payroll
                    </button>

                    <button
                      onClick={() => {
                        setShowModal(false);
                        setShowRejectModal(true);
                      }}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject Payroll
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Reject Payroll Approval
                </h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-slate-600 mb-4">
                Please provide a reason for rejecting this payroll approval
                request.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  placeholder="Enter the reason for rejection..."
                  required
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
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
                  onClick={() => handleApproval(selectedApproval._id, "reject")}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Reject Payroll
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
