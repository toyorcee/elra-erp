import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { canUploadDocuments } from "../../constants/userRoles";
import {
  MdCloudUpload,
  MdDescription,
  MdSecurity,
  MdTrendingUp,
  MdPeople,
  MdSpeed,
  MdWork,
  MdStar,
  MdFolder,
  MdFileUpload,
  MdClose,
  MdCheckCircle,
  MdError,
  MdInfo,
} from "react-icons/md";
import { uploadDocument } from "../../services/documents";

const Upload = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    priority: "medium",
    tags: "",
  });

  // Permission check
  const hasUploadPermission = canUploadDocuments(user);

  // Redirect if user doesn't have upload permission
  if (!hasUploadPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl text-center">
          <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to upload documents.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator to request upload permissions.
          </p>
        </div>
      </div>
    );
  }

  // Department-specific configuration
  const departmentConfig = {
    CLAIMS: {
      name: "Claims Department",
      icon: MdDescription,
      color: "from-blue-500 to-cyan-500",
      categories: [
        "Claims Reports",
        "Insurance Policies",
        "Damage Assessments",
        "Settlement Documents",
      ],
    },
    UNDERWRITE: {
      name: "Underwriting Department",
      icon: MdSecurity,
      color: "from-purple-500 to-pink-500",
      categories: [
        "Risk Assessments",
        "Policy Underwriting",
        "Financial Analysis",
        "Compliance Reports",
      ],
    },
    FINANCE: {
      name: "Finance Department",
      icon: MdTrendingUp,
      color: "from-green-500 to-emerald-500",
      categories: [
        "Financial Reports",
        "Budget Documents",
        "Audit Reports",
        "Tax Documents",
      ],
    },
    COMPLIANCE: {
      name: "Compliance Department",
      icon: MdSecurity,
      color: "from-red-500 to-orange-500",
      categories: [
        "Compliance Reports",
        "Audit Documents",
        "Regulatory Filings",
        "Policy Documents",
      ],
    },
    HR: {
      name: "HR Department",
      icon: MdPeople,
      color: "from-indigo-500 to-purple-500",
      categories: [
        "Employee Records",
        "HR Policies",
        "Performance Reviews",
        "Training Materials",
      ],
    },
    IT: {
      name: "IT Department",
      icon: MdSpeed,
      color: "from-cyan-500 to-blue-500",
      categories: [
        "System Documentation",
        "Network Configs",
        "Security Protocols",
        "Technical Reports",
      ],
    },
    REGIONAL: {
      name: "Regional Operations",
      icon: MdWork,
      color: "from-amber-500 to-orange-500",
      categories: [
        "Regional Reports",
        "Field Operations",
        "Local Policies",
        "Regional Data",
      ],
    },
    EXECUTIVE: {
      name: "Executive Management",
      icon: MdStar,
      color: "from-gray-600 to-gray-800",
      categories: [
        "Strategic Plans",
        "Executive Reports",
        "Board Documents",
        "Policy Decisions",
      ],
    },
  };

  const currentDept = departmentConfig[user?.department?.code] || {
    name: "Documents",
    icon: MdFolder,
    color: "from-gray-500 to-gray-700",
    categories: ["General Documents", "Reports", "Policies", "Other"],
  };

  const DeptIcon = currentDept.icon;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files) => {
    const newFiles = Array.from(files).map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Please enter a document name");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileData = selectedFiles[i];
        const progress = ((i + 1) / selectedFiles.length) * 100;
        setUploadProgress(progress);

        const uploadFormData = new FormData();
        uploadFormData.append("file", fileData.file);
        uploadFormData.append(
          "name",
          formData.name + (selectedFiles.length > 1 ? ` (${i + 1})` : "")
        );
        uploadFormData.append("description", formData.description);
        uploadFormData.append("category", formData.category);
        uploadFormData.append("priority", formData.priority);
        uploadFormData.append("tags", formData.tags);
        uploadFormData.append("department", user?.department?.code);

        await uploadDocument(uploadFormData);
      }

      toast.success("Documents uploaded successfully!");
      setSelectedFiles([]);
      setFormData({
        name: "",
        description: "",
        category: "",
        priority: "medium",
        tags: "",
      });
      setUploadProgress(0);
    } catch (error) {
      toast.error("Failed to upload documents");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl bg-gradient-to-r ${currentDept.color} text-white shadow-lg`}
            >
              <DeptIcon size={28} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Upload Documents
              </h1>
              <p className="text-gray-600 mt-1">
                Upload documents to {currentDept.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select Files
              </label>

              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="space-y-4">
                  <div className="p-4 rounded-full inline-flex bg-blue-100 text-blue-600 shadow-lg">
                    <MdCloudUpload size={32} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      Drop files here or click to browse
                    </p>
                    <p className="text-gray-600 mt-2">
                      Support for PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Selected Files ({selectedFiles.length})
                </h3>
                <div className="space-y-3">
                  {selectedFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <MdFileUpload className="text-blue-500" size={24} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <MdClose size={20} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  placeholder="Enter document name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="">Select category</option>
                  {currentDept.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  placeholder="Enter tags (comma separated)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                placeholder="Enter document description"
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Uploading...
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading || selectedFiles.length === 0}
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  uploading || selectedFiles.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : `bg-gradient-to-r ${currentDept.color} text-white hover:shadow-lg hover:scale-105`
                }`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <MdCloudUpload size={20} />
                    Upload Documents
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Upload;
