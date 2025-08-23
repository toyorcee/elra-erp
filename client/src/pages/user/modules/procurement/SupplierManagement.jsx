import React, { useState, useEffect } from "react";
import {
  BuildingStorefrontIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";

const SupplierManagement = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
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
            You don't have permission to access Supplier Management.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      // Mock data for now
      setSuppliers([
        {
          id: 1,
          name: "ABC Equipment Ltd",
          contact: "John Smith",
          phone: "+234 801 234 5678",
          email: "john@abcequipment.com",
          address: "Lagos, Nigeria",
          category: "Construction Equipment",
        },
        {
          id: 2,
          name: "Tech Solutions Inc",
          contact: "Jane Doe",
          phone: "+234 802 345 6789",
          email: "jane@techsolutions.com",
          address: "Abuja, Nigeria",
          category: "IT Equipment",
        },
        {
          id: 3,
          name: "Office Supplies Co",
          contact: "Mike Johnson",
          phone: "+234 803 456 7890",
          email: "mike@officesupplies.com",
          address: "Port Harcourt, Nigeria",
          category: "Office Equipment",
        },
      ]);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      toast.error("Error loading suppliers");
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Supplier Management
            </h1>
            <p className="text-gray-600">
              Manage supplier information and relationships
            </p>
          </div>
          <button className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Supplier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-green-500">
                <BuildingStorefrontIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {supplier.name}
                </h3>
                <p className="text-sm text-gray-600">{supplier.category}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Contact:</span>
                <span className="font-medium ml-1">{supplier.contact}</span>
              </div>
              <div className="flex items-center text-sm">
                <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium ml-1">{supplier.phone}</span>
              </div>
              <div className="flex items-center text-sm">
                <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Email:</span>
                <span className="font-medium ml-1">{supplier.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Address:</span>
                <span className="font-medium ml-1">{supplier.address}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm hover:bg-blue-100 flex items-center justify-center">
                <EyeIcon className="h-4 w-4 mr-1" />
                View Details
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <PencilIcon className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-red-600">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplierManagement;
