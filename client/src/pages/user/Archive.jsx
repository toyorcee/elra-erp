import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  HiDocument,
  HiScanner,
  HiArchive,
  HiSearch,
  HiFilter,
  HiCalendar,
  HiFolder,
  HiBox,
  HiEye,
  HiDownload,
  HiRefresh,
  HiPlus,
} from "react-icons/hi";
import GradientSpinner from "../../components/common/GradientSpinner";

const Archive = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanners, setScanners] = useState([]);
  const [selectedScanner, setSelectedScanner] = useState("");
  const [scanning, setScanning] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    year: new Date().getFullYear(),
    status: "",
    documentType: "",
  });
  const [archiveStats, setArchiveStats] = useState(null);

  // Archive batch state
  const [archiveBatch, setArchiveBatch] = useState({
    title: "",
    category: "",
    description: "",
    boxNumber: "",
    folderNumber: "",
    archiveLocation: "",
    originalDate: "",
    notes: "",
  });

  // Scan options
  const [scanOptions, setScanOptions] = useState({
    resolution: 300,
    format: "jpeg",
    quality: 90,
    pageSize: "A4",
    colorMode: "color",
  });

  useEffect(() => {
    fetchDocuments();
    fetchScanners();
    fetchArchiveStats();
  }, [filters]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/documents/search?${new URLSearchParams({
          ...filters,
          page: 1,
          limit: 50,
          sortBy: "createdAt",
          sortOrder: "desc",
        })}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setDocuments(data.data.documents);
      } else {
        toast.error("Failed to fetch documents");
      }
    } catch (error) {
      toast.error("Error fetching documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchScanners = async () => {
    try {
      const response = await fetch("/api/scanning/scanners", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setScanners(data.data.scanners);
        if (data.data.scanners.length > 0) {
          setSelectedScanner(data.data.scanners[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching scanners:", error);
    }
  };

  const fetchArchiveStats = async () => {
    try {
      const response = await fetch(
        `/api/scanning/archive/stats?year=${filters.year}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setArchiveStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching archive stats:", error);
    }
  };

  const handleScanDocument = async () => {
    if (!selectedScanner) {
      toast.error("Please select a scanner");
      return;
    }

    setScanning(true);
    try {
      const response = await fetch("/api/scanning/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          scannerId: selectedScanner,
          options: scanOptions,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Document scanned successfully!");
        setShowScanModal(false);
        fetchDocuments();
      } else {
        toast.error(data.message || "Failed to scan document");
      }
    } catch (error) {
      toast.error("Error scanning document");
    } finally {
      setScanning(false);
    }
  };

  const handleCreateArchiveBatch = async () => {
    try {
      const response = await fetch("/api/scanning/archive/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          metadata: archiveBatch,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          `Archive batch created: ${data.data.archiveBatch.archiveReference}`
        );
        setShowArchiveModal(false);
        setArchiveBatch({
          title: "",
          category: "",
          description: "",
          boxNumber: "",
          folderNumber: "",
          archiveLocation: "",
          originalDate: "",
          notes: "",
        });
        fetchArchiveStats();
      } else {
        toast.error(data.message || "Failed to create archive batch");
      }
    } catch (error) {
      toast.error("Error creating archive batch");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-800",
      SUBMITTED: "bg-blue-100 text-blue-800",
      UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      ARCHIVED: "bg-purple-100 text-purple-800",
      EXPIRED: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <HiArchive className="mr-2 text-purple-600" />
                Document Archive
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and organize your document archive with scanning
                capabilities
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowArchiveModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <HiPlus className="mr-2" />
                Create Archive Batch
              </button>
              <button
                onClick={() => setShowScanModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <HiScanner className="mr-2" />
                Scan Document
              </button>
            </div>
          </div>
        </div>

        {/* Archive Statistics */}
        {archiveStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <HiFolder className="text-blue-600 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {archiveStats.summary.totalCategories}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <HiDocument className="text-green-600 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {archiveStats.summary.totalDocuments}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <HiBox className="text-purple-600 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Size</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatFileSize(archiveStats.summary.totalSize)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <HiEye className="text-orange-600 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Avg OCR Confidence</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(archiveStats.summary.avgConfidence)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <HiFilter className="mr-2" />
              Filters
            </h2>
            <button
              onClick={fetchDocuments}
              className="text-blue-600 hover:text-blue-700 flex items-center"
            >
              <HiRefresh className="mr-1" />
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="Legal">Legal</option>
              <option value="IT">IT</option>
              <option value="Operations">Operations</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Executive">Executive</option>
            </select>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from(
                { length: 10 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ARCHIVED">Archived</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <select
              value={filters.documentType}
              onChange={(e) =>
                setFilters({ ...filters, documentType: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Invoice">Invoice</option>
              <option value="Contract">Contract</option>
              <option value="Receipt">Receipt</option>
              <option value="Report">Report</option>
              <option value="Certificate">Certificate</option>
              <option value="Letter">Letter</option>
              <option value="Scanned Document">Scanned Document</option>
            </select>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <HiDocument className="mr-2" />
              Documents ({documents.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <GradientSpinner />
              <p className="text-gray-600 mt-4">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center">
              <HiDocument className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-gray-600">No documents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OCR Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <HiDocument className="text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {doc.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatFileSize(doc.fileSize)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            doc.status
                          )}`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.ocrData?.confidence
                          ? `${Math.round(doc.ocrData.confidence)}%`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <HiEye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <HiDownload className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Scan Document</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scanner
                </label>
                <select
                  value={selectedScanner}
                  onChange={(e) => setSelectedScanner(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {scanners.map((scanner) => (
                    <option key={scanner.id} value={scanner.id}>
                      {scanner.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution (DPI)
                </label>
                <select
                  value={scanOptions.resolution}
                  onChange={(e) =>
                    setScanOptions({
                      ...scanOptions,
                      resolution: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value={150}>150 DPI</option>
                  <option value={300}>300 DPI</option>
                  <option value={600}>600 DPI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={scanOptions.format}
                  onChange={(e) =>
                    setScanOptions({ ...scanOptions, format: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowScanModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleScanDocument}
                disabled={scanning}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {scanning ? "Scanning..." : "Scan Document"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Batch Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Archive Batch</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={archiveBatch.title}
                  onChange={(e) =>
                    setArchiveBatch({ ...archiveBatch, title: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Archive batch title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={archiveBatch.category}
                  onChange={(e) =>
                    setArchiveBatch({
                      ...archiveBatch,
                      category: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select Category</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="Legal">Legal</option>
                  <option value="IT">IT</option>
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Box Number
                  </label>
                  <input
                    type="number"
                    value={archiveBatch.boxNumber}
                    onChange={(e) =>
                      setArchiveBatch({
                        ...archiveBatch,
                        boxNumber: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Box #"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folder Number
                  </label>
                  <input
                    type="number"
                    value={archiveBatch.folderNumber}
                    onChange={(e) =>
                      setArchiveBatch({
                        ...archiveBatch,
                        folderNumber: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Folder #"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archive Location
                </label>
                <input
                  type="text"
                  value={archiveBatch.archiveLocation}
                  onChange={(e) =>
                    setArchiveBatch({
                      ...archiveBatch,
                      archiveLocation: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Storage Room A, Shelf 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={archiveBatch.description}
                  onChange={(e) =>
                    setArchiveBatch({
                      ...archiveBatch,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Archive batch description"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateArchiveBatch}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;
