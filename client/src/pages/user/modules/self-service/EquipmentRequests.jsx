import React, { useState } from "react";
import {
  HiCube,
  HiComputerDesktop,
  HiDevicePhoneMobile,
  HiPrinter,
  HiDocumentText,
  HiCheckCircle,
  HiExclamationTriangle,
  HiPlus,
} from "react-icons/hi2";
import { toast } from "react-toastify";

const EquipmentRequests = () => {
  const [formData, setFormData] = useState({
    equipmentType: "",
    quantity: 1,
    reason: "",
    urgency: "normal",
    additionalNotes: "",
  });
  const [loading, setLoading] = useState(false);

  const equipmentTypes = [
    {
      value: "laptop",
      label: "Laptop",
      icon: HiComputerDesktop,
      description: "New or replacement laptop",
    },
    {
      value: "monitor",
      label: "Monitor",
      icon: HiComputerDesktop,
      description: "Additional or replacement monitor",
    },
    {
      value: "mobile_device",
      label: "Mobile Device",
      icon: HiDevicePhoneMobile,
      description: "Phone, tablet, or mobile device",
    },
    {
      value: "printer",
      label: "Printer",
      icon: HiPrinter,
      description: "Printer or scanner",
    },
    {
      value: "accessories",
      label: "Accessories",
      icon: HiCube,
      description: "Mouse, keyboard, cables, etc.",
    },
    {
      value: "other",
      label: "Other",
      icon: HiCube,
      description: "Other equipment or supplies",
    },
  ];

  const urgencyLevels = [
    { value: "low", label: "Low", color: "text-green-600" },
    { value: "normal", label: "Normal", color: "text-yellow-600" },
    { value: "high", label: "High", color: "text-orange-600" },
    { value: "urgent", label: "Urgent", color: "text-red-600" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast.success(
        "Equipment request submitted successfully! You'll receive a confirmation email shortly."
      );
      setFormData({
        equipmentType: "",
        quantity: 1,
        reason: "",
        urgency: "normal",
        additionalNotes: "",
      });
    } catch (error) {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedEquipment = equipmentTypes.find(
    (eq) => eq.value === formData.equipmentType
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Equipment Requests
            </h1>
            <p className="text-gray-600 mt-1">
              Request office equipment, supplies, and accessories
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <HiCube className="w-8 h-8 text-[var(--elra-primary)]" />
          </div>
        </div>
      </div>

      {/* Equipment Request Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Equipment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Type *
            </label>
            <select
              required
              value={formData.equipmentType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  equipmentType: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              <option value="">Select equipment type</option>
              {equipmentTypes.map((equipment) => (
                <option key={equipment.value} value={equipment.value}>
                  {equipment.label}
                </option>
              ))}
            </select>
            {selectedEquipment && (
              <p className="mt-1 text-sm text-gray-500">
                {selectedEquipment.description}
              </p>
            )}
          </div>

          {/* Quantity and Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency *
              </label>
              <select
                required
                value={formData.urgency}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, urgency: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
              >
                {urgencyLevels.map((urgency) => (
                  <option key={urgency.value} value={urgency.value}>
                    {urgency.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Request *
            </label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="Please explain why you need this equipment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.additionalNotes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  additionalNotes: e.target.value,
                }))
              }
              placeholder="Any additional specifications, preferences, or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <HiPlus className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Equipment Guidelines */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <HiExclamationTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-900">
              Equipment Request Guidelines
            </h3>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• Equipment requests require manager approval</li>
              <li>
                • Standard equipment is typically provided within 3-5 business
                days
              </li>
              <li>
                • Specialized equipment may take longer and require additional
                approval
              </li>
              <li>
                • All equipment remains company property and must be returned
                upon departure
              </li>
              <li>
                • For urgent requests, contact your manager or IT support
                directly
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <HiExclamationTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Need Help?</h3>
            <p className="text-sm text-blue-700 mt-1">
              For questions about equipment requests, contact:
            </p>
            <div className="mt-2 space-y-1 text-sm text-blue-700">
              <p>
                📧 Email:{" "}
                <span className="font-medium">facilities@company.com</span>
              </p>
              <p>
                📞 Phone: <span className="font-medium">+234-XXX-XXX-XXXX</span>
              </p>
              <p>
                💬 Teams:{" "}
                <span className="font-medium">Facilities Support Channel</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentRequests;
