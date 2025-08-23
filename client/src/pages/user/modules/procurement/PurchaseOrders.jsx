import React, { useState, useEffect } from "react";
import {
  ShoppingCartIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { fetchPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } from "../../../../services/procurementAPI.js";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";

const PurchaseOrders = () => {
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

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access Purchase Orders.</p>
        </div>
      </div>
    );
  }

  const orderStatuses = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    { value: "approved", label: "Approved", color: "bg-green-100 text-green-800" },
    { value: "delivered", label: "Delivered", color: "bg-blue-100 text-blue-800" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
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
    const statusConfig = orderStatuses.find(s => s.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusConfig?.label || status}
      </span>
    );
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
                expectedDelivery: order.expectedDelivery.split('T')[0],
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
    if (!window.confirm("Are you sure you want to delete this purchase order?")) {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
            <p className="text-gray-600">Create and manage purchase orders for inventory</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Order
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
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
      </div>
    </div>
  );
};

export default PurchaseOrders;
