import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";
import {
  completeInventory,
  getProjectsNeedingInventory,
} from "../../../../services/projectAPI";
import { getProjectInventoryWorkflow } from "../../../../services/inventoryAPI";
import DataTable from "../../../../components/common/DataTable";
import {
  HiOutlineCube,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlineFolder,
} from "react-icons/hi";

const InventoryManagement = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  if (
    !user ||
    user.role.level < 700 ||
    user.department?.name !== "Operations"
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Only Operations HOD can access Inventory Management.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await getProjectsNeedingInventory();

      if (response.success && response.data) {
        setProjects(response.data);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInventory = async (projectId) => {
    try {
      const response = await completeInventory(projectId);
      if (response.success) {
        toast.success("Inventory completed successfully!");
        fetchProjects(); // Refresh the list
      }
    } catch (error) {
      console.error("Error completing inventory:", error);
      toast.error("Failed to complete inventory");
    }
  };

  const handleViewWorkflow = async (project) => {
    try {
      const workflowData = await getProjectInventoryWorkflow(project._id);
      setSelectedProject({
        ...project,
        workflowData: workflowData.data,
      });
      setShowWorkflowModal(true);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      setSelectedProject(project);
      setShowWorkflowModal(true);
    }
  };

  // Check if all inventory tasks are completed
  const canCompleteInventory = (project) => {
    // Only show complete button if:
    // 1. Inventory is created but not completed
    // 2. All required steps are done (equipment added, budget allocated, etc.)
    // For now, we'll be more restrictive - only show if user has actually done the work
    return false; // Temporarily disable to prevent accidental completion
  };

  // Table columns configuration
  const columns = [
    {
      header: "Project Code",
      accessor: "code",
      renderer: (project) => (
        <div className="flex items-center">
          <HiOutlineFolder className="h-5 w-5 text-[var(--elra-primary)] mr-2" />
          <span className="font-medium text-gray-900">{project.code}</span>
        </div>
      ),
    },
    {
      header: "Project Name",
      accessor: "name",
      renderer: (project) => (
        <div>
          <div className="font-medium text-gray-900">{project.name}</div>
          <div className="text-sm text-gray-500">
            {project.category.replace("_", " ")}
          </div>
        </div>
      ),
    },
    {
      header: "Department",
      accessor: "department",
      renderer: (project) => (
        <span className="text-gray-900">
          {project.department?.name || "N/A"}
        </span>
      ),
    },
    {
      header: "Budget",
      accessor: "budget",
      renderer: (project) => (
        <span className="font-medium text-gray-900">
          ₦{project.budget?.toLocaleString() || "0"}
        </span>
      ),
    },
    {
      header: "Inventory Status",
      accessor: "inventoryStatus",
      renderer: (project) => (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Created:</span>
            <span
              className={`text-sm ${
                project.inventoryCreated ? "text-green-600" : "text-red-600"
              }`}
            >
              {project.inventoryCreated ? "✅" : "❌"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Completed:</span>
            <span
              className={`text-sm ${
                project.inventoryCompleted ? "text-green-600" : "text-red-600"
              }`}
            >
              {project.inventoryCompleted ? "✅" : "❌"}
            </span>
          </div>
        </div>
      ),
    },
  ];

  // Filter projects based on search term
  const filteredProjects = projects.filter(
    (project) =>
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Inventory Management
        </h1>
        <p className="text-gray-600">
          Manage inventory setup for approved projects
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search projects by name, code, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DataTable
          data={filteredProjects}
          columns={columns}
          loading={loading}
          actions={{
            showEdit: false,
            showDelete: false,
            showToggle: false,
            customActions: (project) => (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewWorkflow(project)}
                  className="p-2 text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white rounded-lg transition-colors"
                  title="View Inventory Workflow"
                >
                  <HiOutlineEye className="w-4 h-4" />
                </button>
                {canCompleteInventory(project) && (
                  <button
                    onClick={() => handleCompleteInventory(project._id)}
                    className="p-2 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-colors"
                    title="Complete Inventory"
                  >
                    <HiOutlineCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            ),
          }}
          emptyState={{
            icon: <HiOutlineCube className="h-12 w-12 text-gray-400" />,
            title: "No projects requiring inventory setup",
            description:
              "Projects will appear here once they are approved and enter the implementation phase.",
          }}
        />
      </div>

      {/* Inventory Workflow Modal */}
      {showWorkflowModal && selectedProject && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Inventory Workflow
                </h2>
                <p className="text-gray-600 mt-1">
                  {selectedProject.code} - {selectedProject.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowWorkflowModal(false);
                  setSelectedProject(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Project Overview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Project Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Budget</p>
                      <p className="text-xl font-bold text-gray-900">
                        ₦{selectedProject.budget?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedProject.category?.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedProject.department?.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inventory Steps */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Inventory Setup Steps
                  </h3>

                  {/* Step 1 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-[var(--elra-primary)] text-white rounded-full flex items-center justify-center font-semibold mr-3">
                          1
                        </div>
                        <span className="font-medium">
                          Review Project Requirements
                        </span>
                      </div>
                      <span className="text-green-600">✅ Complete</span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold mr-3">
                          2
                        </div>
                        <span className="font-medium">
                          Create Equipment Inventory
                        </span>
                      </div>
                      <button className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-md hover:bg-[var(--elra-primary-dark)] transition-colors">
                        Add Equipment
                      </button>
                    </div>

                    {/* Equipment Requirements List */}
                    {selectedProject.equipmentRequirements &&
                    selectedProject.equipmentRequirements.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Required Equipment:
                        </h4>
                        {selectedProject.equipmentRequirements.map(
                          (equipment, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">
                                      {equipment.name}
                                    </span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      {equipment.category.replace(/_/g, " ")}
                                    </span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                      Qty: {equipment.quantity}
                                    </span>
                                  </div>
                                  {equipment.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {equipment.description}
                                    </p>
                                  )}
                                  {equipment.estimatedCost > 0 && (
                                    <p className="text-sm text-gray-600">
                                      Estimated Cost: ₦
                                      {equipment.estimatedCost.toLocaleString()}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      equipment.priority === "critical"
                                        ? "bg-red-100 text-red-800"
                                        : equipment.priority === "high"
                                        ? "bg-orange-100 text-orange-800"
                                        : equipment.priority === "medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {equipment.priority}
                                  </span>
                                  {equipment.isRequired && (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                      Required
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 text-center py-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          No equipment requirements specified for this project
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Equipment requirements should be added during project
                          creation
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step 3 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold mr-3">
                          3
                        </div>
                        <span className="font-medium">Allocate Budget</span>
                      </div>
                      <button
                        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                        disabled
                      >
                        Pending
                      </button>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold mr-3">
                          4
                        </div>
                        <span className="font-medium">
                          Setup Asset Tracking
                        </span>
                      </div>
                      <button
                        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                        disabled
                      >
                        Pending
                      </button>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold mr-3">
                          5
                        </div>
                        <span className="font-medium">
                          Complete Inventory Phase
                        </span>
                      </div>
                      <button
                        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                        disabled
                      >
                        Pending
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
