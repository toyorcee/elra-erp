import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  TruckIcon,
  PackageIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { receiveProcurementItems } from "../../../services/procurementAPI";
// import { downloadReceiptPDF } from "../../../utils/receiptPDFGenerator";

const ReceiptModal = ({ isOpen, onClose, procurement, onSuccess }) => {
  const [receiptData, setReceiptData] = useState({
    receivedItems: [],
    receiptNotes: "",
    receivedDate: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  // Initialize receipt data when procurement changes
  useEffect(() => {
    if (procurement && procurement.items) {
      setReceiptData({
        receivedItems: procurement.items.map((item) => ({
          itemId: item._id || item.name,
          name: item.name,
          orderedQuantity: item.quantity,
          receivedQuantity: item.receivedQuantity || 0,
          unitPrice: item.unitPrice,
          category: item.category,
          specifications: item.specifications,
        })),
        receiptNotes: "",
        receivedDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [procurement]);

  const updateReceivedQuantity = (index, quantity) => {
    const newReceivedItems = [...receiptData.receivedItems];
    newReceivedItems[index].receivedQuantity = Math.min(
      quantity,
      newReceivedItems[index].orderedQuantity
    );
    setReceiptData({ ...receiptData, receivedItems: newReceivedItems });
  };

  const calculateTotalReceived = () => {
    return receiptData.receivedItems.reduce((sum, item) => {
      return sum + item.receivedQuantity * item.unitPrice;
    }, 0);
  };

  const getReceiptStatus = (item) => {
    if (item.receivedQuantity === 0) return "pending";
    if (item.receivedQuantity >= item.orderedQuantity) return "complete";
    return "partial";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "complete":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "partial":
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case "pending":
        return <PackageIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <PackageIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await receiveProcurementItems(
        procurement._id,
        receiptData
      );
      if (response.success) {
        toast.success("Items received successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to receive items");
      }
    } catch (error) {
      console.error("Error receiving items:", error);
      toast.error("Error receiving items");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !procurement) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 rounded-lg mr-4 bg-green-100 text-green-600">
              <TruckIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Receive Items
              </h2>
              <p className="text-gray-600 mt-1">
                Record received items for{" "}
                {procurement.poNumber || procurement.title}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Procurement Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Order
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {procurement.poNumber || procurement.title}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {procurement.supplier?.name || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Order Value
                </label>
                <p className="text-lg font-semibold text-[var(--elra-primary)]">
                  ₦
                  {new Intl.NumberFormat().format(procurement.totalAmount || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Receipt Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Date *
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  required
                  value={receiptData.receivedDate}
                  onChange={(e) =>
                    setReceiptData({
                      ...receiptData,
                      receivedDate: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Items Receipt */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PackageIcon className="h-5 w-5 mr-2 text-[var(--elra-primary)]" />
              Items Receipt
            </h3>

            <div className="space-y-4">
              {receiptData.receivedItems.map((item, index) => {
                const status = getReceiptStatus(item);
                return (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {getStatusIcon(status)}
                        <div className="ml-3">
                          <h4 className="font-medium text-gray-900">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Category: {item.category.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          status
                        )}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ordered Quantity
                        </label>
                        <div className="text-lg font-semibold text-gray-900">
                          {item.orderedQuantity}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Received Quantity *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          max={item.orderedQuantity}
                          value={item.receivedQuantity}
                          onChange={(e) =>
                            updateReceivedQuantity(
                              index,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Item Value
                        </label>
                        <div className="text-lg font-semibold text-[var(--elra-primary)]">
                          ₦
                          {new Intl.NumberFormat().format(
                            item.receivedQuantity * item.unitPrice
                          )}
                        </div>
                      </div>
                    </div>

                    {item.specifications && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Specifications
                        </h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {item.specifications.brand && (
                            <div>
                              <span className="text-gray-600">Brand:</span>
                              <span className="ml-2 font-medium">
                                {item.specifications.brand}
                              </span>
                            </div>
                          )}
                          {item.specifications.model && (
                            <div>
                              <span className="text-gray-600">Model:</span>
                              <span className="ml-2 font-medium">
                                {item.specifications.model}
                              </span>
                            </div>
                          )}
                          {item.specifications.year && (
                            <div>
                              <span className="text-gray-600">Year:</span>
                              <span className="ml-2 font-medium">
                                {item.specifications.year}
                              </span>
                            </div>
                          )}
                          {item.specifications.serialNumber && (
                            <div>
                              <span className="text-gray-600">Serial:</span>
                              <span className="ml-2 font-medium">
                                {item.specifications.serialNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-[var(--elra-primary)] bg-opacity-10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">
                  Total Received Value:
                </span>
                <span className="text-2xl font-bold text-[var(--elra-primary)]">
                  ₦{new Intl.NumberFormat().format(calculateTotalReceived())}
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Notes
            </label>
            <textarea
              value={receiptData.receiptNotes}
              onChange={(e) =>
                setReceiptData({ ...receiptData, receiptNotes: e.target.value })
              }
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              placeholder="Enter any notes about the received items, condition, or special instructions"
            />
          </div>

          {/* Inventory Creation Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium text-green-800">
                  Inventory Creation
                </h4>
                <p className="text-sm text-green-700">
                  Received items will automatically be added to the inventory
                  system for tracking and management.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Receiving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Receive Items
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiptModal;
