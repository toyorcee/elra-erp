import React, { useState, useEffect } from "react";
import {
  ShoppingBagIcon,
  PlusIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  BanknotesIcon,
  ArrowPathIcon,
  UserIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchPurchaseOrders,
  createProcurement,
  updateProcurement,
  deleteProcurement,
} from "../../../../services/procurementAPI";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import ELRALogo from "../../../../components/ELRALogo";

const PurchaseOrders = () => {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form data for new purchase order
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    supplier: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
      },
    },
    items: [
      {
        name: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        category: "equipment",
        specifications: {
          brand: "",
          model: "",
          year: "",
        },
      },
    ],
    expectedDeliveryDate: "",
  });

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
      value: "draft",
      label: "Draft",
      color: "bg-gray-100 text-gray-800",
    },
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
      value: "rejected",
      label: "Rejected",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "delivered",
      label: "Delivered",
      color: "bg-blue-100 text-blue-800",
    },
  ];

  const orderPriorities = [
    { value: "all", label: "All Priorities" },
    {
      value: "low",
      label: "Low",
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "normal",
      label: "Normal",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "high",
      label: "High",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "urgent",
      label: "Urgent",
      color: "bg-red-100 text-red-800",
    },
  ];

  useEffect(() => {
    loadPurchaseOrders();
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

  const getPriorityBadge = (priority) => {
    const priorityConfig = orderPriorities.find((p) => p.value === priority);
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          priorityConfig?.color || "bg-gray-100 text-gray-800"
        }`}
      >
        {priorityConfig?.label || priority}
      </span>
    );
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns = [
    {
      header: "Order Details",
      accessor: "poNumber",
      renderer: (order) => (
        <div
          className="flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded"
          onClick={() => handleViewDetails(order)}
        >
          <ShoppingBagIcon className="h-5 w-5 text-[var(--elra-primary)] mr-2 mt-1" />
          <div>
            <div className="font-medium text-gray-900">{order.poNumber}</div>
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {order.title?.length > 15
                ? `${order.title.slice(0, 15)}...`
                : order.title}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Created by: {order.createdBy?.firstName}{" "}
              {order.createdBy?.lastName}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Project & Amount",
      accessor: "relatedProject",
      renderer: (order) => (
        <div className="space-y-2">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-900 font-medium">
              {order.relatedProject?.name || "No Project Linked"}
            </span>
          </div>
          {order.relatedProject?.code && (
            <div className="text-xs text-gray-500">
              Code: {order.relatedProject.code}
            </div>
          )}
          <div className="flex items-center text-sm">
            <CurrencyDollarIcon className="h-4 w-4 text-gray-500 mr-1" />
            <span className="font-medium text-gray-900">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {order.items?.length || 0} item
            {order.items?.length !== 1 ? "s" : ""}
          </div>
        </div>
      ),
    },
    {
      header: "Items Summary",
      accessor: "items",
      renderer: (order) => (
        <div className="space-y-1">
          {order.items?.slice(0, 2).map((item, index) => (
            <div key={index} className="text-xs">
              <span className="font-medium text-gray-900">{item.name}</span>
              <span className="text-gray-500 ml-1">({item.quantity}x)</span>
            </div>
          ))}
          {order.items?.length > 2 && (
            <div className="text-xs text-gray-500">
              +{order.items.length - 2} more items
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status & Priority",
      accessor: "status",
      renderer: (order) => (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {getStatusBadge(order.status)}
            {order.deliveryStatus && (
              <span className="text-xs text-gray-500">
                ({order.deliveryStatus})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getPriorityBadge(order.priority)}
          </div>
          <div className="text-xs text-gray-500">
            {order.paymentStatus === "paid" ? (
              <span className="text-green-600 flex items-center">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Paid
              </span>
            ) : (
              <span className="text-orange-600 flex items-center">
                <BanknotesIcon className="h-3 w-3 mr-1" />
                {order.paymentStatus || "unpaid"}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Supplier",
      accessor: "supplier",
      renderer: (order) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {order.supplier?.name}
          </div>
          {order.supplier?.contactPerson &&
            order.supplier.contactPerson !== "TBD" && (
              <div className="text-xs text-gray-500">
                Contact: {order.supplier.contactPerson}
              </div>
            )}
          {order.supplier?.email &&
            order.supplier.email !== "tbd@supplier.com" && (
              <div className="text-xs text-gray-500 truncate">
                {order.supplier.email}
              </div>
            )}
        </div>
      ),
    },
  ];

  // Filter purchase orders based on status and priority
  const filteredPurchaseOrders = purchaseOrders.filter((order) => {
    if (filters.status !== "all" && order.status !== filters.status) {
      return false;
    }
    if (filters.priority !== "all" && order.priority !== filters.priority) {
      return false;
    }
    return true;
  });

  // Form handling functions
  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSupplierChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        supplier: {
          ...prev.supplier,
          [parent]: {
            ...prev.supplier[parent],
            [child]: value,
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        supplier: {
          ...prev.supplier,
          [field]: value,
        },
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      newItems[index] = {
        ...newItems[index],
        [parent]: {
          ...newItems[index][parent],
          [child]: value,
        },
      };
    } else {
      newItems[index][field] = value;
    }

    // Calculate total price for the item
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice =
        newItems[index].quantity * newItems[index].unitPrice;
    }

    setFormData((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          category: "equipment",
          specifications: {
            brand: "",
            model: "",
            year: "",
          },
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const procurementData = {
        ...formData,
        subtotal: calculateTotal(),
        totalAmount: calculateTotal(),
        orderDate: new Date().toISOString(),
      };

      const response = await createProcurement(procurementData);

      if (response.success) {
        toast.success("Purchase order created successfully!");
        setShowCreateModal(false);
        resetForm();
        loadPurchaseOrders();
      } else {
        toast.error(response.message || "Failed to create purchase order");
      }
    } catch (error) {
      console.error("Error creating purchase order:", error);
      toast.error("Error creating purchase order");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      supplier: {
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
        },
      },
      items: [
        {
          name: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          category: "equipment",
          specifications: {
            brand: "",
            model: "",
            year: "",
          },
        },
      ],
      expectedDeliveryDate: "",
    });
  };

  const handleDeleteOrder = async (orderId) => {
    if (
      !window.confirm("Are you sure you want to delete this purchase order?")
    ) {
      return;
    }

    try {
      const response = await deleteProcurement(orderId);
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Purchase Orders
        </h1>
        <p className="text-gray-600">
          Manage and track all procurement orders across projects
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ShoppingBagIcon className="h-8 w-8 text-[var(--elra-primary)] mr-3" />
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {purchaseOrders.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    purchaseOrders.reduce(
                      (sum, po) => sum + (po.totalAmount || 0),
                      0
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Draft Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {purchaseOrders.filter((po) => po.status === "draft").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    purchaseOrders.filter((po) => po.status === "pending")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
            >
              {orderStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
              className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
            >
              {orderPriorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadPurchaseOrders}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)]"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Purchase Order
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by PO number, project name, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredPurchaseOrders.filter(
            (order) =>
              searchTerm === "" ||
              order.poNumber
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              order.relatedProject?.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              order.supplier?.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
          )}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          actions={{
            showEdit: false,
            showDelete: false,
            showToggle: false,
          }}
        />
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            &#8203;
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Purchase Order Details
                      </h3>
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          General Information
                        </h4>
                        <div className="mt-2 space-y-2">
                          <p>
                            <span className="text-gray-600">PO Number:</span>{" "}
                            {selectedOrder.poNumber}
                          </p>
                          <p>
                            <span className="text-gray-600">Title:</span>{" "}
                            {selectedOrder.title}
                          </p>
                          <p>
                            <span className="text-gray-600">Status:</span>{" "}
                            {getStatusBadge(selectedOrder.status)}
                          </p>
                          <p>
                            <span className="text-gray-600">Priority:</span>{" "}
                            {getPriorityBadge(selectedOrder.priority)}
                          </p>
                          <p>
                            <span className="text-gray-600">Created By:</span>{" "}
                            {selectedOrder.createdBy?.firstName}{" "}
                            {selectedOrder.createdBy?.lastName}
                          </p>
                          <p>
                            <span className="text-gray-600">Created At:</span>{" "}
                            {formatDate(selectedOrder.createdAt)}
                          </p>
                          {selectedOrder.approvedBy && (
                            <p>
                              <span className="text-gray-600">
                                Approved By:
                              </span>{" "}
                              {selectedOrder.approvedBy.firstName}{" "}
                              {selectedOrder.approvedBy.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900">
                          Project & Financial Details
                        </h4>
                        <div className="mt-2 space-y-2">
                          <p>
                            <span className="text-gray-600">Project:</span>{" "}
                            {selectedOrder.relatedProject?.name}
                          </p>
                          <p>
                            <span className="text-gray-600">Project Code:</span>{" "}
                            {selectedOrder.relatedProject?.code}
                          </p>
                          <p>
                            <span className="text-gray-600">Total Amount:</span>{" "}
                            {formatCurrency(selectedOrder.totalAmount)}
                          </p>
                          <p>
                            <span className="text-gray-600">Paid Amount:</span>{" "}
                            {formatCurrency(selectedOrder.paidAmount)}
                          </p>
                          <p>
                            <span className="text-gray-600">Outstanding:</span>{" "}
                            {formatCurrency(selectedOrder.outstandingAmount)}
                          </p>
                          <p>
                            <span className="text-gray-600">
                              Payment Status:
                            </span>{" "}
                            {selectedOrder.paymentStatus}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900">
                        Supplier Information
                      </h4>
                      <div className="mt-2 space-y-2">
                        <p>
                          <span className="text-gray-600">Name:</span>{" "}
                          {selectedOrder.supplier?.name}
                        </p>
                        <p>
                          <span className="text-gray-600">Contact Person:</span>{" "}
                          {selectedOrder.supplier?.contactPerson}
                        </p>
                        <p>
                          <span className="text-gray-600">Email:</span>{" "}
                          {selectedOrder.supplier?.email}
                        </p>
                        <p>
                          <span className="text-gray-600">Phone:</span>{" "}
                          {selectedOrder.supplier?.phone}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Items</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item
                              </th>
                              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Received
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
                            {selectedOrder.items.map((item) => (
                              <tr key={item._id}>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Category: {item.category}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-500">
                                    {item.description}
                                  </div>
                                  {item.specifications && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      Specs:{" "}
                                      {Object.entries(item.specifications)
                                        .map(
                                          ([key, value]) => `${key}: ${value}`
                                        )
                                        .join(", ")}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-900">
                                  {item.quantity}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-900">
                                  {item.receivedQuantity}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-900">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-900">
                                  {formatCurrency(item.totalPrice)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td
                                colSpan="5"
                                className="px-6 py-4 text-right font-medium text-gray-900"
                              >
                                Subtotal:
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-gray-900">
                                {formatCurrency(selectedOrder.subtotal)}
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan="5"
                                className="px-6 py-4 text-right font-medium text-gray-900"
                              >
                                Tax:
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-gray-900">
                                {formatCurrency(selectedOrder.tax)}
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan="5"
                                className="px-6 py-4 text-right font-medium text-gray-900"
                              >
                                Shipping:
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-gray-900">
                                {formatCurrency(selectedOrder.shipping)}
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan="5"
                                className="px-6 py-4 text-right font-medium text-gray-900"
                              >
                                Total:
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-gray-900">
                                {formatCurrency(selectedOrder.totalAmount)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {selectedOrder.notes && selectedOrder.notes.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Notes
                        </h4>
                        <div className="space-y-2">
                          {selectedOrder.notes.map((note, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded">
                              <p className="text-sm text-gray-600">{note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[var(--elra-primary)] text-base font-medium text-white hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)] sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col">
            {/* Header - ELRA Branded */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <ELRALogo variant="dark" size="md" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Create New Purchase Order
                    </h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      ELRA Procurement Management System
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="bg-white text-[var(--elra-primary)] px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium border border-white"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                    disabled={loading}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="p-8 bg-white overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ShoppingBagIcon className="h-5 w-5 text-[var(--elra-primary)] mr-2" />
                    Purchase Order Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) =>
                          handleInputChange("title", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter purchase order title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority *
                      </label>
                      <select
                        required
                        value={formData.priority}
                        onChange={(e) =>
                          handleInputChange("priority", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Describe the purchase order requirements"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Delivery Date
                      </label>
                      <input
                        type="date"
                        value={formData.expectedDeliveryDate}
                        onChange={(e) =>
                          handleInputChange(
                            "expectedDeliveryDate",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Supplier Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 text-[var(--elra-primary)] mr-2" />
                    Supplier Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.supplier.name}
                        onChange={(e) =>
                          handleSupplierChange("name", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter supplier name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={formData.supplier.contactPerson}
                        onChange={(e) =>
                          handleSupplierChange("contactPerson", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter contact person name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.supplier.email}
                        onChange={(e) =>
                          handleSupplierChange("email", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter supplier email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.supplier.phone}
                        onChange={(e) =>
                          handleSupplierChange("phone", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter supplier phone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={formData.supplier.address.street}
                        onChange={(e) =>
                          handleSupplierChange("address.street", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.supplier.address.city}
                        onChange={(e) =>
                          handleSupplierChange("address.city", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.supplier.address.state}
                        onChange={(e) =>
                          handleSupplierChange("address.state", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.supplier.address.postalCode}
                        onChange={(e) =>
                          handleSupplierChange(
                            "address.postalCode",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter postal code"
                      />
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-[var(--elra-primary)] mr-2" />
                      Purchase Items
                    </h3>
                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center px-3 py-2 border border-[var(--elra-primary)] text-sm font-medium rounded-lg text-[var(--elra-primary)] bg-white hover:bg-[var(--elra-primary)] hover:text-white transition-all duration-200"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">
                            Item {index + 1}
                          </h4>
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Item Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(index, "name", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                              placeholder="Enter item name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Category
                            </label>
                            <select
                              value={item.category}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "category",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                            >
                              <option value="equipment">Equipment</option>
                              <option value="electronics">Electronics</option>
                              <option value="office_supplies">
                                Office Supplies
                              </option>
                              <option value="furniture">Furniture</option>
                              <option value="maintenance_parts">
                                Maintenance Parts
                              </option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                              placeholder="Enter quantity"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Unit Price (₦) *
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "unitPrice",
                                  parseFloat(e.target.value)
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                              placeholder="Enter unit price"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                              placeholder="Enter item description"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Brand
                            </label>
                            <input
                              type="text"
                              value={item.specifications.brand}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "specifications.brand",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                              placeholder="Enter brand"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Model
                            </label>
                            <input
                              type="text"
                              value={item.specifications.model}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "specifications.model",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                              placeholder="Enter model"
                            />
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900">
                              Total: ₦
                              {(
                                item.quantity * item.unitPrice
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Summary */}
                  <div className="mt-6 p-4 bg-[var(--elra-primary)] bg-opacity-10 border border-[var(--elra-primary)] border-opacity-20 rounded-lg ">
                    <div className="flex justify-between items-center text-white">
                      <span className="text-lg font-semibold]">
                        Total Order Value
                      </span>
                      <span className="text-2xl font-bold text-white">
                        ₦{calculateTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium text-sm"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm group relative"
                    title="Create New Purchase Order"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
                    {/* Hover tooltip */}
                    <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Create New Purchase Order
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
