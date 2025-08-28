import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  ClipboardDocumentCheckIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import DataTable from "../../../../components/common/DataTable";
import {
  fetchProjects,
  completeRegulatoryCompliance,
} from "../../../../services/projectAPI";

const PendingReviews = () => {
  const [pendingProjects, setPendingProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [complianceData, setComplianceData] = useState({
    equipmentRegistrationVerified: false,
    regulatoryComplianceVerified: false,
    legalReviewCompleted: false,
    riskAssessmentCompleted: false,
    nationalSystemIntegrationVerified: false,
    auditTrailVerified: false,
    complianceNotes: "",
    riskLevel: "low",
    regulatoryRequirements: [],
  });

  useEffect(() => {
    fetchPendingProjects();
  }, []);

  const fetchPendingProjects = async () => {
    try {
      setLoading(true);
      // This will fetch projects that have regulatory compliance initiated but not completed
      const response = await fetchProjects({
        status: "implementation",
        workflowPhase: "regulatory_compliance",
      });

      if (response.success) {
        const pendingComplianceProjects = response.data.projects.filter(
          (project) =>
            project.workflowTriggers?.regulatoryComplianceInitiated &&
            !project.workflowTriggers?.regulatoryComplianceCompleted
        );
        setPendingProjects(pendingComplianceProjects);
      }
    } catch (error) {
      console.error("Error fetching pending projects:", error);
      toast.error("Failed to fetch pending compliance reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowComplianceModal(true);
  };

  const handleCompleteCompliance = async () => {
    try {
      if (!selectedProject) return;

      const response = await completeRegulatoryCompliance(
        selectedProject._id,
        complianceData
      );

      if (response.success) {
        toast.success("Regulatory compliance completed successfully");
        setShowComplianceModal(false);
        setSelectedProject(null);
        setComplianceData({
          equipmentRegistrationVerified: false,
          regulatoryComplianceVerified: false,
          legalReviewCompleted: false,
          riskAssessmentCompleted: false,
          nationalSystemIntegrationVerified: false,
          auditTrailVerified: false,
          complianceNotes: "",
          riskLevel: "low",
          regulatoryRequirements: [],
        });
        fetchPendingProjects(); // Refresh the list
      }
    } catch (error) {
      console.error("Error completing compliance:", error);
      toast.error("Failed to complete regulatory compliance");
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
      header: "Budget",
      accessor: "budget",
      renderer: (project) => (
        <span className="text-sm text-gray-900">
          ₦{project.budget?.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Initiated",
      accessor: "workflowTriggers",
      renderer: (project) => (
        <span className="text-sm text-gray-500">
          {project.workflowTriggers?.regulatoryComplianceInitiatedAt
            ? new Date(
                project.workflowTriggers.regulatoryComplianceInitiatedAt
              ).toLocaleDateString()
            : "N/A"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (project) => (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          Pending Review
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
            Pending Compliance Reviews
          </h1>
          <p className="text-gray-600">
            Review and approve regulatory compliance for projects
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ClipboardDocumentCheckIcon className="h-8 w-8 text-red-600" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Pending Reviews
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingProjects.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DataTable
          data={pendingProjects}
          columns={columns}
          loading={loading}
          actions={{
            showEdit: false,
            showDelete: false,
            showToggle: false,
            customActions: (project) => (
              <button
                onClick={() => handleViewProject(project)}
                className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                title="Review Compliance"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            ),
          }}
          emptyState={{
            icon: (
              <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-400" />
            ),
            title: "No pending compliance reviews",
            description:
              "All projects are up to date with regulatory compliance",
          }}
        />
      </div>

      {/* Compliance Review Modal */}
      {showComplianceModal && selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Regulatory Compliance Review
                </h3>
                <button
                  onClick={() => setShowComplianceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
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
                {/* Compliance Checklist */}
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
                      <label key={item.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={complianceData[item.key]}
                          onChange={(e) =>
                            setComplianceData((prev) => ({
                              ...prev,
                              [item.key]: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Risk Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Level
                  </label>
                  <select
                    value={complianceData.riskLevel}
                    onChange={(e) =>
                      setComplianceData((prev) => ({
                        ...prev,
                        riskLevel: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compliance Notes
                  </label>
                  <textarea
                    value={complianceData.complianceNotes}
                    onChange={(e) =>
                      setComplianceData((prev) => ({
                        ...prev,
                        complianceNotes: e.target.value,
                      }))
                    }
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any additional notes or requirements..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowComplianceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteCompliance}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckCircleIcon className="h-4 w-4 inline mr-2" />
                  Complete Compliance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingReviews;
