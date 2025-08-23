import React, { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  CubeIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  EyeIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { fetchAvailableItems } from "../../../../services/inventoryAPI.js";
import { toast } from "react-toastify";

const AvailableItems = () => {
  const { user } = useAuth();
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    condition: "all",
  });

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access Available Items.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadAvailableItems();
  }, []);

  const loadAvailableItems = async () => {
    setLoading(true);
    try {
      const response = await fetchAvailableItems();
      if (response.success) {
        setAvailableItems(response.data);
      } else {
        toast.error("Failed to load available items");
      }
    } catch (error) {
      console.error("Error loading available items:", error);
      toast.error("Error loading available items");
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Items</h1>
            <p className="text-gray-600">View and manage available leaseable items</p>
          </div>
          <button className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Item
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              >
                <option value="all">All Categories</option>
                <option value="construction">Construction Equipment</option>
                <option value="it">IT Equipment</option>
                <option value="office">Office Equipment</option>
                <option value="vehicles">Vehicles</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={filters.condition}
                onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              >
                <option value="all">All Conditions</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Available Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableItems.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-green-500">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <CubeIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Condition:</span>
                  <span className="font-medium ml-1 capitalize">{item.condition}</span>
                </div>
                <div className="flex items-center text-sm">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Lease Price:</span>
                  <span className="font-medium ml-1">
                    ₦{new Intl.NumberFormat().format(item.leasePrice || 0)}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium ml-1">{item.location || "Not specified"}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm hover:bg-blue-100 flex items-center justify-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View Details
                </button>
                <button className="bg-[var(--elra-primary)] text-white px-3 py-2 rounded-md text-sm hover:bg-[var(--elra-primary-dark)]">
                  Lease
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvailableItems;
