import React, { useState, useEffect } from "react";
import { HiXMark, HiClock, HiDocumentText } from "react-icons/hi2";
import { toast } from "react-toastify";
import { leaveRequests } from "../../services/leave";
import ELRALogo from "../ELRALogo";

const LeaveRequestModal = ({
  isOpen,
  onClose,
  mode = "create",
  request = null,
}) => {
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    days: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && request) {
        setFormData({
          leaveType: request.leaveType || "",
          startDate: request.startDate
            ? new Date(request.startDate).toISOString().split("T")[0]
            : "",
          endDate: request.endDate
            ? new Date(request.endDate).toISOString().split("T")[0]
            : "",
          days: request.days || "",
          reason: request.reason || "",
        });
      } else {
        setFormData({
          leaveType: "",
          startDate: "",
          endDate: "",
          days: "",
          reason: "",
        });
      }
      setErrors({});
      fetchLeaveTypes();
    }
  }, [isOpen, mode, request]);

  const fetchLeaveTypes = async () => {
    try {
      setLoadingTypes(true);
      const response = await leaveRequests.getTypes();
      if (response.success) {
        setLeaveTypes(response.data);
      } else {
        setLeaveTypes([
          "Annual",
          "Sick",
          "Personal",
          "Maternity",
          "Paternity",
          "Study",
          "Bereavement",
        ]);
      }
    } catch (error) {
      console.error(
        "❌ [LeaveRequestModal] Error fetching leave types:",
        error
      );
      // Fallback to backend types
      setLeaveTypes([
        "Annual",
        "Sick",
        "Personal",
        "Maternity",
        "Paternity",
        "Study",
        "Bereavement",
      ]);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Auto-calculate days when dates change
    if (name === "startDate" || name === "endDate") {
      const startDate = name === "startDate" ? value : formData.startDate;
      const endDate = name === "endDate" ? value : formData.endDate;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
          if (start <= end) {
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setFormData((prev) => ({ ...prev, days: diffDays.toString() }));
          } else {
            setFormData((prev) => ({ ...prev, days: "" }));
          }
        } else {
          setFormData((prev) => ({ ...prev, days: "" }));
        }
      } else {
        setFormData((prev) => ({ ...prev, days: "" }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.leaveType) {
      newErrors.leaveType = "Leave type is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.startDate = "Start date cannot be in the past";
      }
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    } else {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate <= startDate) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    if (!formData.days || parseInt(formData.days) <= 0) {
      newErrors.days =
        "Please select valid start and end dates to calculate days";
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Reason is required";
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        days: parseInt(formData.days),
      };

      let result;
      if (mode === "create") {
        result = await leaveRequests.create(submitData);
      } else {
        result = await leaveRequests.update(request._id, submitData);
      }

      if (result.success) {
        toast.success(
          mode === "create"
            ? "Leave request submitted successfully!"
            : "Leave request updated successfully!"
        );
        onClose(true); // true indicates success
      } else {
        throw new Error(result.message || "Operation failed");
      }
    } catch (error) {
      console.error("❌ [LeaveRequestModal] Error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Operation failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ELRALogo variant="dark" size="md" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {mode === "create"
                    ? "New Leave Request"
                    : "Edit Leave Request"}
                </h2>
                <p className="text-white text-opacity-90 mt-1 text-sm">
                  {mode === "create"
                    ? "Submit a new leave request for approval"
                    : "Update your leave request details"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onClose(false)}
                className="bg-white text-[var(--elra-primary)] px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium border border-white"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => onClose(false)}
                className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                disabled={loading}
              >
                <HiXMark className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-8 bg-white overflow-y-auto flex-1 space-y-8"
        >
          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              name="leaveType"
              value={formData.leaveType}
              onChange={handleInputChange}
              disabled={loadingTypes}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                errors.leaveType ? "border-red-300" : "border-gray-300"
              } ${loadingTypes ? "bg-gray-50 cursor-not-allowed" : ""}`}
            >
              <option value="">
                {loadingTypes ? "Loading leave types..." : "Select leave type"}
              </option>
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.leaveType && (
              <p className="mt-1 text-sm text-red-600">{errors.leaveType}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                    errors.startDate ? "border-red-300" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={
                    formData.startDate || new Date().toISOString().split("T")[0]
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                    errors.endDate ? "border-red-300" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Days */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              Number of Days <span className="text-red-500 ml-1">*</span>
              <span className="ml-2 text-xs  bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                Auto-calculated
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="days"
                value={formData.days}
                onChange={handleInputChange}
                min="1"
                max="365"
                disabled={true}
                className={`w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed ${
                  errors.days ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Auto-calculated from dates"
              />
              <HiClock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.days && (
              <p className="mt-1 text-sm text-red-600">{errors.days}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 flex items-center">
              <svg
                className="w-4 h-4 mr-1 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formData.days
                ? `${formData.days} day(s) calculated`
                : "Select dates to calculate days"}
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                  errors.reason ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Please provide a detailed reason for your leave request..."
              />
              <HiDocumentText className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Minimum 10 characters required
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onClose(false)}
              disabled={loading}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {mode === "create" ? "Submit Request" : "Update Request"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestModal;
