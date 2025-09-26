import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  HiTicket,
  HiExclamationTriangle,
  HiPaperAirplane,
  HiCheckCircle,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { complaintAPI } from "../../../../services/customerCareAPI";

const SubmitComplaint = () => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "medium",
    description: "",
    department: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { value: "technical", label: "Technical Issues", icon: "💻" },
    { value: "payroll", label: "Payroll & Finance", icon: "💰" },
    { value: "equipment", label: "Equipment Request", icon: "🖥️" },
    { value: "access", label: "Access Issues", icon: "🔐" },
    { value: "hr", label: "HR Related", icon: "👥" },
    { value: "other", label: "Other", icon: "📝" },
  ];

  const priorities = [
    { value: "low", label: "Low", color: "text-green-600 bg-green-100" },
    {
      value: "medium",
      label: "Medium",
      color: "text-yellow-600 bg-yellow-100",
    },
    { value: "high", label: "High", color: "text-red-600 bg-red-100" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await complaintAPI.createComplaint(formData);

      if (response.success) {
        toast.success(
          "Complaint submitted successfully! You'll receive a confirmation email shortly."
        );
        setSubmitted(true);
        setFormData({
          title: "",
          category: "",
          priority: "medium",
          description: "",
          department: "",
        });
      } else {
        toast.error(
          response.message || "Failed to submit complaint. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      title: "",
      category: "",
      priority: "medium",
      description: "",
      department: "",
    });
  };

  if (submitted) {
    return (
      <div className="space-y-6 p-4">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-full">
              <HiCheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Complaint Submitted!</h1>
              <p className="text-white/80 mt-1">
                Your complaint has been successfully submitted and will be
                reviewed soon.
              </p>
            </div>
          </div>
        </div>

        {/* Success Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="text-center">
            <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4">
              <HiCheckCircle className="w-8 h-8 text-green-600 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thank you for your feedback!
            </h2>
            <p className="text-gray-600 mb-6">
              We've received your complaint and will review it within 24 hours.
              You'll receive updates via email.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] transition-colors"
              >
                Submit Another Complaint
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-full">
            <HiTicket className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Submit a Complaint</h1>
            <p className="text-white/80 mt-1">
              Report an issue or concern to our Customer Care team
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Complaint Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Brief description of your complaint"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              required
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority Level *
              </label>
              <div className="space-y-2">
                {priorities.map((priority) => (
                  <label
                    key={priority.value}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={priority.value}
                      checked={formData.priority === priority.value}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="w-4 h-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)]"
                    />
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${priority.color}`}
                    >
                      {priority.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Related Department
            </label>
            <select
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              <option value="">Select department (optional)</option>
              <option value="IT">Information Technology</option>
              <option value="Finance">Finance & Accounting</option>
              <option value="HR">Human Resources</option>
              <option value="Operations">Operations</option>
              <option value="Sales">Sales & Marketing</option>
              <option value="Legal">Legal & Compliance</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Please provide detailed information about your complaint..."
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-8 py-3 bg-[var(--elra-primary)] text-white rounded-xl font-semibold hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <HiPaperAirplane className="w-5 h-5" />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200"
      >
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <HiExclamationTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-3">
              If you need immediate assistance, you can also:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use the floating chat button for quick help</li>
              <li>• Contact your department head directly</li>
              <li>• Call the internal support line</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SubmitComplaint;
