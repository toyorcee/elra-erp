import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  PackageIcon,
  CurrencyDollarIcon,
  PlusIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

const ProjectItemsModal = ({ isOpen, onClose, project, onItemsSelected }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project && project.projectItems) {
      // Pre-select all items by default
      setSelectedItems(
        project.projectItems.map((item, index) => ({
          ...item,
          selected: true,
          index,
        }))
      );
    }
  }, [project]);

  const toggleItemSelection = (index) => {
    setSelectedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleCreateProcurement = () => {
    const itemsToProcure = selectedItems.filter((item) => item.selected);

    if (itemsToProcure.length === 0) {
      toast.warning("Please select at least one item for procurement");
      return;
    }

    onItemsSelected(itemsToProcure);
    onClose();
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 rounded-lg mr-4 bg-[var(--elra-primary)] bg-opacity-10 text-[var(--elra-primary)]">
              <PackageIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Project Items for Procurement
              </h2>
              <p className="text-gray-600 mt-1">
                Select items from {project.name} to create procurement order
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

        {/* Project Info */}
        <div className="bg-blue-50 rounded-lg mx-6 mt-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {project.name}
              </p>
              <p className="text-sm text-gray-600">Code: {project.code}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget
              </label>
              <p className="text-lg font-semibold text-[var(--elra-primary)]">
                ₦{new Intl.NumberFormat().format(project.budget || 0)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Items Count
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {project.projectItems?.length || 0} items
              </p>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Available Items
            </h3>
            <div className="text-sm text-gray-600">
              {selectedItems.filter((item) => item.selected).length} of{" "}
              {selectedItems.length} selected
            </div>
          </div>

          {project.projectItems && project.projectItems.length > 0 ? (
            <div className="space-y-4">
              {selectedItems.map((item, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-colors ${
                    item.selected
                      ? "border-[var(--elra-primary)] bg-[var(--elra-primary)] bg-opacity-5"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleItemSelection(index)}
                        className="mt-1 h-4 w-4 text-[var(--elra-primary)] border-gray-300 rounded focus:ring-[var(--elra-primary)]"
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {item.name}
                          </h4>
                          <span className="text-sm font-semibold text-[var(--elra-primary)]">
                            ₦
                            {new Intl.NumberFormat().format(
                              item.totalPrice || 0
                            )}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {item.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Quantity:</span>
                            <span className="ml-2 font-medium">
                              {item.quantity}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Unit Price:</span>
                            <span className="ml-2 font-medium">
                              ₦
                              {new Intl.NumberFormat().format(
                                item.unitPrice || 0
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total:</span>
                            <span className="ml-2 font-medium">
                              ₦
                              {new Intl.NumberFormat().format(
                                item.totalPrice || 0
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Timeline:</span>
                            <span className="ml-2 font-medium">
                              {item.deliveryTimeline}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <PackageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Project Items Available
              </h3>
              <p className="text-gray-600">
                This project doesn't have any items defined for procurement.
              </p>
            </div>
          )}

          {/* Summary */}
          {selectedItems.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Selected Items Total:
                  </span>
                  <span className="ml-2 text-lg font-semibold text-[var(--elra-primary)]">
                    ₦
                    {new Intl.NumberFormat().format(
                      selectedItems
                        .filter((item) => item.selected)
                        .reduce((sum, item) => sum + (item.totalPrice || 0), 0)
                    )}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedItems.filter((item) => item.selected).length} items
                  selected
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          {project.projectItems && project.projectItems.length > 0 && (
            <button
              onClick={handleCreateProcurement}
              disabled={
                selectedItems.filter((item) => item.selected).length === 0
              }
              className="px-6 py-3 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Procurement Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectItemsModal;
