import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
} from "../../../services/procurementAPI";

const ProcurementModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const isEditMode = !!editData;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
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
        totalPrice: 0,
        category: "equipment",
        specifications: {
          brand: "",
          model: "",
          year: "",
          serialNumber: "",
        },
      },
    ],
    priority: "medium",
    expectedDeliveryDate: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  // Initialize form data when editData changes
  useEffect(() => {
    if (editData && isEditMode) {
      setFormData({
        title: editData.title || "",
        description: editData.description || "",
        supplier: {
          name: editData.supplier?.name || "",
          contactPerson: editData.supplier?.contactPerson || "",
          email: editData.supplier?.email || "",
          phone: editData.supplier?.phone || "",
          address: {
            street: editData.supplier?.address?.street || "",
            city: editData.supplier?.address?.city || "",
            state: editData.supplier?.address?.state || "",
            postalCode: editData.supplier?.address?.postalCode || "",
          },
        },
        items:
          editData.items?.length > 0
            ? editData.items.map((item) => ({
                ...item,
                totalPrice: item.quantity * item.unitPrice,
              }))
            : [
                {
                  name: "",
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                  totalPrice: 0,
                  category: "equipment",
                  specifications: {
                    brand: "",
                    model: "",
                    year: "",
                    serialNumber: "",
                  },
                },
              ],
        priority: editData.priority || "medium",
        expectedDeliveryDate: editData.expectedDeliveryDate
          ? new Date(editData.expectedDeliveryDate).toISOString().split("T")[0]
          : "",
        notes: editData.notes || "",
      });
    } else {
      // Reset form for create mode
      setFormData({
        title: "",
        description: "",
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
            totalPrice: 0,
            category: "equipment",
            specifications: {
              brand: "",
              model: "",
              year: "",
              serialNumber: "",
            },
          },
        ],
        priority: "medium",
        expectedDeliveryDate: "",
        notes: "",
      });
    }
  }, [editData, isEditMode]);

  const itemCategories = [
    { value: "equipment", label: "Equipment" },
    { value: "vehicle", label: "Vehicle" },
    { value: "property", label: "Property" },
    { value: "furniture", label: "Furniture" },
    { value: "electronics", label: "Electronics" },
    { value: "office_supplies", label: "Office Supplies" },
    { value: "maintenance_parts", label: "Maintenance Parts" },
    { value: "other", label: "Other" },
  ];

  const priorities = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
    {
      value: "medium",
      label: "Medium",
      color: "bg-yellow-100 text-yellow-800",
    },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
    { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
  ];

  const calculateItemTotal = (item) => {
    return item.quantity * item.unitPrice;
  };

  const updateItemTotal = (index) => {
    const newItems = [...formData.items];
    newItems[index].totalPrice = calculateItemTotal(newItems[index]);
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          name: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          category: "equipment",
          specifications: {
            brand: "",
            model: "",
            year: "",
            serialNumber: "",
          },
        },
      ],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      newItems[index][parent][child] = value;
    } else {
      newItems[index][field] = value;
    }
    setFormData({ ...formData, items: newItems });
    updateItemTotal(index);
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const procurementData = {
        ...formData,
        subtotal: calculateTotal(),
        totalAmount: calculateTotal(),
        orderDate: isEditMode ? editData.orderDate : new Date().toISOString(),
      };

      let response;
      if (isEditMode) {
        response = await updatePurchaseOrder(editData._id, procurementData);
      } else {
        response = await createPurchaseOrder(procurementData);
      }

      if (response.success) {
        toast.success(
          isEditMode
            ? "Purchase order updated successfully!"
            : "Purchase order created successfully!"
        );
        onSuccess();
        onClose();
      } else {
        toast.error(
          response.message ||
            `Failed to ${isEditMode ? "update" : "create"} purchase order`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} purchase order:`,
        error
      );
      toast.error(
        `Error ${isEditMode ? "updating" : "creating"} purchase order`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div
              className={`p-2 rounded-lg mr-4 ${
                isEditMode
                  ? "bg-blue-100 text-blue-600"
                  : "bg-[var(--elra-primary)] bg-opacity-10 text-[var(--elra-primary)]"
              }`}
            >
              {isEditMode ? (
                <PencilIcon className="h-6 w-6" />
              ) : (
                <PlusIcon className="h-6 w-6" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? "Edit Purchase Order" : "Create Purchase Order"}
              </h2>
              <p className="text-gray-600 mt-1">
                {isEditMode
                  ? "Update the purchase order details"
                  : "Create a new purchase order for inventory items"}
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                placeholder="Enter order title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              placeholder="Describe the purchase order requirements"
            />
          </div>

          {/* Supplier Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2 text-[var(--elra-primary)]" />
              Supplier Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.supplier.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supplier: {
                        ...formData.supplier,
                        name: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
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
                    setFormData({
                      ...formData,
                      supplier: {
                        ...formData.supplier,
                        contactPerson: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
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
                    setFormData({
                      ...formData,
                      supplier: {
                        ...formData.supplier,
                        email: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
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
                    setFormData({
                      ...formData,
                      supplier: {
                        ...formData.supplier,
                        phone: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  placeholder="Enter supplier phone"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-[var(--elra-primary)]" />
                Order Items
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] flex items-center text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
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
                          updateItem(index, "name", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                        placeholder="Enter item name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) =>
                          updateItem(index, "category", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      >
                        {itemCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
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
                          updateItem(
                            index,
                            "quantity",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
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
                          updateItem(
                            index,
                            "unitPrice",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
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
                          updateItem(
                            index,
                            "specifications.brand",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
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
                          updateItem(
                            index,
                            "specifications.model",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                        placeholder="Enter model"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        Total Price:
                      </span>
                      <span className="text-lg font-bold text-[var(--elra-primary)]">
                        ₦{new Intl.NumberFormat().format(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[var(--elra-primary)] bg-opacity-10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">
                  Total Order Amount:
                </span>
                <span className="text-2xl font-bold text-[var(--elra-primary)]">
                  ₦{new Intl.NumberFormat().format(calculateTotal())}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedDeliveryDate: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
              placeholder="Enter any additional notes or special instructions"
            />
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
              className={`px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                isEditMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)]"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Update Purchase Order
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Purchase Order
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcurementModal;
