import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";
import {
  legalPolicyAPI,
  legalComplianceAPI,
  legalComplianceProgramAPI,
} from "../../../../services/legalAPI";

const LegalDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch policies, compliance programs, and compliance items data
      const [policiesData, complianceProgramsData, complianceData] =
        await Promise.all([
          legalPolicyAPI.getPolicies(),
          legalComplianceProgramAPI.getCompliancePrograms(),
          legalComplianceAPI.getComplianceItems(),
        ]);

      // Process dashboard data
      const policies = policiesData.success
        ? policiesData.data.policies || []
        : [];
      const compliancePrograms = complianceProgramsData.success
        ? complianceProgramsData.data.compliancePrograms || []
        : [];
      const complianceItems = complianceData.success
        ? complianceData.data.complianceItems || []
        : [];

      const policyStats = {
        total: policies.length,
        active: policies.filter((p) => p.status === "Active").length,
        draft: policies.filter((p) => p.status === "Draft").length,
        underReview: policies.filter((p) => p.status === "Under Review").length,
        inactive: policies.filter((p) => p.status === "Inactive").length,
      };

      const complianceProgramStats = {
        total: compliancePrograms.length,
        active: compliancePrograms.filter((p) => p.status === "Active").length,
        draft: compliancePrograms.filter((p) => p.status === "Draft").length,
        underReview: compliancePrograms.filter(
          (p) => p.status === "Under Review"
        ).length,
        inactive: compliancePrograms.filter((p) => p.status === "Inactive")
          .length,
      };

      const complianceStats = {
        total: complianceItems.length,
        compliant: complianceItems.filter((c) => c.status === "Compliant")
          .length,
        nonCompliant: complianceItems.filter(
          (c) => c.status === "Non-Compliant"
        ).length,
        underReview: complianceItems.filter((c) => c.status === "Under Review")
          .length,
        pending: complianceItems.filter((c) => c.status === "Pending").length,
      };

      // Calculate priority breakdown
      const priorityBreakdown = {
        critical: complianceItems.filter((c) => c.priority === "Critical")
          .length,
        high: complianceItems.filter((c) => c.priority === "High").length,
        medium: complianceItems.filter((c) => c.priority === "Medium").length,
        low: complianceItems.filter((c) => c.priority === "Low").length,
      };

      // Recent activities
      const recentPolicies = policies
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      const recentCompliancePrograms = compliancePrograms
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      const recentCompliance = complianceItems
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setDashboardData({
        policyStats,
        complianceProgramStats,
        complianceStats,
        priorityBreakdown,
        recentPolicies,
        recentCompliancePrograms,
        recentCompliance,
        totalItems:
          policyStats.total +
          complianceProgramStats.total +
          complianceStats.total,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Legal & Compliance Dashboard
        </h1>
        <p className="text-white/80">
          Comprehensive overview of legal policies and compliance management
        </p>
      </div>

      {/* Combined Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Policies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Total Policies
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2">
                {dashboardData.policyStats.total}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <DocumentTextIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Total Compliance Programs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                Compliance Programs
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2">
                {dashboardData.complianceProgramStats.total}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Total Compliance Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                Compliance Items
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2">
                {dashboardData.complianceStats.total}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <ClipboardDocumentListIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Active Policies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Active Policies
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2">
                {dashboardData.policyStats.active}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Compliant Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                Compliant Items
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-2">
                {dashboardData.complianceStats.compliant}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Policy Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <DocumentTextIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Policy Status Overview
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.policyStats.active}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardData.policyStats.draft}
            </div>
            <div className="text-sm text-gray-600">Draft</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.policyStats.underReview}
            </div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {dashboardData.policyStats.inactive}
            </div>
            <div className="text-sm text-gray-600">Inactive</div>
          </div>
        </div>
      </motion.div>

      {/* Compliance Programs Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
            <ShieldCheckIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Compliance Programs Status Overview
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.complianceProgramStats.active}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardData.complianceProgramStats.draft}
            </div>
            <div className="text-sm text-gray-600">Draft</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.complianceProgramStats.underReview}
            </div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {dashboardData.complianceProgramStats.inactive}
            </div>
            <div className="text-sm text-gray-600">Inactive</div>
          </div>
        </div>
      </motion.div>

      {/* Compliance Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
            <ShieldCheckIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Compliance Status Overview
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.complianceStats.compliant}
            </div>
            <div className="text-sm text-gray-600">Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {dashboardData.complianceStats.nonCompliant}
            </div>
            <div className="text-sm text-gray-600">Non-Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.complianceStats.underReview}
            </div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardData.complianceStats.pending}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </motion.div>

      {/* Priority Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
            <ExclamationTriangleIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Compliance Priority Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {dashboardData.priorityBreakdown.critical}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {dashboardData.priorityBreakdown.high}
            </div>
            <div className="text-sm text-gray-600">High</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardData.priorityBreakdown.medium}
            </div>
            <div className="text-sm text-gray-600">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.priorityBreakdown.low}
            </div>
            <div className="text-sm text-gray-600">Low</div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Policies */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Recent Policies</h3>
          </div>

          <div className="space-y-4">
            {dashboardData.recentPolicies.length > 0 ? (
              dashboardData.recentPolicies.map((policy) => (
                <div
                  key={policy._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <DocumentTextIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {policy.title}
                      </p>
                      <p className="text-sm text-gray-500">{policy.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        policy.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : policy.status === "Draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : policy.status === "Under Review"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {policy.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(policy.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent policies found</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Compliance Programs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Recent Programs</h3>
          </div>

          <div className="space-y-4">
            {dashboardData.recentCompliancePrograms.length > 0 ? (
              dashboardData.recentCompliancePrograms.map((program) => (
                <div
                  key={program._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                      <ShieldCheckIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {program.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {program.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        program.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : program.status === "Draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : program.status === "Under Review"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {program.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(program.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent programs found</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Compliance Items */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Recent Compliance Items
            </h3>
          </div>

          <div className="space-y-4">
            {dashboardData.recentCompliance.length > 0 ? (
              dashboardData.recentCompliance.map((compliance) => (
                <div
                  key={compliance._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                      <ClipboardDocumentListIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {compliance.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {compliance.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        compliance.status === "Compliant"
                          ? "bg-green-100 text-green-800"
                          : compliance.status === "Non-Compliant"
                          ? "bg-red-100 text-red-800"
                          : compliance.status === "Under Review"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {compliance.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(compliance.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No recent compliance items found
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      {user?.role?.level >= 700 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/dashboard/modules/legal/policies"
              className="flex items-center space-x-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              <div className="p-3 bg-blue-500 rounded-xl">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Manage Policies</h4>
                <p className="text-sm text-gray-600">
                  Create and manage legal policies
                </p>
              </div>
            </Link>
            <Link
              to="/dashboard/modules/legal/compliance-programs"
              className="flex items-center space-x-4 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
            >
              <div className="p-3 bg-green-500 rounded-xl">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  Manage Compliance Programs
                </h4>
                <p className="text-sm text-gray-600">
                  Create and manage compliance frameworks
                </p>
              </div>
            </Link>
            <Link
              to="/dashboard/modules/legal/compliance-items"
              className="flex items-center space-x-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
            >
              <div className="p-3 bg-purple-500 rounded-xl">
                <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  Manage Compliance Items
                </h4>
                <p className="text-sm text-gray-600">
                  Create and track compliance requirements
                </p>
              </div>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LegalDashboard;
