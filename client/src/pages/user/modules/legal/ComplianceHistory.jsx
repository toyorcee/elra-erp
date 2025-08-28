import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import DataTable from "../../../../components/common/DataTable";
import { fetchProjects } from "../../../../services/projectAPI";

const ComplianceHistory = () => {
  const [completedProjects, setCompletedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchCompletedProjects();
  }, []);

  const fetchCompletedProjects = async () => {
    try {
      setLoading(true);
      const response = await fetchProjects({
        status: "implementation",
      });

      if (response.success) {
        const completedComplianceProjects = response.data.projects.filter(
          (project) => project.workflowTriggers?.regulatoryComplianceCompleted
        );
        setCompletedProjects(completedComplianceProjects);
      }
    } catch (error) {
      console.error("Error fetching completed projects:", error);
      toast.error("Failed to fetch compliance history");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns = [
    {
      header: "Project",
      accessor: "name",
      renderer: (project) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {project.name}
          </div>
          <div className="text-sm text-gray-500">{project.code}</div>
        </div>
      ),
    },
    {
      header: "Department",
      accessor: "department",
      renderer: (project) => (
        <span className="text-sm text-gray-500">
          {project.department?.name}
        </span>
      ),
    },
    {
      header: "Completed By",
      accessor: "workflowTriggers",
      renderer: (project) => (
        <span className="text-sm text-gray-900">
          {project.workflowTriggers?.regulatoryComplianceCompletedBy?.firstName}{" "}
          {project.workflowTriggers?.regulatoryComplianceCompletedBy?.lastName}
        </span>
      ),
    },
    {
      header: "Completed Date",
      accessor: "workflowTriggers",
      renderer: (project) => (
        <span className="text-sm text-gray-500">
          {project.workflowTriggers?.regulatoryComplianceCompletedAt
            ? new Date(
                project.workflowTriggers.regulatoryComplianceCompletedAt
              ).toLocaleDateString()
            : "N/A"}
        </span>
      ),
    },
    {
      header: "Risk Level",
      accessor: "workflowTriggers",
      renderer: (project) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(
            project.workflowTriggers?.complianceDetails?.riskLevel
          )}`}
        >
          {project.workflowTriggers?.complianceDetails?.riskLevel?.toUpperCase() ||
            "N/A"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (project) => (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Completed
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Compliance History
          </h1>
          <p className="text-gray-600">
            View completed regulatory compliance reviews
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-8 w-8 text-green-600" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Completed Reviews
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {completedProjects.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DataTable
          data={completedProjects}
          columns={columns}
          loading={loading}
          actions={{
            showEdit: false,
            showDelete: false,
            showToggle: false,
            customActions: (project) => (
              <button
                onClick={() => handleViewDetails(project)}
                className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                title="View Details"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            ),
          }}
          emptyState={{
            icon: <ClockIcon className="h-12 w-12 text-gray-400" />,
            title: "No compliance history found",
            description:
              "No projects have completed regulatory compliance reviews yet",
          }}
        />
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Compliance Review Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <DocumentTextIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Project: {selectedProject.name}
                </h4>
                <p className="text-sm text-gray-600">
                  Code: {selectedProject.code}
                </p>
              </div>

              <div className="space-y-4">
                {/* Compliance Details */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-900">
                    Compliance Checklist
                  </h5>

                  <div className="space-y-2">
                    {[
                      {
                        key: "equipmentRegistrationVerified",
                        label: "Equipment Registration Verified",
                      },
                      {
                        key: "regulatoryComplianceVerified",
                        label: "Regulatory Compliance Verified",
                      },
                      {
                        key: "legalReviewCompleted",
                        label: "Legal Review Completed",
                      },
                      {
                        key: "riskAssessmentCompleted",
                        label: "Risk Assessment Completed",
                      },
                      {
                        key: "nationalSystemIntegrationVerified",
                        label: "National System Integration Verified",
                      },
                      {
                        key: "auditTrailVerified",
                        label: "Audit Trail Verified",
                      },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center">
                        {selectedProject.workflowTriggers?.complianceDetails?.[
                          item.key
                        ] ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                          <div className="h-4 w-4 border-2 border-gray-300 rounded mr-2" />
                        )}
                        <span className="text-sm text-gray-700">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Level
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(
                      selectedProject.workflowTriggers?.complianceDetails
                        ?.riskLevel
                    )}`}
                  >
                    {selectedProject.workflowTriggers?.complianceDetails?.riskLevel?.toUpperCase() ||
                      "N/A"}
                  </span>
                </div>

                {/* Notes */}
                {selectedProject.workflowTriggers?.complianceDetails
                  ?.complianceNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compliance Notes
                    </label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {
                        selectedProject.workflowTriggers.complianceDetails
                          .complianceNotes
                      }
                    </p>
                  </div>
                )}

                {/* Completion Info */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        Completed By:
                      </span>
                      <p className="text-gray-600">
                        {
                          selectedProject.workflowTriggers
                            ?.regulatoryComplianceCompletedBy?.firstName
                        }{" "}
                        {
                          selectedProject.workflowTriggers
                            ?.regulatoryComplianceCompletedBy?.lastName
                        }
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Completed Date:
                      </span>
                      <p className="text-gray-600">
                        {selectedProject.workflowTriggers
                          ?.regulatoryComplianceCompletedAt
                          ? new Date(
                              selectedProject.workflowTriggers.regulatoryComplianceCompletedAt
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceHistory;
