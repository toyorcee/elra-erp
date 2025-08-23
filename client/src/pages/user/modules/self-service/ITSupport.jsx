import React, { useState } from "react";
import {
  HiCog6Tooth,
  HiComputerDesktop,
  HiWifi,
  HiKey,
  HiUser,
  HiDocumentText,
  HiCheckCircle,
  HiExclamationTriangle,
} from "react-icons/hi2";
import { toast } from "react-toastify";

const ITSupport = () => {
  const [selectedIssue, setSelectedIssue] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const commonIssues = [
    {
      id: "wifi",
      title: "WiFi Connection Issues",
      icon: HiWifi,
      description: "Cannot connect to office WiFi or slow connection",
      solutions: [
        "Check if WiFi is enabled on your device",
        "Try forgetting and reconnecting to the network",
        "Restart your device",
        "Contact IT if issue persists",
      ],
    },
    {
      id: "password",
      title: "Password Reset",
      icon: HiKey,
      description: "Forgot password or account locked",
      solutions: [
        "Use the 'Forgot Password' link on login page",
        "Check your email for reset instructions",
        "Contact IT support for immediate assistance",
      ],
    },
    {
      id: "software",
      title: "Software Installation",
      icon: HiCog6Tooth,
      description: "Need help installing or updating software",
      solutions: [
        "Check if you have admin rights on your device",
        "Download from official company software portal",
        "Contact IT for software installation assistance",
      ],
    },
    {
      id: "access",
      title: "Access Request",
      icon: HiUser,
      description: "Need access to specific systems or applications",
      solutions: [
        "Submit access request through the portal",
        "Contact your manager for approval",
        "IT will process approved requests within 24 hours",
      ],
    },
  ];

  const handleSubmitRequest = async () => {
    if (!selectedIssue || !description.trim()) {
      toast.error("Please select an issue and provide a description");
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast.success("IT support request submitted successfully!");
      setSelectedIssue("");
      setDescription("");
    } catch (error) {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedIssueData = commonIssues.find(
    (issue) => issue.id === selectedIssue
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">IT Support</h1>
            <p className="text-gray-600 mt-1">
              Get help with technical issues and IT-related requests
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <HiCog6Tooth className="w-8 h-8 text-[var(--elra-primary)]" />
          </div>
        </div>
      </div>

      {/* Quick Solutions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Common Issues & Solutions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commonIssues.map((issue) => (
            <div
              key={issue.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedIssue === issue.id
                  ? "border-[var(--elra-primary)] bg-[var(--elra-secondary-3)]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedIssue(issue.id)}
            >
              <div className="flex items-start space-x-3">
                <issue.icon className="w-6 h-6 text-[var(--elra-primary)] mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{issue.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {issue.description}
                  </p>
                  {selectedIssue === issue.id && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Quick Solutions:
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {issue.solutions.map((solution, index) => (
                          <li key={index} className="flex items-start">
                            <HiCheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {solution}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support Request Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Submit IT Support Request
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Type
            </label>
            <select
              value={selectedIssue}
              onChange={(e) => setSelectedIssue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            >
              <option value="">Select an issue type</option>
              {commonIssues.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  {issue.title}
                </option>
              ))}
              <option value="other">Other Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe your issue in detail..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmitRequest}
              disabled={loading || !selectedIssue || !description.trim()}
              className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <HiDocumentText className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <HiExclamationTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">
              Need Immediate Help?
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              For urgent technical issues, contact IT support directly:
            </p>
            <div className="mt-2 space-y-1 text-sm text-blue-700">
              <p>
                📧 Email:{" "}
                <span className="font-medium">itsupport@company.com</span>
              </p>
              <p>
                📞 Phone: <span className="font-medium">+234-XXX-XXX-XXXX</span>
              </p>
              <p>
                💬 Teams:{" "}
                <span className="font-medium">IT Support Channel</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITSupport;
