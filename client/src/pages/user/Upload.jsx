import React, { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { uploadDocument } from "../../services/documents";
import { toast } from "react-toastify";
import {
  MdCloudUpload,
  MdDescription,
  MdCheckCircle,
  MdDelete,
} from "react-icons/md";
import GradientSpinner from "../../components/common/GradientSpinner";
import { getDepartments } from "../../services/departments";
import {
  categories,
  documentClassifications,
} from "../../constants/documentClassifications";

const Upload = () => {
  const { user } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [departments, setDepartments] = useState([]);

  React.useEffect(() => {
    async function fetchDepartments() {
      try {
        const data = await getDepartments();
        let depts = Array.isArray(data)
          ? data
          : Array.isArray(data?.departments)
          ? data.departments
          : Array.isArray(data?.data?.departments)
          ? data.data.departments
          : Array.isArray(data?.docs)
          ? data.docs
          : [];
        setDepartments(depts);
        console.log("[Upload.jsx] Departments fetched:", depts);
      } catch (err) {
        toast.error("Failed to fetch departments");
        setDepartments([]);
      }
    }
    fetchDepartments();
  }, []);

  const isAdmin = user?.role?.level >= 90;
  const isSuperAdmin = user?.role?.level >= 100;
  const isManager = user?.role?.level >= 80;
  const maxFileSize = isAdmin ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  const canBypassApproval = isSuperAdmin;
  const canSetHighPriority = isManager;
  const canSetConfidential = isSuperAdmin;
  const canSelectDepartment = isAdmin;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    documentType: "Other",
    priority: canSetHighPriority ? "Medium" : "Medium",
    tags: "",
    isConfidential: false,
    department: isAdmin
      ? ""
      : typeof user?.department === "object"
      ? user.department.code
      : user?.department || "",
    bypassApproval: false,
  });

  const priorities = ["Low", "Medium", "High", "Critical"];

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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Comprehensive list of supported file types
    const validTypes = [
      // PDF documents
      "application/pdf",

      // Microsoft Office documents
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-powerpoint", // .ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx

      // OpenDocument formats
      "application/vnd.oasis.opendocument.text", // .odt
      "application/vnd.oasis.opendocument.spreadsheet", // .ods
      "application/vnd.oasis.opendocument.presentation", // .odp

      // Text files
      "text/plain", // .txt
      "text/csv", // .csv
      "text/html", // .html
      "text/css", // .css
      "text/javascript", // .js

      // Image files
      "image/jpeg", // .jpg, .jpeg
      "image/png", // .png
      "image/gif", // .gif
      "image/bmp", // .bmp
      "image/tiff", // .tiff
      "image/webp", // .webp
      "image/svg+xml", // .svg

      // Archive files
      "application/zip", // .zip
      "application/x-rar-compressed", // .rar
      "application/x-7z-compressed", // .7z

      // Other common formats
      "application/json", // .json
      "application/xml", // .xml
      "application/rtf", // .rtf
    ];

    if (!validTypes.includes(file.type)) {
      toast.error(
        "Invalid file type. Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ODT, ODS, ODP, TXT, CSV, HTML, CSS, JS, JPG, PNG, GIF, BMP, TIFF, WEBP, SVG, ZIP, RAR, 7Z, JSON, XML, RTF"
      );
      return;
    }

    if (file.size > maxFileSize) {
      toast.error(
        `File size must be less than ${maxFileSize / (1024 * 1024)}MB`
      );
      return;
    }

    setSelectedFile(file);

    if (!formData.title) {
      setFormData((prev) => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, ""),
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "department") {
      console.log("[Upload.jsx] Department selected:", value);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[Upload.jsx] Form data before submit:", formData);

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Enforce role-based restrictions on the frontend
      const submissionData = {
        ...formData,
        // Force priority to Medium for non-managers
        priority: canSetHighPriority ? formData.priority : "Medium",
        // Force department to user's department for non-admins
        department: canSelectDepartment
          ? formData.department
          : typeof user?.department === "object"
          ? user.department.code
          : user?.department || "",
        // Force confidential to false for non-super-admins
        isConfidential: canSetConfidential ? formData.isConfidential : false,
      };

      console.log("[Upload.jsx] Submitting document:", submissionData);
      console.log(
        "[Upload.jsx] FormData department value:",
        submissionData.department
      );
      const formDataToSend = new FormData();
      formDataToSend.append("document", selectedFile);
      formDataToSend.append("title", submissionData.title);
      formDataToSend.append("description", submissionData.description);
      formDataToSend.append("category", submissionData.category);
      formDataToSend.append("documentType", submissionData.documentType);
      formDataToSend.append("priority", submissionData.priority);
      formDataToSend.append("tags", submissionData.tags);
      formDataToSend.append("isConfidential", submissionData.isConfidential);
      if (submissionData.department) {
        formDataToSend.append("department", submissionData.department);
      }

      const response = await uploadDocument(formDataToSend);

      toast.success("Document uploaded successfully!");

      setSelectedFile(null);
      setFormData({
        title: "",
        description: "",
        category: "General",
        documentType: "Other",
        priority: canSetHighPriority ? "Medium" : "Medium",
        tags: "",
        isConfidential: false,
        department:
          typeof user?.department === "object"
            ? user.department.code
            : user?.department || "",
      });
      setUploadProgress(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Upload Document</h1>
        <p className="text-gray-200">
          Upload and manage your documents with comprehensive metadata
        </p>
        {isAdmin && (
          <div className="mt-2 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-200">
              <strong>Admin Mode:</strong> You can upload files up to{" "}
              {maxFileSize / (1024 * 1024)}MB
              {canBypassApproval && " and bypass approval workflow"}
              {canSetConfidential && " and mark documents as confidential"}
            </p>
          </div>
        )}
        {!isAdmin && (
          <div className="mt-2 p-3 bg-gray-900/30 border border-gray-500/30 rounded-lg">
            <p className="text-sm text-gray-200">
              <strong>User Mode:</strong> You can upload files up to{" "}
              {maxFileSize / (1024 * 1024)}MB. Some fields are read-only based
              on your role level.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MdCloudUpload className="mr-2 text-blue-300" />
            File Upload
          </h2>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-400 bg-blue-50"
                : selectedFile
                ? "border-green-400 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <MdCheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedFile.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <MdDelete className="mr-1" />
                  Remove File
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <MdCloudUpload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-white">
                    Drop your file here
                  </h3>
                  <p className="text-sm text-gray-300">
                    or click to browse from your computer
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileSelect(e.target.files[0])
                  }
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.txt,.csv,.html,.css,.js,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.svg,.zip,.rar,.7z,.json,.xml,.rtf"
                />
              </div>
            )}
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MdDescription className="mr-2 text-blue-300" />
            Document Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Document Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-300 backdrop-blur-sm"
                placeholder="Enter document title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Document Type
              </label>
              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                {documentClassifications[formData.category]?.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Priority
                {!canSetHighPriority && (
                  <span className="text-xs text-gray-400 ml-1">
                    (Read-only)
                  </span>
                )}
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                disabled={!canSetHighPriority}
                className={`w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm appearance-none cursor-pointer ${
                  !canSetHighPriority ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                {priorities.map((priority) => (
                  <option
                    key={priority}
                    value={priority}
                    className="bg-gray-800 text-white"
                  >
                    {priority}
                  </option>
                ))}
              </select>
              {!canSetHighPriority && (
                <p className="text-xs text-gray-300 mt-1">
                  Only managers and above can set high priority levels
                </p>
              )}
            </div>

            {isAdmin ? (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur-sm appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="" className="bg-gray-800 text-white">
                    General (All Departments)
                  </option>
                  {Array.isArray(departments) &&
                    departments.map((dept) => (
                      <option
                        key={dept._id}
                        value={dept.code}
                        className="bg-gray-800 text-white"
                      >
                        {dept.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-300 mt-1">
                  Leave empty for general documents, or select specific
                  department
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Department{" "}
                  <span className="text-xs text-gray-400">(Read-only)</span>
                </label>
                <input
                  type="text"
                  value={
                    typeof user?.department === "object"
                      ? user.department.name
                      : user?.department || "General"
                  }
                  disabled
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white opacity-50 cursor-not-allowed backdrop-blur-sm"
                />
                <p className="text-xs text-gray-300 mt-1">
                  Documents will be uploaded to your assigned department
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-300 backdrop-blur-sm"
                placeholder="Enter document description"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-300 backdrop-blur-sm"
                placeholder="Enter tags separated by commas"
              />
              <p className="text-sm text-gray-300 mt-1">
                Use tags to make documents easier to find
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isConfidential"
                  checked={formData.isConfidential}
                  onChange={handleInputChange}
                  disabled={!canSetConfidential}
                  className={`h-4 w-4 text-blue-400 focus:ring-blue-400 border-white/30 rounded bg-white/20 ${
                    !canSetConfidential ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
                <span
                  className={`ml-2 text-sm ${
                    !canSetConfidential ? "text-gray-400" : "text-white"
                  }`}
                >
                  Mark as confidential document
                  {!canSetConfidential && (
                    <span className="text-xs text-gray-400 ml-1">
                      (Super Admin only)
                    </span>
                  )}
                </span>
              </label>
              {!canSetConfidential && (
                <p className="text-xs text-gray-300 mt-1 ml-6">
                  Only Super Administrators can mark documents as confidential
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link
            to={
              location.pathname.includes("/admin")
                ? "/admin/documents"
                : "/dashboard/documents"
            }
            className="px-6 py-2 border border-white/30 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-200"
          >
            Back to Documents
          </Link>
          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            {isUploading ? (
              <>
                <GradientSpinner size="sm" variant="primary" className="mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <MdCloudUpload className="mr-2" />
                Upload Document
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Upload;
