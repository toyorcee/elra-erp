import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  HiOutlinePlus,
  HiOutlineLocationMarker,
  HiOutlineQrcode,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineChartBar,
  HiOutlineWifi,
} from "react-icons/hi";

const AssetTracking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [formData, setFormData] = useState({
    assetCode: "",
    name: "",
    category: "",
    location: "",
    status: "active",
    purchaseDate: "",
    warrantyExpiry: "",
    assignedTo: "",
    department: "",
    specifications: "",
    monitoringEnabled: true,
    alertThreshold: 30,
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/inventory/assets", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/inventory/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          assetCode: "",
          name: "",
          category: "",
          location: "",
          status: "active",
          purchaseDate: "",
          warrantyExpiry: "",
          assignedTo: "",
          department: "",
          specifications: "",
          monitoringEnabled: true,
          alertThreshold: 30,
        });
        fetchAssets();
      }
    } catch (error) {
      console.error("Error creating asset:", error);
    }
  };

  const generateAssetCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const code = `ASSET-${timestamp}-${random}`;
    setFormData({ ...formData, assetCode: code });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "retired":
        return "bg-red-100 text-red-800";
      case "lost":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMonitoringStatus = (asset) => {
    if (!asset.monitoringEnabled) {
      return {
        color: "text-gray-500",
        icon: <HiOutlineChartBar className="h-4 w-4" />,
        text: "Disabled",
      };
    }

    if (
      asset.lastSeen &&
      new Date(asset.lastSeen) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ) {
      return {
        color: "text-green-500",
        icon: <HiOutlineWifi className="h-4 w-4" />,
        text: "Online",
      };
    } else {
      return {
        color: "text-red-500",
        icon: <HiOutlineExclamation className="h-4 w-4" />,
        text: "Offline",
      };
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Asset Tracking System
            </h1>
            <p className="text-gray-600">
              Monitor and track equipment assets with real-time status updates
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center"
          >
            <HiOutlinePlus className="mr-2" />
            Add Asset
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <HiOutlineQrcode className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900">
                {assets.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <HiOutlineCheckCircle className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {assets.filter((asset) => asset.status === "active").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <HiOutlineClock className="h-8 w-8 text-yellow-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  assets.filter((asset) => asset.status === "maintenance")
                    .length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <HiOutlineWifi className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Online</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  assets.filter(
                    (asset) =>
                      asset.monitoringEnabled &&
                      asset.lastSeen &&
                      new Date(asset.lastSeen) >
                        new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => {
          const monitoringStatus = getMonitoringStatus(asset);
          return (
            <div
              key={asset._id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <HiOutlineQrcode className="h-6 w-6 text-[var(--elra-primary)] mr-2" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {asset.name}
                    </h3>
                    <p className="text-sm text-gray-500">{asset.assetCode}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      asset.status
                    )}`}
                  >
                    {asset.status}
                  </span>
                  <div
                    className={`flex items-center ${monitoringStatus.color}`}
                  >
                    {monitoringStatus.icon}
                    <span className="ml-1 text-xs">
                      {monitoringStatus.text}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <HiOutlineLocationMarker className="h-4 w-4 mr-2" />
                  {asset.location || "Location not set"}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Category:</span>{" "}
                  {asset.category}
                </div>
                {asset.assignedTo && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Assigned to:</span>{" "}
                    {asset.assignedTo}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>
                  Added: {new Date(asset.createdAt).toLocaleDateString()}
                </span>
                {asset.purchaseDate && (
                  <span>
                    Purchased:{" "}
                    {new Date(asset.purchaseDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedAsset(asset)}
                  className="flex-1 bg-blue-50 text-blue-700 py-2 px-3 rounded-md hover:bg-blue-100 transition-colors text-sm"
                >
                  <HiOutlineEye className="inline mr-1" />
                  View
                </button>
                <button
                  onClick={() =>
                    navigate(
                      `/dashboard/modules/inventory/asset/${asset._id}/edit`
                    )
                  }
                  className="flex-1 bg-indigo-50 text-indigo-700 py-2 px-3 rounded-md hover:bg-indigo-100 transition-colors text-sm"
                >
                  <HiOutlinePencil className="inline mr-1" />
                  Edit
                </button>
                <button className="flex-1 bg-red-50 text-red-700 py-2 px-3 rounded-md hover:bg-red-100 transition-colors text-sm">
                  <HiOutlineTrash className="inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Asset Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add New Asset
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateAsset}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Code
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        required
                        value={formData.assetCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            assetCode: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                        placeholder="ASSET-123456-ABC"
                      />
                      <button
                        type="button"
                        onClick={generateAssetCode}
                        className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300 transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    >
                      <option value="">Select Category</option>
                      <option value="equipment">Equipment</option>
                      <option value="machinery">Machinery</option>
                      <option value="vehicles">Vehicles</option>
                      <option value="electronics">Electronics</option>
                      <option value="furniture">Furniture</option>
                      <option value="tools">Tools</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                      placeholder="Warehouse A-15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="retired">Retired</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchaseDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      value={formData.assignedTo}
                      onChange={(e) =>
                        setFormData({ ...formData, assignedTo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                      placeholder="Employee name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                      placeholder="Operations"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specifications
                  </label>
                  <textarea
                    value={formData.specifications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specifications: e.target.value,
                      })
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                    placeholder="Brand, model, year, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="monitoringEnabled"
                      checked={formData.monitoringEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monitoringEnabled: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded"
                    />
                    <label
                      htmlFor="monitoringEnabled"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Enable Monitoring
                    </label>
                  </div>
                  {formData.monitoringEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alert Threshold (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.alertThreshold}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alertThreshold: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-md hover:bg-[var(--elra-primary-dark)] transition-colors"
                  >
                    Add Asset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Asset Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Asset Details
                </h3>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Asset Code
                    </p>
                    <p className="text-sm text-gray-900">
                      {selectedAsset.assetCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        selectedAsset.status
                      )}`}
                    >
                      {selectedAsset.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-sm text-gray-900">
                      {selectedAsset.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Category
                    </p>
                    <p className="text-sm text-gray-900">
                      {selectedAsset.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Location
                    </p>
                    <p className="text-sm text-gray-900">
                      {selectedAsset.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Monitoring
                    </p>
                    <div className="flex items-center">
                      {getMonitoringStatus(selectedAsset).icon}
                      <span
                        className={`ml-1 text-sm ${
                          getMonitoringStatus(selectedAsset).color
                        }`}
                      >
                        {getMonitoringStatus(selectedAsset).text}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedAsset.specifications && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Specifications
                    </p>
                    <p className="text-sm text-gray-900">
                      {selectedAsset.specifications}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Added Date
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedAsset.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedAsset.purchaseDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Purchase Date
                      </p>
                      <p className="text-sm text-gray-900">
                        {new Date(
                          selectedAsset.purchaseDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetTracking;
