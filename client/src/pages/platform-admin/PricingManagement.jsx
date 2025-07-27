import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CurrencyDollarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CloudIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  getSubscriptionPlans,
  updateSubscriptionPlan,
} from "../../services/subscriptions";
import api from "../../services/api";

const PricingManagement = () => {
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [systemSettings, setSystemSettings] = useState({});
  const [conversionRate, setConversionRate] = useState(1500);
  const [showConversionModal, setShowConversionModal] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchSystemSettings();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getSubscriptionPlans();
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const response = await api.get("/system-settings");
      if (response.data.success) {
        setSystemSettings(response.data.data);
        setConversionRate(response.data.data.currency?.usdToNgnRate || 1500);
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
    }
  };

  const updateConversionRate = async () => {
    try {
      setLoading(true);
      const response = await api.put("/system-settings", {
        currency: {
          usdToNgnRate: conversionRate,
          lastConversionRateUpdate: new Date().toISOString(),
        },
      });

      if (response.data.success) {
        setSystemSettings(response.data.data);
        setShowConversionModal(false);
        alert("Conversion rate updated successfully!");
      }
    } catch (error) {
      console.error("Error updating conversion rate:", error);
      alert("Failed to update conversion rate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlan = (planKey, planData) => {
    setEditingPlan(planKey);
    setFormData({
      name: planData.name,
      displayName: planData.displayName,
      description: planData.description,
      USD: {
        monthly: planData.price.USD?.monthly || planData.price.monthly || 0,
        yearly: planData.price.USD?.yearly || planData.price.yearly || 0,
      },
      NGN: {
        monthly: planData.price.NGN?.monthly || 0,
        yearly: planData.price.NGN?.yearly || 0,
      },
      features: { ...planData.features },
    });
    setShowEditModal(true);
  };

  const handleSavePlan = async () => {
    try {
      setLoading(true);

      const response = await updateSubscriptionPlan(editingPlan, formData);

      if (response.success) {
        // Refresh plans to show updated data
        await fetchPlans();
        setShowEditModal(false);
        setEditingPlan(null);
        setFormData({});

        // Show success message
        alert("Plan updated successfully!");
      } else {
        alert("Failed to update plan: " + response.message);
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Error updating plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (path, value) => {
    const keys = path.split(".");
    setFormData((prev) => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const formatCurrency = (amount, currency) => {
    const symbol = currency === "NGN" ? "₦" : "$";
    return `${symbol}${amount?.toLocaleString() || 0}`;
  };

  const getPlanIcon = (planKey) => {
    switch (planKey) {
      case "starter":
        return <UserGroupIcon className="w-6 h-6" />;
      case "business":
        return <BuildingOfficeIcon className="w-6 h-6" />;
      case "professional":
        return <SparklesIcon className="w-6 h-6" />;
      case "enterprise":
        return <ShieldCheckIcon className="w-6 h-6" />;
      default:
        return <Cog6ToothIcon className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planKey) => {
    switch (planKey) {
      case "starter":
        return "text-blue-400";
      case "business":
        return "text-green-400";
      case "professional":
        return "text-purple-400";
      case "enterprise":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pricing Management</h1>
          <p className="text-white/70">
            Control subscription pricing for USD and NGN currencies
          </p>
        </div>

        {/* Conversion Rate Management */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-2">
                Currency Conversion Rate
              </h2>
              <p className="text-white/70">
                Control the USD to NGN conversion rate for all plans
              </p>
            </div>
            <button
              onClick={() => setShowConversionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              Update Rate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
                <span className="font-medium">Current Rate</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                1 USD = ₦
                {systemSettings.currency?.usdToNgnRate?.toLocaleString() ||
                  "1,500"}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowPathIcon className="w-5 h-5 text-blue-400" />
                <span className="font-medium">Last Updated</span>
              </div>
              <p className="text-sm text-white/70">
                {systemSettings.currency?.lastConversionRateUpdate
                  ? new Date(
                      systemSettings.currency.lastConversionRateUpdate
                    ).toLocaleDateString()
                  : "Never"}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowPathIcon className="w-5 h-5 text-purple-400" />
                <span className="font-medium">Auto Update</span>
              </div>
              <p className="text-sm text-white/70">
                {systemSettings.currency?.autoUpdateConversionRate
                  ? "Enabled"
                  : "Disabled"}
              </p>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {Object.entries(plans).map(([planKey, plan]) => (
            <motion.div
              key={planKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
            >
              {/* Plan Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 bg-white/10 rounded-xl ${getPlanColor(
                      planKey
                    )}`}
                  >
                    {getPlanIcon(planKey)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{plan.displayName}</h3>
                    <p className="text-white/60 text-sm">{plan.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEditPlan(planKey, plan)}
                  className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-3">Pricing</h4>

                {/* USD Pricing */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
                    <span className="font-medium">USD Pricing</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-white/60">Monthly</p>
                      <p className="text-xl font-bold text-green-400">
                        {formatCurrency(
                          plan.price.USD?.monthly || plan.price.monthly,
                          "USD"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60">Yearly</p>
                      <p className="text-xl font-bold text-green-400">
                        {formatCurrency(
                          plan.price.USD?.yearly || plan.price.yearly,
                          "USD"
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* NGN Pricing */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
                    <span className="font-medium">NGN Pricing</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-white/60">Monthly</p>
                      <p className="text-xl font-bold text-green-400">
                        {formatCurrency(plan.price.NGN?.monthly || 0, "NGN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60">Yearly</p>
                      <p className="text-xl font-bold text-green-400">
                        {formatCurrency(plan.price.NGN?.yearly || 0, "NGN")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Features</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">
                        {plan.features.maxUsers === -1
                          ? "Unlimited"
                          : plan.features.maxUsers}{" "}
                        Users
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CloudIcon className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">
                        {plan.features.maxStorage}GB Storage
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">
                        {plan.features.maxDepartments === -1
                          ? "Unlimited"
                          : plan.features.maxDepartments}{" "}
                        Departments
                      </span>
                    </div>
                    {plan.features.customWorkflows && (
                      <div className="flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-purple-400" />
                        <span className="text-sm">Custom Workflows</span>
                      </div>
                    )}
                    {plan.features.advancedAnalytics && (
                      <div className="flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-purple-400" />
                        <span className="text-sm">Advanced Analytics</span>
                      </div>
                    )}
                    {plan.features.prioritySupport && (
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm">Priority Support</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Edit Plan Modal */}
      <AnimatePresence>
        {showEditModal && editingPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Edit {formData.displayName}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) =>
                          handleInputChange("displayName", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        rows={3}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* USD Pricing */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-400" />
                    USD Pricing
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Monthly Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.USD.monthly}
                        onChange={(e) =>
                          handleInputChange("USD.monthly", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Yearly Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.USD.yearly}
                        onChange={(e) =>
                          handleInputChange("USD.yearly", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* NGN Pricing */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-400" />
                    NGN Pricing
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Monthly Price
                      </label>
                      <input
                        type="number"
                        value={formData.NGN.monthly}
                        onChange={(e) =>
                          handleInputChange("NGN.monthly", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Yearly Price
                      </label>
                      <input
                        type="number"
                        value={formData.NGN.yearly}
                        onChange={(e) =>
                          handleInputChange("NGN.yearly", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/20">
                  <button
                    onClick={handleSavePlan}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversion Rate Update Modal */}
      <AnimatePresence>
        {showConversionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowConversionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-white/20 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Update Conversion Rate</h2>
                <button
                  onClick={() => setShowConversionModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    USD to NGN Conversion Rate
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={conversionRate}
                      onChange={(e) =>
                        setConversionRate(parseFloat(e.target.value) || 1500)
                      }
                      min="1"
                      max="10000"
                      step="0.01"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                      placeholder="1500"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60">
                      NGN per USD
                    </div>
                  </div>
                  <p className="text-sm text-white/60 mt-2">
                    This rate will be used to convert USD prices to NGN for all
                    subscription plans.
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Preview Impact</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      Professional Plan ($99.99/month):{" "}
                      <span className="text-green-400">
                        ₦{(99.99 * conversionRate).toLocaleString()}/month
                      </span>
                    </p>
                    <p>
                      Business Plan ($49.99/month):{" "}
                      <span className="text-green-400">
                        ₦{(49.99 * conversionRate).toLocaleString()}/month
                      </span>
                    </p>
                    <p>
                      Starter Plan ($19.99/month):{" "}
                      <span className="text-green-400">
                        ₦{(19.99 * conversionRate).toLocaleString()}/month
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/20">
                  <button
                    onClick={updateConversionRate}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    {loading ? "Updating..." : "Update Rate"}
                  </button>
                  <button
                    onClick={() => setShowConversionModal(false)}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    Cancel
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

export default PricingManagement;
