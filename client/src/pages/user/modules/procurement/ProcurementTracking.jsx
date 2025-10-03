import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FolderIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  EyeIcon,
  ArrowPathIcon,
  XMarkIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchPurchaseOrders,
  getProcurementById,
} from "../../../../services/procurementAPI";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

const ProcurementTracking = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [standalonePOs, setStandalonePOs] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    department: "all",
  });
  const [selectedPO, setSelectedPO] = useState(null);
  const [showPOModal, setShowPOModal] = useState(false);
  const [loadingPO, setLoadingPO] = useState(false);
  const [viewMode, setViewMode] = useState("project-tied"); 

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Procurement Tracking.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetchPurchaseOrders();
      if (response.success) {
        // Group procurement by project
        const projectMap = new Map();
        const standalonePOs = [];

        response.data.forEach((po) => {
          if (po.relatedProject && po.relatedProject._id) {
            // Project-tied procurement
            if (!projectMap.has(po.relatedProject._id)) {
              projectMap.set(po.relatedProject._id, {
                _id: po.relatedProject._id,
                name: po.relatedProject.name,
                code: po.relatedProject.code,
                budget: 0, // Budget not available in procurement data
                purchaseOrders: [],
              });
            }
            projectMap.get(po.relatedProject._id).purchaseOrders.push(po);
          } else {
            // Standalone procurement
            standalonePOs.push(po);
          }
        });

        setProjects(Array.from(projectMap.values()));
        setStandalonePOs(standalonePOs);
        setPurchaseOrders(response.data);
      } else {
        toast.error("Failed to load procurement data");
      }
    } catch (error) {
      console.error("Error loading procurement data:", error);
      toast.error("Error loading procurement data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPO = async (poId) => {
    setLoadingPO(true);
    try {
      const response = await getProcurementById(poId);
      if (response.success) {
        setSelectedPO(response.data);
        setShowPOModal(true);
      } else {
        toast.error("Failed to load PO details");
      }
    } catch (error) {
      console.error("Error loading PO details:", error);
      toast.error("Error loading PO details");
    } finally {
      setLoadingPO(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || statusColors.draft
        }`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          priorityColors[priority] || priorityColors.medium
        }`}
      >
        {priority.toUpperCase()}
      </span>
    );
  };

  // Unified columns for both project-tied and standalone views
  const getColumns = () => {
    if (viewMode === "project-tied") {
      return [
        {
          header: "Project Details",
          key: "name",
          renderer: (project) => (
            <div className="flex items-center">
              <FolderIcon className="h-5 w-5 text-[var(--elra-primary)] mr-2" />
              <div>
                <div className="font-medium text-gray-900">{project.name}</div>
                <div className="text-sm text-gray-500">{project.code}</div>
              </div>
            </div>
          ),
        },
        {
          header: "Budget & Spending",
          key: "budget",
          renderer: (project) => {
            const totalPOAmount =
              project.purchaseOrders?.reduce(
                (sum, po) => sum + (po.totalAmount || 0),
                0
              ) || 0;

            return (
              <div className="space-y-1">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-sm font-medium text-gray-900">
                    Budget: {formatCurrency(project.budget || 0)}
                  </span>
                </div>
                <div className="flex items-center">
                  <ShoppingCartIcon className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-sm text-gray-600">
                    PO Total: {formatCurrency(totalPOAmount)}
                  </span>
                </div>
              </div>
            );
          },
        },
        {
          header: "Purchase Orders",
          key: "purchaseOrders",
          renderer: (project) => {
            const poCount = project.purchaseOrders?.length || 0;
            const draftPOs =
              project.purchaseOrders?.filter((po) => po.status === "draft")
                .length || 0;
            const approvedPOs =
              project.purchaseOrders?.filter((po) => po.status === "approved")
                .length || 0;

            return (
              <div className="space-y-1">
                <div className="flex items-center">
                  <ShoppingCartIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm font-medium text-gray-900">
                    {poCount} PO{poCount !== 1 ? "s" : ""}
                  </span>
                </div>
                {poCount > 0 && (
                  <div className="text-xs text-gray-500">
                    {draftPOs > 0 && (
                      <span className="mr-2">Draft: {draftPOs}</span>
                    )}
                    {approvedPOs > 0 && <span>Approved: {approvedPOs}</span>}
                  </div>
                )}
              </div>
            );
          },
        },
        {
          header: "Latest PO",
          key: "latestPO",
          renderer: (project) => {
            const latestPO = project.purchaseOrders?.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )[0];

            if (!latestPO)
              return <span className="text-sm text-gray-500">No POs</span>;

            return (
              <div
                className="space-y-1 cursor-pointer"
                onClick={() => handleViewPO(latestPO._id)}
              >
                <div className="text-sm font-medium text-gray-900">
                  {latestPO.poNumber}
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(latestPO.status)}
                  {getPriorityBadge(latestPO.priority)}
                </div>
              </div>
            );
          },
        },
        {
          header: "Actions",
          key: "actions",
          renderer: (project) => (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const latestPO = project.purchaseOrders?.[0];
                  if (latestPO) {
                    handleViewPO(latestPO._id);
                  } else {
                    toast.info("No purchase orders available");
                  }
                }}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="View Purchase Orders"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            </div>
          ),
        },
      ];
    } else {
      // Standalone view columns
      return [
        {
          header: "PO Details",
          key: "poNumber",
          renderer: (po) => (
            <div className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-[var(--elra-primary)] mr-2" />
              <div>
                <div className="font-medium text-gray-900">{po.poNumber}</div>
                <div className="text-sm text-gray-500">{po.title}</div>
              </div>
            </div>
          ),
        },
        {
          header: "Supplier",
          key: "supplier",
          renderer: (po) => (
            <div>
              <div className="font-medium text-gray-900">
                {po.supplier?.name || "N/A"}
              </div>
              <div className="text-sm text-gray-500">
                {po.supplier?.email || ""}
              </div>
            </div>
          ),
        },
        {
          header: "Amount & Status",
          key: "totalAmount",
          renderer: (po) => (
            <div className="space-y-1">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(po.totalAmount || 0)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(po.status)}
                {getPriorityBadge(po.priority)}
              </div>
            </div>
          ),
        },
        {
          header: "Delivery",
          key: "expectedDeliveryDate",
          renderer: (po) => (
            <div className="text-sm text-gray-900">
              {formatDate(po.expectedDeliveryDate)}
            </div>
          ),
        },
        {
          header: "Actions",
          key: "actions",
          renderer: (po) => (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleViewPO(po._id)}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="View Details"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            </div>
          ),
        },
      ];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  const filteredProjects = projects.filter((project) => {
    if (
      filters.status !== "all" &&
      project.purchaseOrders?.some((po) => po.status === filters.status)
    ) {
      return true;
    }
    return filters.status === "all";
  });

  const totalPOs = purchaseOrders.length;
  const draftPOs = purchaseOrders.filter((po) => po.status === "draft").length;
  const approvedPOs = purchaseOrders.filter(
    (po) => po.status === "approved"
  ).length;
  const totalBudget = projects.reduce(
    (sum, project) => sum + (project.budget || 0),
    0
  );
  const totalPOAmount = purchaseOrders.reduce(
    (sum, po) => sum + (po.totalAmount || 0),
    0
  );

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Procurement Tracking</h1>
        <p className="text-white/80">
          Track procurement status and purchase orders across all projects
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Total Projects
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2 break-all leading-tight">
                {projects.length}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <FolderIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Purchase Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                Purchase Orders
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2 break-all leading-tight">
                {totalPOs}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {draftPOs} Draft · {approvedPOs} Approved
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <ShoppingCartIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Total Budget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                Total Budget
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2 break-all leading-tight">
                {formatCurrency(totalBudget)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <CurrencyDollarIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* PO Amount */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg border border-orange-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
                PO Amount
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-900 mt-2 break-all leading-tight">
                {formatCurrency(totalPOAmount)}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                {((totalPOAmount / totalBudget) * 100).toFixed(1)}% of Budget
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
              <DocumentTextIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("project-tied")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === "project-tied"
                    ? "bg-white text-[var(--elra-primary)] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Project-tied
              </button>
              <button
                onClick={() => setViewMode("standalone")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === "standalone"
                    ? "bg-white text-[var(--elra-primary)] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Standalone
              </button>
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft POs</option>
              <option value="pending">Pending POs</option>
              <option value="approved">Approved POs</option>
              <option value="completed">Completed POs</option>
              <option value="cancelled">Cancelled POs</option>
            </select>
            <button
              onClick={loadData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)]"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Single DataTable */}
        <DataTable
          columns={getColumns()}
          data={viewMode === "project-tied" ? filteredProjects : standalonePOs}
          loading={loading}
          actions={{
            showEdit: false,
            showDelete: false,
            showToggle: false,
          }}
        />
      </motion.div>

      {/* PO Detail Modal */}
      {showPOModal && selectedPO && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Purchase Order Details
                  </h2>
                  <p className="text-sm text-gray-500">{selectedPO.poNumber}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPOModal(false);
                    setSelectedPO(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    General Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Status
                      </label>
                      <div className="mt-1">
                        {getStatusBadge(selectedPO.status)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Priority
                      </label>
                      <div className="mt-1">
                        {getPriorityBadge(selectedPO.priority)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Created By
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPO.createdBy?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Created Date
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedPO.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Project & Supplier
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Project
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPO.relatedProject?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Supplier
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPO.supplier?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Expected Delivery
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedPO.expectedDeliveryDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPO.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.name}
                            <div className="text-xs text-gray-500">
                              {item.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-4 text-sm font-medium text-gray-900 text-right"
                        >
                          Subtotal
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(selectedPO.subtotal)}
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-4 text-sm font-medium text-gray-900 text-right"
                        >
                          Tax
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(selectedPO.tax)}
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-4 text-sm font-medium text-gray-900 text-right"
                        >
                          Shipping
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(selectedPO.shipping)}
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td
                          colSpan="3"
                          className="px-6 py-4 text-sm font-bold text-gray-900 text-right"
                        >
                          Total Amount
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(selectedPO.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedPO.notes && selectedPO.notes.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Notes
                  </h3>
                  <div className="space-y-4">
                    {selectedPO.notes.map((note, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              {note.content}
                            </p>
                            <div className="mt-1 text-xs text-gray-500">
                              By {note.createdBy?.name} on{" "}
                              {formatDate(note.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementTracking;
