import React, { useState, useEffect } from "react";
import {
  ShoppingCartIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { completeProcurement } from "../../../../services/projectAPI";
import {
  fetchPurchaseOrders,
  deletePurchaseOrder,
} from "../../../../services/procurementAPI";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";

const ProcurementManagement = () => {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    supplier: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    orderNumber: "",
    supplier: "",
    items: [],
    totalAmount: "",
    expectedDelivery: "",
    status: "pending",
    notes: "",
  });
  const [projectWorkflows, setProjectWorkflows] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [showProjectWorkflowModal, setShowProjectWorkflowModal] =
    useState(false);
  const [selectedProjectForWorkflow, setSelectedProjectForWorkflow] =
    useState(null);
  const [workflowData, setWorkflowData] = useState(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Purchase Orders.
          </p>
        </div>
      </div>
    );
  }

  const orderStatuses = [
    { value: "all", label: "All Statuses" },
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "approved",
      label: "Approved",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "delivered",
      label: "Delivered",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
    },
  ];

  useEffect(() => {
    loadPurchaseOrders();
    fetchProjectWorkflows();
  }, []);

  const loadPurchaseOrders = async () => {
    setLoading(true);
    try {
      const response = await fetchPurchaseOrders();
      if (response.success) {
        setPurchaseOrders(response.data);
      } else {
        toast.error("Failed to load purchase orders");
      }
    } catch (error) {
      console.error("Error loading purchase orders:", error);
      toast.error("Error loading purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = orderStatuses.find((s) => s.value === status);
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusConfig?.color || "bg-gray-100 text-gray-800"
        }`}
      >
        {statusConfig?.label || status}
      </span>
    );
  };

  const fetchProjectWorkflows = async () => {
    try {
      // This would typically fetch projects that need procurement completion
      // For now, we'll create a mock list of projects that need procurement completion
      const mockProjects = [
        {
          _id: "project1",
          code: "INF20250001",
          name: "ELRA National Equipment Registry System Implementation",
          budget: 25000000,
          category: "software_development",
          progress: 85,
          inventoryCreated: true,
          inventoryCompleted: true,
          procurementInitiated: true,
          procurementCompleted: false,
          canCompleteProcurement: true,
        },
        {
          _id: "project2",
          code: "OPS20250002",
          name: "Operations Equipment Upgrade Project",
          budget: 15000000,
          category: "equipment_lease",
          progress: 85,
          inventoryCreated: true,
          inventoryCompleted: false,
          procurementInitiated: true,
          procurementCompleted: false,
          canCompleteProcurement: false, // Can't complete until inventory is done
        },
      ];
      setProjectWorkflows(mockProjects);
    } catch (error) {
      console.error("Error fetching project workflows:", error);
    }
  };

  const handleCompleteProcurement = async (projectId) => {
    try {
      const response = await completeProcurement(projectId);
      if (response.success) {
        toast.success("Procurement marked as completed successfully!");
        fetchProjectWorkflows(); // Refresh the list
      }
    } catch (error) {
      console.error("Error completing procurement:", error);
      toast.error("Failed to complete procurement. Please try again.");
    }
  };

  const handleManageProjectProcurement = async (project) => {
    try {
      setWorkflowLoading(true);
      setSelectedProjectForWorkflow(project);

      // Mock workflow data for now
      const mockWorkflowData = {
        project: project,
        procurementStatus: "pending",
        budgetAllocated: 0,
        suppliersAssigned: [],
        purchaseOrders: [],
        canCompleteProcurement: false,
      };

      setWorkflowData(mockWorkflowData);
      setShowProjectWorkflowModal(true);
    } catch (error) {
      console.error("Error loading project workflow:", error);
      toast.error("Failed to load project workflow data");
    } finally {
      setWorkflowLoading(false);
    }
  };

  const columns = [
    {
      header: "Order",
      accessor: "orderNumber",
      cell: (order) => (
        <div className="flex items-center">
          <ShoppingCartIcon className="h-5 w-5 text-blue-500 mr-2" />
          <div>
            <div className="font-medium text-gray-900">{order.orderNumber}</div>
            <div className="text-sm text-gray-500">{order.supplier}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (order) => getStatusBadge(order.status),
    },
    {
      header: "Total Amount",
      accessor: "totalAmount",
      cell: (order) => (
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm text-gray-900">
            ₦{new Intl.NumberFormat().format(order.totalAmount || 0)}
          </span>
        </div>
      ),
    },
    {
      header: "Expected Delivery",
      accessor: "expectedDelivery",
      cell: (order) => (
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm text-gray-900">
            {new Date(order.expectedDelivery).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (order) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedOrder(order);
              setFormData({
                orderNumber: order.orderNumber,
                supplier: order.supplier,
                items: order.items,
                totalAmount: order.totalAmount,
                expectedDelivery: order.expectedDelivery.split("T")[0],
                status: order.status,
                notes: order.notes,
              });
              setShowEditModal(true);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Edit Order"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteOrder(order._id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete Order"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleDeleteOrder = async (orderId) => {
    if (
      !window.confirm("Are you sure you want to delete this purchase order?")
    ) {
      return;
    }

    try {
      const response = await deletePurchaseOrder(orderId);
      if (response.success) {
        toast.success("Purchase order deleted successfully");
        loadPurchaseOrders();
      } else {
        toast.error(response.message || "Failed to delete purchase order");
      }
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      toast.error("Error deleting purchase order");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {activeTab === "orders" ? "Purchase Orders" : "Project Workflows"}
            </h1>
            <p className="text-gray-600">
              {activeTab === "orders"
                ? "Create and manage purchase orders for inventory"
                : "Complete procurement tasks for approved projects"}
            </p>
          </div>
          {activeTab === "orders" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Order
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("orders")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "orders"
                  ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <ShoppingCartIcon className="inline mr-2 h-4 w-4" />
              Purchase Orders
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "projects"
                  ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FolderIcon className="inline mr-2 h-4 w-4" />
              Project Workflows
            </button>
          </nav>
        </div>

        {/* Purchase Orders Tab */}
        {activeTab === "orders" && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  >
                    {orderStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Purchase Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <DataTable
                data={purchaseOrders}
                columns={columns}
                searchTerm={searchTerm}
                filters={filters}
              />
            </div>
          </>
        )}

        {/* Project Workflows Tab */}
        {activeTab === "projects" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Project Workflow Tasks
              </h2>
              <p className="text-gray-600">
                Complete procurement tasks for approved projects to proceed with
                implementation
              </p>
            </div>

            {projectWorkflows.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Pending Project Tasks
                </h3>
                <p className="text-gray-600">
                  All project procurement tasks are completed. No projects
                  require procurement completion.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projectWorkflows.map((project) => (
                  <div
                    key={project._id}
                    className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <FolderIcon className="h-5 w-5 text-[var(--elra-primary)] mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {project.code}
                        </span>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {project.progress}% Complete
                      </span>
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {project.name}
                    </h3>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>
                          Category: {project.category.replace("_", " ")}
                        </span>
                        <span>₦{project.budget.toLocaleString()}</span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[var(--elra-primary)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Workflow Status:
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Inventory Created:
                          </span>
                          <span
                            className={`text-sm ${
                              project.inventoryCreated
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {project.inventoryCreated ? "✅" : "❌"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Inventory Completed:
                          </span>
                          <span
                            className={`text-sm ${
                              project.inventoryCompleted
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {project.inventoryCompleted ? "✅" : "❌"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Procurement Initiated:
                          </span>
                          <span
                            className={`text-sm ${
                              project.procurementInitiated
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {project.procurementInitiated ? "✅" : "❌"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Procurement Completed:
                          </span>
                          <span
                            className={`text-sm ${
                              project.procurementCompleted
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {project.procurementCompleted ? "✅" : "❌"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleManageProjectProcurement(project)}
                        className="flex-1 bg-[var(--elra-primary)] text-white py-2 px-4 rounded-md hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center justify-center text-sm"
                      >
                        <ShoppingCartIcon className="h-4 w-4 mr-2" />
                        Manage Procurement
                      </button>

                      {project.canCompleteProcurement && (
                        <button
                          onClick={() => handleCompleteProcurement(project._id)}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Complete
                        </button>
                      )}
                    </div>

                    {!project.canCompleteProcurement &&
                      !project.procurementCompleted && (
                        <div className="w-full bg-yellow-100 text-yellow-800 py-2 px-4 rounded-md text-center text-sm">
                          ⏳ Waiting for Inventory Completion
                        </div>
                      )}

                    {!project.canCompleteProcurement &&
                      project.procurementCompleted && (
                        <div className="w-full bg-green-100 text-green-800 py-2 px-4 rounded-md text-center text-sm">
                          ✅ Procurement Completed
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcurementManagement;
