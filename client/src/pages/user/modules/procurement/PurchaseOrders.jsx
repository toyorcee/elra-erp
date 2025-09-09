import React, { useState, useEffect } from "react";
import {
  ShoppingBagIcon,
  PlusIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  ArrowPathIcon,
  UserIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  TrashIcon,
  DocumentCheckIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchPurchaseOrders,
  createProcurement,
  updateProcurement,
  deleteProcurement,
  completeProcurementOrder,
  resendProcurementEmail,
  markProcurementAsIssued,
  markProcurementAsPaid,
  markProcurementAsDelivered,
} from "../../../../services/procurementAPI";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";

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
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToComplete, setOrderToComplete] = useState(null);
  const [showResendModal, setShowResendModal] = useState(false);
  const [orderToResend, setOrderToResend] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [showMarkIssuedModal, setShowMarkIssuedModal] = useState(false);
  const [orderToMarkIssued, setOrderToMarkIssued] = useState(null);
  const [showMarkIssuedConfirmModal, setShowMarkIssuedConfirmModal] =
    useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [orderToMarkPaid, setOrderToMarkPaid] = useState(null);
  const [showMarkPaidConfirmModal, setShowMarkPaidConfirmModal] =
    useState(false);
  const [showMarkDeliveredModal, setShowMarkDeliveredModal] = useState(false);
  const [orderToMarkDelivered, setOrderToMarkDelivered] = useState(null);
  const [showMarkDeliveredConfirmModal, setShowMarkDeliveredConfirmModal] =
    useState(false);
  const [confirmationNotes, setConfirmationNotes] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isMarkingIssued, setIsMarkingIssued] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isMarkingDelivered, setIsMarkingDelivered] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    delivered: 0,
    total: 0,
  });

  const [completeFormData, setCompleteFormData] = useState({
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
    deliveryAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      contactPerson: "",
      phone: "",
    },
    expectedDeliveryDate: "",
    notes: "",
  });

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
      value: "issued",
      label: "Issued",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "paid",
      label: "Paid",
      color: "bg-emerald-100 text-emerald-800",
    },
    {
      value: "delivered",
      label: "Delivered",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
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
      value: "medium",
      label: "Medium",
      color: "bg-yellow-100 text-yellow-800",
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
    {
      value: "critical",
      label: "Critical",
      color: "bg-red-200 text-red-900",
    },
  ];

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const calculateStats = (orders) => {
    const pending = orders.filter((order) =>
      ["pending", "issued", "paid"].includes(order.status)
    ).length;
    const delivered = orders.filter(
      (order) => order.status === "delivered"
    ).length;

    return {
      pending,
      delivered,
      total: orders.length,
    };
  };

  const loadPurchaseOrders = async () => {
    setLoading(true);
    try {
      const response = await fetchPurchaseOrders();
      if (response.success) {
        setPurchaseOrders(response.data);
        setStats(calculateStats(response.data));
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

  const handleCompleteOrder = (order) => {
    setCompleteFormData({
      supplier: {
        name: order.supplier?.name || "",
        contactPerson: order.supplier?.contactPerson || "",
        email: order.supplier?.email || "",
        phone: order.supplier?.phone || "",
        address: {
          street: order.supplier?.address?.street || "",
          city: order.supplier?.address?.city || "",
          state: order.supplier?.address?.state || "",
          postalCode: order.supplier?.address?.postalCode || "",
        },
      },
      deliveryAddress: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        contactPerson: "",
        phone: "",
      },
      expectedDeliveryDate: order.expectedDeliveryDate || "",
      notes: "",
    });
    setOrderToComplete(order);
    setShowCompleteModal(true);
  };

  const handleResendEmail = (order) => {
    setOrderToResend(order);
    setShowResendModal(true);
  };

  const confirmResendEmail = async () => {
    if (!orderToResend) return;

    setIsResending(true);
    try {
      await resendProcurementEmail(orderToResend._id);
      toast.success("Email resent successfully to supplier!");
      setShowResendModal(false);
      setOrderToResend(null);
    } catch (error) {
      console.error("Error resending email:", error);
      toast.error(error.response?.data?.message || "Failed to resend email");
    } finally {
      setIsResending(false);
    }
  };

  const handleMarkAsIssued = (order) => {
    setOrderToMarkIssued(order);
    setConfirmationNotes("");
    setShowMarkIssuedModal(true);
  };

  const handleMarkAsIssuedSubmit = () => {
    setShowMarkIssuedModal(false);
    setShowMarkIssuedConfirmModal(true);
  };

  const confirmMarkAsIssued = async () => {
    if (!orderToMarkIssued) return;

    setIsMarkingIssued(true);
    try {
      await markProcurementAsIssued(orderToMarkIssued._id, confirmationNotes);
      toast.success("Order marked as issued successfully!");
      setShowMarkIssuedConfirmModal(false);
      setOrderToMarkIssued(null);
      setConfirmationNotes("");
      loadPurchaseOrders();
    } catch (error) {
      console.error("Error marking as issued:", error);
      toast.error(error.response?.data?.message || "Failed to mark as issued");
    } finally {
      setIsMarkingIssued(false);
    }
  };

  const handleMarkAsPaid = (order) => {
    setOrderToMarkPaid(order);
    setPaymentNotes("");
    setShowMarkPaidModal(true);
  };

  const handleMarkAsPaidSubmit = () => {
    setShowMarkPaidModal(false);
    setShowMarkPaidConfirmModal(true);
  };

  const confirmMarkAsPaid = async () => {
    if (!orderToMarkPaid) return;

    setIsMarkingPaid(true);
    try {
      await markProcurementAsPaid(orderToMarkPaid._id, paymentNotes);
      toast.success("Order marked as paid successfully!");
      setShowMarkPaidConfirmModal(false);
      setOrderToMarkPaid(null);
      setPaymentNotes("");
      loadPurchaseOrders();
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error(error.response?.data?.message || "Failed to mark as paid");
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleMarkAsDelivered = (order) => {
    setOrderToMarkDelivered(order);
    setDeliveryNotes("");
    setShowMarkDeliveredModal(true);
  };

  const handleMarkAsDeliveredSubmit = () => {
    setShowMarkDeliveredModal(false);
    setShowMarkDeliveredConfirmModal(true);
  };

  const confirmMarkAsDelivered = async () => {
    if (!orderToMarkDelivered) return;

    setIsMarkingDelivered(true);
    try {
      await markProcurementAsDelivered(orderToMarkDelivered._id, deliveryNotes);
      toast.success("Order marked as delivered successfully!");
      setShowMarkDeliveredConfirmModal(false);
      setOrderToMarkDelivered(null);
      setDeliveryNotes("");
      loadPurchaseOrders();
    } catch (error) {
      console.error("Error marking as delivered:", error);
      toast.error(
        error.response?.data?.message || "Failed to mark as delivered"
      );
    } finally {
      setIsMarkingDelivered(false);
    }
  };

  const handleEditOrder = (order) => {
    setOrderToEdit(order);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!orderToEdit) return;

    setIsEditing(true);
    try {
      const form = document.getElementById("edit-procurement-form");
      if (!form) {
        throw new Error("Edit form not found");
      }

      const formData = new FormData(form);

      const updatedSupplier = {
        ...orderToEdit.supplier,
        name: formData.get("supplierName") || orderToEdit.supplier?.name,
        contactPerson:
          formData.get("supplierContactPerson") ||
          orderToEdit.supplier?.contactPerson,
        email: formData.get("supplierEmail") || orderToEdit.supplier?.email,
        phone: formData.get("supplierPhone") || orderToEdit.supplier?.phone,
      };

      // Build updated delivery address data
      const updatedDeliveryAddress = {
        ...orderToEdit.deliveryAddress,
        contactPerson:
          formData.get("deliveryContactPerson") ||
          orderToEdit.deliveryAddress?.contactPerson,
        phone:
          formData.get("deliveryPhone") || orderToEdit.deliveryAddress?.phone,
        street:
          formData.get("deliveryStreet") || orderToEdit.deliveryAddress?.street,
        city: formData.get("deliveryCity") || orderToEdit.deliveryAddress?.city,
        state:
          formData.get("deliveryState") || orderToEdit.deliveryAddress?.state,
        postalCode:
          formData.get("deliveryPostalCode") ||
          orderToEdit.deliveryAddress?.postalCode,
      };

      // Items are not editable - they remain as they are

      // Update the procurement order
      await updateProcurement(orderToEdit._id, {
        title: orderToEdit.title,
        description: formData.get("description") || orderToEdit.description,
        supplier: updatedSupplier,
        deliveryAddress: updatedDeliveryAddress,
        items: orderToEdit.items, // Keep original items since they're not editable
        totalAmount: orderToEdit.totalAmount, // Keep original total since items aren't editable
        expectedDeliveryDate:
          formData.get("expectedDeliveryDate") ||
          orderToEdit.expectedDeliveryDate,
      });

      // Resend email and PDF to supplier after update
      await resendProcurementEmail(orderToEdit._id);

      toast.success("Order updated and email sent to supplier successfully!");
      setShowEditModal(false);
      setOrderToEdit(null);
      loadPurchaseOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setIsEditing(false);
    }
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
          {order.items && order.items.length > 0 && (
            <div className="text-xs">
              <span className="font-medium text-gray-900">
                {order.items[0].name}
              </span>
              <span className="text-gray-500 ml-1">
                ({order.items[0].quantity}x)
              </span>
            </div>
          )}
          {order.items && order.items.length > 1 && (
            <div className="text-xs text-gray-500">
              +{order.items.length - 1} more item
              {order.items.length - 1 > 1 ? "s" : ""}
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
    {
      header: "Actions",
      accessor: "actions",
      renderer: (order) => (
        <div className="flex items-center space-x-2">
          {/* Status-specific action button */}
          {order.status === "draft" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCompleteOrder(order);
              }}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Complete Order"
            >
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          )}
          {order.status === "pending" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsIssued(order);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Mark as Issued"
            >
              <DocumentCheckIcon className="w-4 h-4" />
            </button>
          )}
          {order.status === "issued" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsPaid(order);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Mark as Paid"
            >
              <BanknotesIcon className="w-4 h-4" />
            </button>
          )}
          {order.status === "paid" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsDelivered(order);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Mark as Delivered"
            >
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          )}

          {/* Show Edit button for non-paid orders */}
          {order.status !== "paid" && order.status !== "delivered" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditOrder(order);
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Edit Order"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}

          {/* Always show View button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(order);
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            title="View Details"
          >
            <UserIcon className="w-4 h-4" />
          </button>

          {/* Show Resend button when applicable */}
          {order.supplier?.email && order.status !== "draft" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResendEmail(order);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Resend Email to Supplier"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.delivered}
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
          onRowClick={(order) => handleViewDetails(order)}
          actions={{
            showEdit: false,
            showDelete: false,
            showToggle: false,
          }}
        />
      </div>

      {/* Detail Modal - ELRA Branded */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col">
            {/* Header - ELRA Branded */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🛒</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Purchase Order Details
                    </h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      {selectedOrder.poNumber} - {selectedOrder.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    General Information
                  </h4>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-600">PO Number:</span>{" "}
                      {selectedOrder.poNumber}
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
                      <span className="text-gray-600">Created Date:</span>{" "}
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Financial Information
                  </h4>
                  <div className="space-y-2">
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
                      <span className="text-gray-600">Payment Status:</span>{" "}
                      {selectedOrder.paymentStatus === "paid" ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Paid
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Unpaid
                        </span>
                      )}
                    </p>
                    <p>
                      <span className="text-gray-600">Delivery Status:</span>{" "}
                      {selectedOrder.deliveryStatus}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Supplier Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
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
                    {selectedOrder.supplier?.address && (
                      <div className="mt-3">
                        <span className="text-gray-600">Address:</span>
                        <div className="text-sm text-gray-700 mt-1">
                          {selectedOrder.supplier.address.street && (
                            <p>{selectedOrder.supplier.address.street}</p>
                          )}
                          {selectedOrder.supplier.address.city && (
                            <p>{selectedOrder.supplier.address.city}</p>
                          )}
                          {selectedOrder.supplier.address.state && (
                            <p>{selectedOrder.supplier.address.state}</p>
                          )}
                          {selectedOrder.supplier.address.postalCode && (
                            <p>{selectedOrder.supplier.address.postalCode}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Delivery Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedOrder.deliveryAddress ? (
                      <>
                        {selectedOrder.deliveryAddress.contactPerson && (
                          <p>
                            <span className="text-gray-600">
                              Contact Person:
                            </span>{" "}
                            {selectedOrder.deliveryAddress.contactPerson}
                          </p>
                        )}
                        {selectedOrder.deliveryAddress.phone && (
                          <p>
                            <span className="text-gray-600">Phone:</span>{" "}
                            {selectedOrder.deliveryAddress.phone}
                          </p>
                        )}
                        <div className="mt-3">
                          <span className="text-gray-600">Address:</span>
                          <div className="text-sm text-gray-700 mt-1">
                            {selectedOrder.deliveryAddress.street && (
                              <p>{selectedOrder.deliveryAddress.street}</p>
                            )}
                            {selectedOrder.deliveryAddress.city && (
                              <p>{selectedOrder.deliveryAddress.city}</p>
                            )}
                            {selectedOrder.deliveryAddress.state && (
                              <p>{selectedOrder.deliveryAddress.state}</p>
                            )}
                            {selectedOrder.deliveryAddress.postalCode && (
                              <p>{selectedOrder.deliveryAddress.postalCode}</p>
                            )}
                          </div>
                        </div>
                        {selectedOrder.expectedDeliveryDate && (
                          <p className="mt-3">
                            <span className="text-gray-600">
                              Expected Delivery:
                            </span>{" "}
                            {new Date(
                              selectedOrder.expectedDeliveryDate
                            ).toLocaleDateString()}
                          </p>
                        )}
                        {selectedOrder.actualDeliveryDate && (
                          <p>
                            <span className="text-gray-600">
                              Actual Delivery:
                            </span>{" "}
                            {new Date(
                              selectedOrder.actualDeliveryDate
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 italic">
                        No delivery address specified
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Project Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedOrder.relatedProject ? (
                      <>
                        <p>
                          <span className="text-gray-600">Project Name:</span>{" "}
                          {selectedOrder.relatedProject.name}
                        </p>
                        <p>
                          <span className="text-gray-600">Project Code:</span>{" "}
                          {selectedOrder.relatedProject.code}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500 italic">No related project</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Approval Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedOrder.approvedBy ? (
                      <>
                        <p>
                          <span className="text-gray-600">Approved By:</span>{" "}
                          {selectedOrder.approvedBy?.firstName}{" "}
                          {selectedOrder.approvedBy?.lastName}
                        </p>
                        {selectedOrder.approvedDate && (
                          <p>
                            <span className="text-gray-600">
                              Approved Date:
                            </span>{" "}
                            {new Date(
                              selectedOrder.approvedDate
                            ).toLocaleDateString()}
                          </p>
                        )}
                        {selectedOrder.approvalNotes && (
                          <div className="mt-3">
                            <span className="text-gray-600">
                              Approval Notes:
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              {selectedOrder.approvalNotes}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 italic">Not yet approved</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Payment & Delivery Tracking
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedOrder.markedAsIssuedBy && (
                      <p>
                        <span className="text-gray-600">Issued By:</span>{" "}
                        {selectedOrder.markedAsIssuedBy?.firstName}{" "}
                        {selectedOrder.markedAsIssuedBy?.lastName}
                      </p>
                    )}
                    {selectedOrder.issuedDate && (
                      <p>
                        <span className="text-gray-600">Issued Date:</span>{" "}
                        {new Date(
                          selectedOrder.issuedDate
                        ).toLocaleDateString()}
                      </p>
                    )}
                    {selectedOrder.markedAsPaidBy && (
                      <p>
                        <span className="text-gray-600">Paid By:</span>{" "}
                        {selectedOrder.markedAsPaidBy?.firstName}{" "}
                        {selectedOrder.markedAsPaidBy?.lastName}
                      </p>
                    )}
                    {selectedOrder.paymentDate && (
                      <p>
                        <span className="text-gray-600">Payment Date:</span>{" "}
                        {new Date(
                          selectedOrder.paymentDate
                        ).toLocaleDateString()}
                      </p>
                    )}
                    {selectedOrder.markedAsDeliveredBy && (
                      <p>
                        <span className="text-gray-600">Delivered By:</span>{" "}
                        {selectedOrder.markedAsDeliveredBy?.firstName}{" "}
                        {selectedOrder.markedAsDeliveredBy?.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Additional Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>
                      <span className="text-gray-600">Currency:</span>{" "}
                      {selectedOrder.currency || "NGN"}
                    </p>
                    <p>
                      <span className="text-gray-600">Subtotal:</span>{" "}
                      {formatCurrency(selectedOrder.subtotal)}
                    </p>
                    <p>
                      <span className="text-gray-600">Tax:</span>{" "}
                      {formatCurrency(selectedOrder.tax || 0)}
                    </p>
                    <p>
                      <span className="text-gray-600">Shipping:</span>{" "}
                      {formatCurrency(selectedOrder.shipping || 0)}
                    </p>
                    {selectedOrder.receivedPercentage !== undefined && (
                      <p>
                        <span className="text-gray-600">Received %:</span>{" "}
                        {selectedOrder.receivedPercentage}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Items</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <div className="text-sm font-medium text-gray-900 break-words">
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-500 break-words">
                                {item.description}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOrder.notes && selectedOrder.notes.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
                  <div className="space-y-2">
                    {selectedOrder.notes.map((note, index) => (
                      <div
                        key={note._id || index}
                        className="bg-gray-50 p-3 rounded"
                      >
                        <p className="text-sm text-gray-600">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(note.createdAt).toLocaleDateString()} -{" "}
                          {note.author?.firstName} {note.author?.lastName}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 bg-gray-50 rounded-b-2xl flex-shrink-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg font-medium hover:bg-[var(--elra-primary-dark)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal - ELRA Branded */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col">
            {/* Header - ELRA Branded */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Create New Purchase Order
                    </h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      ELRA Procurement Management System
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ShoppingBagIcon className="h-5 w-5 text-[var(--elra-primary)] mr-2" />
                    Purchase Order Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <option value="critical">Critical</option>
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
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 text-[var(--elra-primary)] mr-2" />
                    Supplier Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier Company Name*
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

                {/* Items section placeholder */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-center text-gray-500">
                    Items section coming...
                  </p>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-4 p-6 bg-gray-50 rounded-b-2xl flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors font-medium"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Purchase Order Modal - ELRA Branded */}
      {showCompleteModal && orderToComplete && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col">
            {/* Header - ELRA Branded */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Complete Purchase Order
                    </h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      {orderToComplete.poNumber} - Finalize supplier details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                  disabled={loading}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">PO Number:</p>
                    <p className="font-medium text-gray-900">
                      {orderToComplete.poNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Project:</p>
                    <p className="font-medium text-gray-900">
                      {orderToComplete.relatedProject?.name || "No Project"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount:</p>
                    <p className="font-medium text-green-600">
                      ₦{orderToComplete.totalAmount?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Items:</p>
                    <p className="font-medium text-gray-900">
                      {orderToComplete.items?.length || 0} items
                    </p>
                  </div>
                </div>
              </div>

              {/* Items to be sent to supplier */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Items to be sent to supplier
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderToComplete.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <div className="text-sm font-medium text-gray-900 break-words">
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-500 break-words">
                                {item.description}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₦{item.unitPrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₦{item.totalPrice.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  try {
                    await completeProcurementOrder(
                      orderToComplete._id,
                      completeFormData
                    );
                    toast.success("Purchase order completed successfully!");
                    setShowCompleteModal(false);
                    loadPurchaseOrders();
                  } catch (error) {
                    toast.error("Error completing purchase order");
                    console.error("Error:", error);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-6"
              >
                {/* Supplier Information */}
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Supplier Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={completeFormData.supplier.name}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            supplier: {
                              ...completeFormData.supplier,
                              name: e.target.value,
                            },
                          })
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
                        value={completeFormData.supplier.contactPerson}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            supplier: {
                              ...completeFormData.supplier,
                              contactPerson: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter contact person"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={completeFormData.supplier.email}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            supplier: {
                              ...completeFormData.supplier,
                              email: e.target.value,
                            },
                          })
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
                        value={completeFormData.supplier.phone}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            supplier: {
                              ...completeFormData.supplier,
                              phone: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={completeFormData.supplier.address.street}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            supplier: {
                              ...completeFormData.supplier,
                              address: {
                                ...completeFormData.supplier.address,
                                street: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter supplier street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={completeFormData.supplier.address.city}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            supplier: {
                              ...completeFormData.supplier,
                              address: {
                                ...completeFormData.supplier.address,
                                city: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter supplier city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={completeFormData.supplier.address.state}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            supplier: {
                              ...completeFormData.supplier,
                              address: {
                                ...completeFormData.supplier.address,
                                state: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter supplier state"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={completeFormData.supplier.address.postalCode}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            supplier: {
                              ...completeFormData.supplier,
                              address: {
                                ...completeFormData.supplier.address,
                                postalCode: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter postal code"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address Information */}
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Delivery Address Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={completeFormData.deliveryAddress.street}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            deliveryAddress: {
                              ...completeFormData.deliveryAddress,
                              street: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter delivery street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={completeFormData.deliveryAddress.city}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            deliveryAddress: {
                              ...completeFormData.deliveryAddress,
                              city: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter delivery city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={completeFormData.deliveryAddress.state}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            deliveryAddress: {
                              ...completeFormData.deliveryAddress,
                              state: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter delivery state"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={completeFormData.deliveryAddress.postalCode}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            deliveryAddress: {
                              ...completeFormData.deliveryAddress,
                              postalCode: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter postal code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        required
                        value={completeFormData.deliveryAddress.contactPerson}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            deliveryAddress: {
                              ...completeFormData.deliveryAddress,
                              contactPerson: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter delivery contact person"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={completeFormData.deliveryAddress.phone}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            deliveryAddress: {
                              ...completeFormData.deliveryAddress,
                              phone: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                        placeholder="Enter delivery contact phone"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Delivery Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Delivery Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={completeFormData.expectedDeliveryDate}
                        onChange={(e) =>
                          setCompleteFormData({
                            ...completeFormData,
                            expectedDeliveryDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    value={completeFormData.notes}
                    onChange={(e) =>
                      setCompleteFormData({
                        ...completeFormData,
                        notes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)]"
                    placeholder="Enter any additional notes or special instructions"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-4 p-6 bg-gray-50 rounded-b-2xl flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  try {
                    await completeProcurementOrder(
                      orderToComplete._id,
                      completeFormData
                    );
                    toast.success("Purchase order completed successfully!");
                    loadPurchaseOrders();
                    // Keep modal open to show success state
                  } catch (error) {
                    toast.error("Error completing purchase order");
                    console.error("Error:", error);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Complete Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend Email Confirmation Modal */}
      {showResendModal && orderToResend && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <ArrowPathIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Resend Email</h2>
                    <p className="text-white text-opacity-90 text-sm">
                      Confirm resending to supplier
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResendModal(false)}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                  disabled={isResending}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to resend the purchase order email?
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">
                      Order: {orderToResend.poNumber}
                    </div>
                    <div className="mt-1">
                      <span className="font-medium">Supplier:</span>{" "}
                      {orderToResend.supplier?.name}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {orderToResend.supplier?.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowResendModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isResending}
              >
                Cancel
              </button>
              <button
                onClick={confirmResendEmail}
                disabled={isResending}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isResending ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Resend Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Issued Modal - ELRA Branded */}
      {showMarkIssuedModal && orderToMarkIssued && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col">
            {/* Header - ELRA Branded */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <DocumentCheckIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Mark as Issued</h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      {orderToMarkIssued.poNumber} - Confirm supplier acceptance
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMarkIssuedModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <ShoppingBagIcon className="w-5 h-5 mr-2 text-blue-500" />
                    Order Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">PO Number:</span>
                      <span className="ml-2 font-medium">
                        {orderToMarkIssued.poNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="ml-2 font-medium text-green-600">
                        ₦{orderToMarkIssued.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Supplier:</span>
                      <span className="ml-2 font-medium">
                        {orderToMarkIssued.supplier?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        {orderToMarkIssued.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirmation Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmation Notes (Optional)
                  </label>
                  <textarea
                    value={confirmationNotes}
                    onChange={(e) => setConfirmationNotes(e.target.value)}
                    placeholder="Add any notes about supplier confirmation, delivery timeline, or special instructions..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These notes will be added to the order history
                  </p>
                </div>

                {/* Warning Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <DocumentCheckIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Confirm Supplier Acceptance
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        This action confirms that the supplier has accepted the
                        order and will proceed with fulfillment. Make sure you
                        have received confirmation from the supplier before
                        proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowMarkIssuedModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsIssuedSubmit}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-medium flex items-center space-x-2"
                >
                  <DocumentCheckIcon className="w-4 h-4" />
                  <span>Continue to Confirm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Issued Confirmation Modal - ELRA Branded */}
      {showMarkIssuedConfirmModal && orderToMarkIssued && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col">
            {/* Header - ELRA Branded */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <DocumentCheckIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Confirm Order Issuance
                    </h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      {orderToMarkIssued.poNumber} - Final confirmation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMarkIssuedConfirmModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-6">
                {/* Order Details */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <ShoppingBagIcon className="w-5 h-5 mr-2 text-blue-500" />
                    Order Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">PO Number:</span>
                      <span className="ml-2 font-medium">
                        {orderToMarkIssued.poNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="ml-2 font-medium text-green-600">
                        ₦{orderToMarkIssued.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Supplier:</span>
                      <span className="ml-2 font-medium">
                        {orderToMarkIssued.supplier?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Contact:</span>
                      <span className="ml-2 font-medium">
                        {orderToMarkIssued.supplier?.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirmation Notes Display */}
                {confirmationNotes && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <DocumentCheckIcon className="w-4 h-4 mr-2" />
                      Confirmation Notes
                    </h3>
                    <p className="text-blue-800 text-sm">{confirmationNotes}</p>
                  </div>
                )}

                {/* Warning Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <ClockIcon className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Final Confirmation Required
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        This will mark the order as officially issued to the
                        supplier. The supplier has confirmed acceptance and will
                        proceed with fulfillment. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowMarkIssuedConfirmModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  disabled={isMarkingIssued}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMarkAsIssued}
                  disabled={isMarkingIssued}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMarkingIssued ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <DocumentCheckIcon className="w-4 h-4" />
                      <span>Confirm Issuance</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal - ELRA Branded */}
      {showMarkPaidModal && orderToMarkPaid && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col">
            {/* Header - ELRA Branded */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <BanknotesIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Mark as Paid</h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      {orderToMarkPaid.poNumber} - Confirm payment completion
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMarkPaidModal(false)}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                  disabled={loading}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">PO Number:</span>
                      <p className="font-medium">{orderToMarkPaid.poNumber}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Supplier:</span>
                      <p className="font-medium">
                        {orderToMarkPaid.supplier?.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        Total Amount:
                      </span>
                      <p className="font-medium text-emerald-600">
                        {formatCurrency(orderToMarkPaid.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        Current Status:
                      </span>
                      <p className="font-medium capitalize">
                        {orderToMarkPaid.status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Notes (Optional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                    placeholder="Add any notes about the payment (e.g., payment method, reference number, etc.)"
                  />
                </div>

                {/* Confirmation Message */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-emerald-800">
                        Confirm Payment Completion
                      </h4>
                      <p className="text-sm text-emerald-700 mt-1">
                        This action will mark the order as paid and update the
                        payment status. The supplier will be notified of the
                        payment completion.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowMarkPaidModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaidSubmit}
                disabled={loading}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <BanknotesIcon className="h-4 w-4 mr-2" />
                Continue to Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Delivered Modal - ELRA Branded */}
      {showMarkDeliveredModal && orderToMarkDelivered && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col">
            {/* Header - ELRA Branded */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Mark as Delivered</h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      {orderToMarkDelivered.poNumber} - Confirm delivery
                      completion
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMarkDeliveredModal(false)}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                  disabled={loading}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">PO Number:</span>
                      <p className="font-medium">
                        {orderToMarkDelivered.poNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Supplier:</span>
                      <p className="font-medium">
                        {orderToMarkDelivered.supplier?.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        Total Amount:
                      </span>
                      <p className="font-medium text-blue-600">
                        {formatCurrency(orderToMarkDelivered.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        Current Status:
                      </span>
                      <p className="font-medium capitalize">
                        {orderToMarkDelivered.status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Notes (Optional)
                  </label>
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Add any notes about the delivery (e.g., delivery method, condition of items, etc.)"
                  />
                </div>

                {/* Confirmation Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">
                        Confirm Delivery Completion
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        This action will mark the order as delivered and update
                        the delivery status. The order will be considered
                        completed and ready for inventory.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowMarkDeliveredModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsDeliveredSubmit}
                disabled={loading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Continue to Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Confirmation Modal - ELRA Branded */}
      {showMarkPaidConfirmModal && orderToMarkPaid && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] flex flex-col">
            {/* Header - ELRA Branded */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <BanknotesIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Confirm Payment</h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      Final confirmation to mark as paid
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMarkPaidConfirmModal(false)}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                  disabled={isMarkingPaid}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">PO Number:</span>
                      <span className="font-medium">
                        {orderToMarkPaid.poNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Supplier:</span>
                      <span className="font-medium">
                        {orderToMarkPaid.supplier?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Amount:
                      </span>
                      <span className="font-medium text-emerald-600">
                        {formatCurrency(orderToMarkPaid.totalAmount)}
                      </span>
                    </div>
                    {paymentNotes && (
                      <div className="pt-3 border-t border-gray-200">
                        <span className="text-sm text-gray-600">
                          Payment Notes:
                        </span>
                        <p className="text-sm text-gray-800 mt-1 italic">
                          "{paymentNotes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0">
                      ⚠️
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-amber-800">
                        Are you sure you want to mark this order as paid?
                      </h4>
                      <p className="text-sm text-amber-700 mt-1">
                        This action cannot be undone. Please ensure you have
                        received payment confirmation from the supplier.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowMarkPaidConfirmModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isMarkingPaid}
              >
                Cancel
              </button>
              <button
                onClick={confirmMarkAsPaid}
                disabled={isMarkingPaid}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isMarkingPaid ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <BanknotesIcon className="h-4 w-4 mr-2" />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Delivered Confirmation Modal - ELRA Branded */}
      {showMarkDeliveredConfirmModal && orderToMarkDelivered && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] flex flex-col">
            {/* Header - ELRA Branded */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Confirm Delivery</h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      Final confirmation to mark as delivered
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMarkDeliveredConfirmModal(false)}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                  disabled={isMarkingDelivered}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">PO Number:</span>
                      <span className="font-medium">
                        {orderToMarkDelivered.poNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Supplier:</span>
                      <span className="font-medium">
                        {orderToMarkDelivered.supplier?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Amount:
                      </span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(orderToMarkDelivered.totalAmount)}
                      </span>
                    </div>
                    {deliveryNotes && (
                      <div className="pt-3 border-t border-gray-200">
                        <span className="text-sm text-gray-600">
                          Delivery Notes:
                        </span>
                        <p className="text-sm text-gray-800 mt-1 italic">
                          "{deliveryNotes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0">
                      ⚠️
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-amber-800">
                        Are you sure you want to mark this order as delivered?
                      </h4>
                      <p className="text-sm text-amber-700 mt-1">
                        This action cannot be undone. Please ensure all items
                        have been received and are in good condition.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowMarkDeliveredConfirmModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isMarkingDelivered}
              >
                Cancel
              </button>
              <button
                onClick={confirmMarkAsDelivered}
                disabled={isMarkingDelivered}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isMarkingDelivered ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Confirm Delivery
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal - ELRA Branded */}
      {showEditModal && orderToEdit && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col">
            {/* Header - ELRA Branded */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <PencilIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Edit Procurement Order
                    </h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      {orderToEdit.poNumber} - Update order details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                  disabled={isEditing}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <ShoppingBagIcon className="w-5 h-5 mr-2 text-purple-500" />
                    Current Order Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">PO Number:</span>
                      <span className="ml-2 font-medium">
                        {orderToEdit.poNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="ml-2 font-medium text-green-600">
                        ₦{orderToEdit.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Supplier:</span>
                      <span className="ml-2 font-medium">
                        {orderToEdit.supplier?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        {orderToEdit.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Project Items - Uneditable (OUTSIDE FORM) */}
                {orderToEdit.relatedProject && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <BuildingOfficeIcon className="w-5 h-5 mr-2 text-blue-500" />
                      Project Items (Read Only)
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Project Name:</span>
                          <span className="ml-2 font-medium">
                            {orderToEdit.relatedProject.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Project Code:</span>
                          <span className="ml-2 font-medium">
                            {orderToEdit.relatedProject.code}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-gray-600">Project Items:</span>
                        <div className="mt-2 space-y-2">
                          {orderToEdit.items?.map((item, index) => (
                            <div
                              key={index}
                              className="bg-white p-3 rounded-lg border"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-medium text-gray-900">
                                    {item.name}
                                  </span>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {item.description}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm text-gray-600">
                                    Qty: {item.quantity}
                                  </span>
                                  <p className="text-sm font-medium text-green-600">
                                    ₦{item.unitPrice?.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Form */}
                <form id="edit-procurement-form" className="space-y-6">
                  {/* Supplier Information */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Supplier Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Supplier Name
                        </label>
                        <input
                          type="text"
                          name="supplierName"
                          defaultValue={orderToEdit.supplier?.name || ""}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          name="supplierContactPerson"
                          defaultValue={
                            orderToEdit.supplier?.contactPerson || ""
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="supplierEmail"
                          defaultValue={orderToEdit.supplier?.email || ""}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="supplierPhone"
                          defaultValue={orderToEdit.supplier?.phone || ""}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Delivery Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Contact Person
                        </label>
                        <input
                          type="text"
                          name="deliveryContactPerson"
                          defaultValue={
                            orderToEdit.deliveryAddress?.contactPerson || ""
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Phone
                        </label>
                        <input
                          type="tel"
                          name="deliveryPhone"
                          defaultValue={
                            orderToEdit.deliveryAddress?.phone || ""
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          name="deliveryStreet"
                          defaultValue={
                            orderToEdit.deliveryAddress?.street || ""
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          name="deliveryCity"
                          defaultValue={orderToEdit.deliveryAddress?.city || ""}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          name="deliveryState"
                          defaultValue={
                            orderToEdit.deliveryAddress?.state || ""
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          name="deliveryPostalCode"
                          defaultValue={
                            orderToEdit.deliveryAddress?.postalCode || ""
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expected Delivery Date
                        </label>
                        <input
                          type="date"
                          name="expectedDeliveryDate"
                          defaultValue={
                            orderToEdit.expectedDeliveryDate
                              ? new Date(orderToEdit.expectedDeliveryDate)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Order Description */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Order Description
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        name="description"
                        defaultValue={orderToEdit.description || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="Enter order description..."
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  disabled={isEditing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={isEditing}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>Updating & Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <PencilIcon className="w-4 h-4" />
                      <span>Update & Send Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
