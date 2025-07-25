import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  createIndustryInstance,
  getAvailableIndustries,
} from "../../services/industryInstances";
import {
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const CreateIndustryInstance = () => {
  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingIndustries, setFetchingIndustries] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    superAdmin: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    try {
      setFetchingIndustries(true);
      const response = await getAvailableIndustries();

      // Check if response is successful and has data
      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        setIndustries(response.data.data);
      } else {
        console.error("Invalid response structure:", response);
        setIndustries([]);
      }
    } catch (error) {
      console.error("Error fetching industries:", error);
      setIndustries([]);
    } finally {
      setFetchingIndustries(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIndustry) {
      alert("Please select an industry type");
      return;
    }

    setLoading(true);

    try {
      const response = await createIndustryInstance({
        ...formData,
        industryType: selectedIndustry.value,
      });

      if (response.data && response.data.success) {
        // Set success data and show success animation
        setSuccessData(response.data.data);
        setShowSuccess(true);

        // Reset form after a delay
        setTimeout(() => {
          setFormData({
            name: "",
            description: "",
            superAdmin: {
              email: "",
              firstName: "",
              lastName: "",
              phone: "",
            },
          });
          setSelectedIndustry(null);
          setShowSuccess(false);
          setSuccessData(null);
        }, 5000); // Show success for 5 seconds
      } else {
        alert("Error creating instance");
      }
    } catch (error) {
      console.error("Error creating instance:", error);
      alert("Error creating instance");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const getIndustryIcon = (industryType) => {
    switch (industryType) {
      case "court_system":
        return "⚖️";
      case "banking_system":
        return "🏦";
      case "healthcare_system":
        return "🏥";
      case "manufacturing_system":
        return "🏭";
      default:
        return "🏢";
    }
  };

  if (fetchingIndustries) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Success Animation Overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="glass-card rounded-3xl p-8 max-w-md mx-4 text-center border border-white/20 shadow-2xl"
              >
                {/* Success Icon with Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    damping: 15,
                    stiffness: 300,
                  }}
                  className="mx-auto mb-6 w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <CheckCircleIcon className="w-12 h-12 text-white" />
                </motion.div>

                {/* Sparkles Animation */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute top-4 right-4"
                >
                  <SparklesIcon className="w-6 h-6 text-yellow-400" />
                </motion.div>

                {/* Success Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-4"
                >
                  🎉 Success!
                </motion.h2>

                {/* Success Message */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-lg mb-6"
                >
                  Industry instance created successfully!
                </motion.p>

                {/* Instance Details */}
                {successData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/20"
                  >
                    <div className="text-white/80 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Instance:</span>
                        <span className="font-semibold text-white">
                          {successData.instance.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Super Admin:</span>
                        <span className="font-semibold text-white">
                          {successData.superAdmin.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <span className="font-semibold text-white">
                          {successData.superAdmin.email}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Approval Levels:</span>
                        <span className="font-semibold text-green-400">
                          {successData.approvalLevels}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Workflows:</span>
                        <span className="font-semibold text-blue-400">
                          {successData.workflowTemplates}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSuccess(false)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Create Another
                  </motion.button>
                  <Link to="/platform-admin/instances">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      View Instances
                    </motion.button>
                  </Link>
                </motion.div>

                {/* Floating Particles */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute top-8 left-8 w-2 h-2 bg-yellow-400 rounded-full"
                />
                <motion.div
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute top-12 right-12 w-1 h-1 bg-blue-400 rounded-full"
                />
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute bottom-8 left-12 w-1.5 h-1.5 bg-purple-400 rounded-full"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              to="/platform-admin/instances"
              className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Instances</span>
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-3">
              Create Industry Instance
            </h1>
            <p className="text-white/80 text-lg">
              Set up a new industry-specific EDMS platform
            </p>
          </div>

          {/* Main Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-8 backdrop-blur-xl border border-white/20 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Industry Selection */}
              <div>
                <label className="block text-lg font-semibold text-white mb-4">
                  Select Industry Type
                  {selectedIndustry && (
                    <motion.span
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-3 text-blue-400 font-medium"
                    >
                      ✓ {selectedIndustry.label} selected
                    </motion.span>
                  )}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(industries) &&
                    industries.map((industry) => (
                      <motion.div
                        key={industry.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          console.log("Selected industry:", industry);
                          setSelectedIndustry(industry);
                        }}
                        className={`rounded-xl p-6 cursor-pointer transition-all duration-300 border-2 relative overflow-hidden ${
                          selectedIndustry?.value === industry.value
                            ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25 backdrop-blur-sm ring-2 ring-blue-400/50"
                            : "border-white/20 hover:border-blue-300/50 hover:bg-white/5 bg-white/5 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/25"
                        }`}
                      >
                        {/* Selection Indicator */}
                        {selectedIndustry?.value === industry.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center"
                          >
                            <CheckCircleIcon className="w-4 h-4 text-white" />
                          </motion.div>
                        )}

                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-3xl">
                            {getIndustryIcon(industry.value)}
                          </span>
                          <h3 className="text-xl font-semibold text-white">
                            {industry.label}
                          </h3>
                        </div>
                        <p className="text-white/80 leading-relaxed">
                          {industry.description}
                        </p>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Instance Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    <BuildingOfficeIcon className="h-5 w-5 inline mr-2" />
                    Company/Organization Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    placeholder="e.g., District Court of New York"
                    required
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    placeholder="Brief description of the organization"
                    required
                  />
                </div>
              </div>

              {/* Super Admin Details */}
              <div className="border-t border-white/20 pt-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <UserIcon className="h-6 w-6 mr-3" />
                  Super Admin Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold text-white mb-3">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.superAdmin.firstName}
                      onChange={(e) =>
                        handleInputChange(
                          "superAdmin.firstName",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-white mb-3">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.superAdmin.lastName}
                      onChange={(e) =>
                        handleInputChange("superAdmin.lastName", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-white mb-3">
                      <EnvelopeIcon className="h-5 w-5 inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.superAdmin.email}
                      onChange={(e) =>
                        handleInputChange("superAdmin.email", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                      placeholder="superadmin@company.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-white mb-3">
                      <PhoneIcon className="h-5 w-5 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.superAdmin.phone}
                      onChange={(e) =>
                        handleInputChange("superAdmin.phone", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <motion.button
                  type="submit"
                  disabled={loading || !selectedIndustry}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-2 ${
                    loading || !selectedIndustry
                      ? "bg-gray-500/50 text-white/50 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Creating Instance...</span>
                    </>
                  ) : (
                    <>
                      <BuildingOfficeIcon className="h-5 w-5" />
                      <span>Create Industry Instance</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateIndustryInstance;
