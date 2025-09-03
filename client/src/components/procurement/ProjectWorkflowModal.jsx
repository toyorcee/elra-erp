import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { completeProcurement } from "../../services/projectAPI"; 

const ProjectWorkflowModal = ({
  isOpen,
  onClose,
  project,
  workflowData,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (!isOpen || !project) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "overdue":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCompleteProcurement = async () => {
    if (!project.canCompleteProcurement) {
      toast.warning(
        "Cannot complete procurement. Please ensure all prerequisites are met."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await completeProcurement(project._id);
      if (response.success) {
        toast.success("Procurement completed successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to complete procurement");
      }
    } catch (error) {
      console.error("Error completing procurement:", error);
      toast.error("Error completing procurement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 rounded-lg mr-4 bg-[var(--elra-primary)] bg-opacity-10 text-[var(--elra-primary)]">
              <FolderIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Project Procurement Workflow
              </h2>
              <p className="text-gray-600 mt-1">
                Manage procurement tasks for {project.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Project Info Banner */}
        <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
              <p className="text-sm opacity-90">Project Code: {project.code}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{project.progress}%</div>
              <div className="text-sm opacity-90">Complete</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold mb-1">
                ₦{new Intl.NumberFormat().format(project.budget)}
              </div>
              <div className="text-sm opacity-90">Budget</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("workflow")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "workflow"
                  ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Workflow Status
            </button>
            <button
              onClick={() => setActiveTab("procurement")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "procurement"
                  ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Procurement Details
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mr-4">
                      <FolderIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Category
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {project.category.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600 mr-4">
                      <CheckCircleIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Progress
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {project.progress}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 mr-4">
                      <ClockIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Status
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {project.procurementCompleted
                          ? "Completed"
                          : "In Progress"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600 mr-4">
                      <CurrencyDollarIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Budget Used
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        ₦
                        {new Intl.NumberFormat().format(
                          project.budget * (project.progress / 100)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Project Description
                </h3>
                <p className="text-gray-600">
                  {project.description ||
                    "No description available for this project."}
                </p>
              </div>
            </div>
          )}

          {/* Workflow Status Tab */}
          {activeTab === "workflow" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Workflow Progress
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getStatusIcon(
                        project.inventoryCreated ? "completed" : "pending"
                      )}
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">
                          Inventory Created
                        </h4>
                        <p className="text-sm text-gray-600">
                          Initial inventory setup for the project
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        project.inventoryCreated ? "completed" : "pending"
                      )}`}
                    >
                      {project.inventoryCreated ? "Completed" : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getStatusIcon(
                        project.inventoryCompleted ? "completed" : "pending"
                      )}
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">
                          Inventory Completed
                        </h4>
                        <p className="text-sm text-gray-600">
                          All inventory items have been finalized
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        project.inventoryCompleted ? "completed" : "pending"
                      )}`}
                    >
                      {project.inventoryCompleted ? "Completed" : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getStatusIcon(
                        project.procurementInitiated ? "completed" : "pending"
                      )}
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">
                          Procurement Initiated
                        </h4>
                        <p className="text-sm text-gray-600">
                          Procurement process has been started
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        project.procurementInitiated ? "completed" : "pending"
                      )}`}
                    >
                      {project.procurementInitiated ? "Completed" : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getStatusIcon(
                        project.procurementCompleted ? "completed" : "pending"
                      )}
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">
                          Procurement Completed
                        </h4>
                        <p className="text-sm text-gray-600">
                          All procurement tasks have been finished
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        project.procurementCompleted ? "completed" : "pending"
                      )}`}
                    >
                      {project.procurementCompleted ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {!project.canCompleteProcurement &&
                !project.procurementCompleted && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-yellow-800">
                          Action Required
                        </h4>
                        <p className="text-sm text-yellow-700">
                          Inventory completion is required before procurement
                          can be finalized.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Procurement Details Tab */}
          {activeTab === "procurement" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Procurement Summary
                </h3>

                {workflowData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Budget Allocation
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Budget:</span>
                          <span className="font-medium">
                            ₦{new Intl.NumberFormat().format(project.budget)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Allocated:</span>
                          <span className="font-medium">
                            ₦
                            {new Intl.NumberFormat().format(
                              workflowData.budgetAllocated || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Remaining:</span>
                          <span className="font-medium">
                            ₦
                            {new Intl.NumberFormat().format(
                              project.budget -
                                (workflowData.budgetAllocated || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Suppliers
                      </h4>
                      <div className="space-y-2">
                        {workflowData.suppliersAssigned?.length > 0 ? (
                          workflowData.suppliersAssigned.map(
                            (supplier, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <span className="text-sm font-medium">
                                  {supplier.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {supplier.role}
                                </span>
                              </div>
                            )
                          )
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No suppliers assigned yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No Procurement Data
                    </h4>
                    <p className="text-gray-600">
                      Procurement details will be available once the process is
                      initiated.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {project.canCompleteProcurement
              ? "Ready to complete procurement"
              : "Complete inventory tasks first"}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>

            {project.canCompleteProcurement &&
              !project.procurementCompleted && (
                <button
                  onClick={handleCompleteProcurement}
                  disabled={loading}
                  className="px-6 py-3 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Complete Procurement
                    </>
                  )}
                </button>
              )}

            {project.procurementCompleted && (
              <div className="px-6 py-3 bg-green-100 text-green-800 rounded-lg flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Procurement Completed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectWorkflowModal;
