import React, { useState, useEffect } from "react";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";

const PendingApprovals = () => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Pending Approvals.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      // Mock data for now
      setPendingApprovals([
        {
          id: 1,
          type: "Purchase Order",
          requester: "John Doe",
          amount: 500000,
          date: "2024-02-15",
          priority: "High",
        },
        {
          id: 2,
          type: "Equipment Request",
          requester: "Jane Smith",
          amount: 250000,
          date: "2024-02-14",
          priority: "Medium",
        },
        {
          id: 3,
          type: "Service Contract",
          requester: "Mike Johnson",
          amount: 750000,
          date: "2024-02-13",
          priority: "Low",
        },
      ]);
    } catch (error) {
      console.error("Error loading pending approvals:", error);
      toast.error("Error loading pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id) => {
    toast.success(`Approved request ${id}`);
    // Update the list to remove approved item
    setPendingApprovals((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReject = (id) => {
    toast.error(`Rejected request ${id}`);
    // Update the list to remove rejected item
    setPendingApprovals((prev) => prev.filter((item) => item.id !== id));
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
              Pending Approvals
            </h1>
            <p className="text-gray-600">
              Review and approve pending purchase requests
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingApprovals.map((approval) => (
          <div
            key={approval.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-orange-500">
                <ExclamationTriangleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {approval.type}
                </h3>
                <p className="text-sm text-gray-600">
                  Priority: {approval.priority}
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Requester:</span>
                <span className="font-medium ml-1">{approval.requester}</span>
              </div>
              <div className="flex items-center text-sm">
                <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium ml-1">
                  ₦{new Intl.NumberFormat().format(approval.amount)}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Date:</span>
                <span className="font-medium ml-1">
                  {new Date(approval.date).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm hover:bg-blue-100 flex items-center justify-center">
                <EyeIcon className="h-4 w-4 mr-1" />
                View Details
              </button>
              <button
                onClick={() => handleApprove(approval.id)}
                className="bg-green-500 text-white px-3 py-2 rounded-md text-sm hover:bg-green-600 flex items-center"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Approve
              </button>
              <button
                onClick={() => handleReject(approval.id)}
                className="bg-red-500 text-white px-3 py-2 rounded-md text-sm hover:bg-red-600 flex items-center"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingApprovals;
