import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BuildingOfficeIcon,
  UserIcon,
  CreditCardIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  getAllSubscriptions,
  getSubscriptionStatistics,
  cancelSubscription,
  createTrialSubscription,
} from "../../services/subscriptions";
import { formatPrice } from "../../utils/priceUtils";

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("view");
  const [filters, setFilters] = useState({
    status: "",
    plan: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Fetch subscriptions and statistics
  useEffect(() => {
    fetchData();
  }, [pagination.page, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch subscriptions with filters
      const subscriptionParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const [subscriptionsRes, statsRes] = await Promise.all([
        getAllSubscriptions(subscriptionParams),
        getSubscriptionStatistics(),
      ]);

      if (subscriptionsRes.success) {
        setSubscriptions(subscriptionsRes.data.subscriptions);
        setPagination((prev) => ({
          ...prev,
          total: subscriptionsRes.data.pagination.total,
        }));
      }

      if (statsRes.success) {
        setStatistics(statsRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSubscriptionAction = async (
    subscriptionId,
    action,
    data = {}
  ) => {
    try {
      let response;

      switch (action) {
        case "cancel":
          response = await cancelSubscription(subscriptionId);
          break;
        case "trial":
          response = await createTrialSubscription({
            companyId: data.companyId,
            plan: data.plan,
            trialDays: data.trialDays || 7,
          });
          break;
        default:
          return;
      }

      if (response.success) {
        fetchData(); // Refresh data
        setShowModal(false);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-400/10";
      case "trial":
        return "text-blue-400 bg-blue-400/10";
      case "suspended":
        return "text-yellow-400 bg-yellow-400/10";
      case "cancelled":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const formatCurrency = (amount, currency) => {
    return formatPrice(amount, currency);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
          <p className="text-white/70">
            Manage all company subscriptions, pricing, and billing
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Subscriptions</p>
                <p className="text-2xl font-bold">
                  {statistics.totalSubscriptions || 0}
                </p>
              </div>
              <BuildingOfficeIcon className="w-8 h-8 text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Active Subscriptions</p>
                <p className="text-2xl font-bold text-green-400">
                  {statistics.activeSubscriptions || 0}
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Trial Subscriptions</p>
                <p className="text-2xl font-bold text-blue-400">
                  {statistics.trialSubscriptions || 0}
                </p>
              </div>
              <CalendarIcon className="w-8 h-8 text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Monthly Revenue</p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatCurrency(statistics.monthlyRevenue || 0, "USD")}
                </p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-purple-400" />
            </div>
          </motion.div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Plan Filter */}
              <select
                value={filters.plan}
                onChange={(e) => handleFilterChange("plan", e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
              >
                <option value="">All Plans</option>
                <option value="starter">Starter</option>
                <option value="business">Business</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/60">Loading subscriptions...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/80">
                        Company
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/80">
                        Plan
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/80">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/80">
                        Billing
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/80">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/80">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/80">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {subscriptions.map((subscription) => (
                      <tr
                        key={subscription._id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">
                              {subscription.company?.name}
                            </p>
                            <p className="text-sm text-white/60">
                              {subscription.company?.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">
                              {subscription.plan.displayName}
                            </p>
                            <p className="text-sm text-white/60 capitalize">
                              {subscription.billingCycle}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              subscription.status
                            )}`}
                          >
                            {subscription.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p>{subscription.payment.provider}</p>
                            <p className="text-white/60">
                              {subscription.payment.status}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {subscription.payment.currency === "NGN" ? (
                              <CurrencyDollarIcon className="w-4 h-4 text-green-400" />
                            ) : (
                              <CurrencyDollarIcon className="w-4 h-4 text-green-400" />
                            )}
                            <span className="font-medium">
                              {formatCurrency(
                                subscription.payment.amount,
                                subscription.payment.currency
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-white/60">
                          {formatDate(subscription.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setModalType("view");
                                setShowModal(true);
                              }}
                              className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {subscription.status === "active" && (
                              <button
                                onClick={() =>
                                  handleSubscriptionAction(
                                    subscription._id,
                                    "cancel"
                                  )
                                }
                                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                title="Cancel Subscription"
                              >
                                <XCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="px-6 py-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/60">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}{" "}
                      of {pagination.total} results
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={
                          pagination.page * pagination.limit >= pagination.total
                        }
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Subscription Detail Modal */}
      <AnimatePresence>
        {showModal && selectedSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Subscription Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Company Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <BuildingOfficeIcon className="w-5 h-5 mr-2 text-blue-400" />
                    Company Information
                  </h3>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p>
                      <strong>Name:</strong>{" "}
                      {selectedSubscription.company?.name}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {selectedSubscription.company?.email}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {selectedSubscription.company?.status}
                    </p>
                  </div>
                </div>

                {/* Subscription Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <CreditCardIcon className="w-5 h-5 mr-2 text-green-400" />
                    Subscription Details
                  </h3>
                  <div className="bg-white/5 rounded-lg p-4 space-y-2">
                    <p>
                      <strong>Plan:</strong>{" "}
                      {selectedSubscription.plan.displayName}
                    </p>
                    <p>
                      <strong>Billing Cycle:</strong>{" "}
                      {selectedSubscription.billingCycle}
                    </p>
                    <p>
                      <strong>Status:</strong> {selectedSubscription.status}
                    </p>
                    <p>
                      <strong>Amount:</strong>{" "}
                      {formatCurrency(
                        selectedSubscription.payment.amount,
                        selectedSubscription.payment.currency
                      )}
                    </p>
                    <p>
                      <strong>Payment Provider:</strong>{" "}
                      {selectedSubscription.payment.provider}
                    </p>
                    <p>
                      <strong>Payment Status:</strong>{" "}
                      {selectedSubscription.payment.status}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {formatDate(selectedSubscription.createdAt)}
                    </p>
                    {selectedSubscription.startDate && (
                      <p>
                        <strong>Start Date:</strong>{" "}
                        {formatDate(selectedSubscription.startDate)}
                      </p>
                    )}
                    {selectedSubscription.trialEndDate && (
                      <p>
                        <strong>Trial Ends:</strong>{" "}
                        {formatDate(selectedSubscription.trialEndDate)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Plan Features</h3>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <p>
                        <strong>Max Users:</strong>{" "}
                        {selectedSubscription.plan.features.maxUsers === -1
                          ? "Unlimited"
                          : selectedSubscription.plan.features.maxUsers}
                      </p>
                      <p>
                        <strong>Max Storage:</strong>{" "}
                        {selectedSubscription.plan.features.maxStorage}GB
                      </p>
                      <p>
                        <strong>Max Departments:</strong>{" "}
                        {selectedSubscription.plan.features.maxDepartments ===
                        -1
                          ? "Unlimited"
                          : selectedSubscription.plan.features.maxDepartments}
                      </p>
                      <p>
                        <strong>Custom Workflows:</strong>{" "}
                        {selectedSubscription.plan.features.customWorkflows
                          ? "Yes"
                          : "No"}
                      </p>
                      <p>
                        <strong>Advanced Analytics:</strong>{" "}
                        {selectedSubscription.plan.features.advancedAnalytics
                          ? "Yes"
                          : "No"}
                      </p>
                      <p>
                        <strong>Priority Support:</strong>{" "}
                        {selectedSubscription.plan.features.prioritySupport
                          ? "Yes"
                          : "No"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/20">
                  {selectedSubscription.status === "active" && (
                    <button
                      onClick={() =>
                        handleSubscriptionAction(
                          selectedSubscription._id,
                          "cancel"
                        )
                      }
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionManagement;
