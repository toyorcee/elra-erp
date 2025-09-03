import React from "react";
import { HiXMark, HiExclamationTriangle, HiTrash } from "react-icons/hi2";

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  item,
  itemType = "item",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <HiExclamationTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Confirm Deletion</h2>
                <p className="text-white text-opacity-90 text-sm">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-white text-opacity-80 hover:text-opacity-100 transition-colors"
            >
              <HiXMark className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <HiTrash className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete {itemType}?
            </h3>
            <p className="text-gray-600">
              Are you sure you want to delete this {itemType}? This action
              cannot be undone.
            </p>
          </div>

          {/* Item Preview */}
          {item && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Item Details:</h4>
              <div className="space-y-2 text-sm text-gray-600">
                {item.leaveType && (
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium capitalize">
                      {item.leaveType}
                    </span>
                  </div>
                )}
                {item.startDate && item.endDate && (
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span className="font-medium">
                      {new Date(item.startDate).toLocaleDateString()} -{" "}
                      {new Date(item.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {item.days && (
                  <div className="flex justify-between">
                    <span>Days:</span>
                    <span className="font-medium">{item.days} day(s)</span>
                  </div>
                )}
                {item.reason && (
                  <div className="flex justify-between">
                    <span>Reason:</span>
                    <span
                      className="font-medium max-w-xs truncate"
                      title={item.reason}
                    >
                      {item.reason}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <HiTrash className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
