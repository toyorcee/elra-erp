import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { GradientSpinner } from "../../../components/common";
import {
  FaFileAlt,
  FaUpload,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEdit,
  FaTrash,
  FaEye,
} from "react-icons/fa";

const Documents = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  // Mock data - replace with actual API calls
  const documents = [
    {
      id: 1,
      title: "Employee Handbook 2024",
      category: "HR",
      uploadedBy: "John Doe",
      uploadedAt: "2024-01-15",
      fileSize: "2.5 MB",
      fileType: "PDF",
    },
    {
      id: 2,
      title: "Q4 Financial Report",
      category: "Finance",
      uploadedBy: "Jane Smith",
      uploadedAt: "2024-01-10",
      fileSize: "1.8 MB",
      fileType: "PDF",
    },
    {
      id: 3,
      title: "Procurement Guidelines",
      category: "Procurement",
      uploadedBy: "Mike Johnson",
      uploadedAt: "2024-01-08",
      fileSize: "3.2 MB",
      fileType: "DOCX",
    },
  ];

  const categories = [
    "all",
    "HR",
    "Finance",
    "Procurement",
    "Payroll",
    "Projects",
    "Communication",
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDocumentAction = (action, documentId) => {
    console.log(`${action} document ${documentId}`);
    // Implement document actions here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GradientSpinner variant="white-green" size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Document Management
        </h1>
        <p className="text-gray-600">
          Store, organize, and manage all your documents in one place.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>

            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {viewMode === "grid" ? "List View" : "Grid View"}
            </button>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <FaUpload />
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Documents Display */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Documents ({filteredDocuments.length})
          </h2>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <FaFileAlt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No documents found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or upload a new document.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaFileAlt className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDocumentAction("view", doc.id)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleDocumentAction("edit", doc.id)}
                        className="p-1 text-gray-400 hover:text-green-600"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDocumentAction("delete", doc.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2">
                    {doc.title}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Category:</span>{" "}
                      {doc.category}
                    </p>
                    <p>
                      <span className="font-medium">Uploaded by:</span>{" "}
                      {doc.uploadedBy}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {doc.uploadedAt}
                    </p>
                    <p>
                      <span className="font-medium">Size:</span> {doc.fileSize}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleDocumentAction("download", doc.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaDownload />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaFileAlt className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {doc.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {doc.fileType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.uploadedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.uploadedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.fileSize}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDocumentAction("view", doc.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() =>
                            handleDocumentAction("download", doc.id)
                          }
                          className="text-green-600 hover:text-green-900"
                        >
                          <FaDownload />
                        </button>
                        <button
                          onClick={() => handleDocumentAction("edit", doc.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDocumentAction("delete", doc.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
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
  );
};

export default Documents;
