import React, { useState, useEffect, useRef } from "react";
import {
  HiDocument,
  HiArrowDownTray,
  HiEye,
  HiTrash,
  HiArrowUpTray,
  HiXMark,
  HiFolder,
  HiChevronDown,
  HiDocumentText,
  HiCurrencyDollar,
  HiCog,
  HiUserGroup,
  HiShieldCheck,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import DataTable from "../../../../components/common/DataTable";
import { useAuth } from "../../../../context/AuthContext";
import {
  getUserDocuments,
  getDocumentStatusColor,
  formatFileSize,
  detectScanners,
  scanDocument,
  processScannedDocument,
  uploadDocument,
} from "../../../../services/documents";
import { downloadDocumentPDF } from "../../../../utils/documentUtils";
import { downloadAsPDF } from "../../../../utils/fileUtils";
import DocumentViewer from "../../../../components/documents/DocumentViewer";
import ELRALogo from "../../../../components/ELRALogo";

const MyDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [showProjectDocumentsModal, setShowProjectDocumentsModal] =
    useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [showUploadScanModal, setShowUploadScanModal] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] =
    useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanners, setScanners] = useState([]);
  const [selectedScanner, setSelectedScanner] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  // New states for OCR and document processing
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrResults, setOcrResults] = useState(null);
  const [showOcrResults, setShowOcrResults] = useState(false);
  const [documentMetadata, setDocumentMetadata] = useState({
    title: "",
    description: "",
    category: "",
    confidentialityLevel: "internal",
    tags: [],
    confidence: 0,
  });
  const [processingStep, setProcessingStep] = useState("upload"); // upload, ocr, review, save

  const filterOptions = [
    { value: "all", label: "All Documents", icon: HiDocument },
    { value: "project", label: "Project Documents", icon: HiFolder },
    {
      value: "financial",
      label: "Financial Documents",
      icon: HiCurrencyDollar,
    },
    { value: "technical", label: "Technical Documents", icon: HiCog },
    { value: "legal", label: "Legal Documents", icon: HiDocumentText },
    { value: "hr", label: "HR Documents", icon: HiUserGroup },
    { value: "compliance", label: "Compliance Documents", icon: HiShieldCheck },
    { value: "other", label: "Other Documents", icon: HiDocument },
  ];

  const sortOptions = [
    { value: "updated", label: "Date Created" },
    { value: "project", label: "Project Name" },
    { value: "categories", label: "Classifications" },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await getUserDocuments();
      setDocuments(response.data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  // Group documents by project
  const groupDocumentsByProject = () => {
    const projectGroups = {};

    documents.forEach((doc) => {
      if (doc.project) {
        const projectId = doc.project.id || doc.project._id;
        if (!projectGroups[projectId]) {
          projectGroups[projectId] = {
            project: doc.project,
            documents: [],
            totalDocuments: 0,
            completedDocuments: 0,
            lastUpdated: doc.updatedAt,
          };
        }
        projectGroups[projectId].documents.push(doc);
        projectGroups[projectId].totalDocuments++;
        // Check for completed documents (approved status)
        if (doc.status === "approved" || doc.status === "APPROVED") {
          projectGroups[projectId].completedDocuments++;
        }
        if (
          new Date(doc.updatedAt) >
          new Date(projectGroups[projectId].lastUpdated)
        ) {
          projectGroups[projectId].lastUpdated = doc.updatedAt;
        }
      }
    });

    return Object.values(projectGroups);
  };

  // Get standalone documents (not associated with projects)
  const getStandaloneDocuments = () => {
    return documents.filter((doc) => !doc.project);
  };

  // Filter and sort data based on current filter
  const getFilteredData = () => {
    let data = [];

    if (filterType === "all" || filterType === "project") {
      data = [...groupDocumentsByProject()];
    }

    if (filterType === "all" || filterType !== "project") {
      const standaloneDocs = getStandaloneDocuments();
      if (standaloneDocs.length > 0) {
        data.push({
          project: null,
          documents: standaloneDocs,
          totalDocuments: standaloneDocs.length,
          completedDocuments: standaloneDocs.filter(
            (d) => d.status === "approved" || d.status === "APPROVED"
          ).length,
          lastUpdated: standaloneDocs[0]?.updatedAt,
          isStandalone: true,
        });
      }
    }

    // Apply search filter
    if (searchTerm) {
      data = data.filter((item) => {
        if (item.isStandalone) {
          return item.documents.some(
            (doc) =>
              doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        return (
          item.project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.project.code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply category filter
    if (filterType !== "all") {
      data = data.filter((item) => {
        if (item.isStandalone) {
          return item.documents.some((doc) => doc.category === filterType);
        }
        return item.documents.some((doc) => doc.category === filterType);
      });
    }

    // Sort data
    data.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "project":
          aValue = a.isStandalone ? "Standalone Documents" : a.project.name;
          bValue = b.isStandalone ? "Standalone Documents" : b.project.name;
          break;
        case "categories":
          const aCategories = [...new Set(a.documents.map((d) => d.category))];
          const bCategories = [...new Set(b.documents.map((d) => d.category))];
          aValue = aCategories.join(", ");
          bValue = bCategories.join(", ");
          break;
        case "updated":
        default:
          aValue = new Date(a.lastUpdated);
          bValue = new Date(b.lastUpdated);
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return data;
  };

  const handleViewProjectDocuments = (projectData) => {
    setSelectedProject(projectData);
    setShowProjectDocumentsModal(true);
  };

  const handleViewDocument = (document) => {
    setViewingDocument(document);
    setShowDocumentViewer(true);
  };

  const handleDownloadDocument = async (documentId) => {
    try {
      const document = documents.find(
        (doc) => doc.id === documentId || doc._id === documentId
      );
      if (document) {
        await downloadDocumentPDF(document);
        toast.success("Document downloaded successfully");
      } else {
        toast.error("Document not found");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  const handleEditDocument = (documentId) => {
    const document = documents.find(
      (doc) => doc.id === documentId || doc._id === documentId
    );
    if (document) {
      setViewingDocument(document);
      setShowDocumentViewer(true);
      // The DocumentViewer will handle edit functionality
    } else {
      toast.error("Document not found");
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        // Implementation for document delete
        toast.info("Delete functionality will be implemented");
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete document");
      }
    }
  };

  const handleUploadOrScanDocument = (document) => {
    setSelectedDocumentForUpload(document);
    setShowUploadScanModal(true);
    setSelectedFile(null);
    setScanners([]);
    setSelectedScanner(null);
    setScanProgress(0);
    setUploadProgress(0);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/tiff",
        "image/bmp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Please select a supported file type (PDF, JPEG, PNG, TIFF, BMP, DOC, DOCX)"
        );
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
      toast.success("File selected successfully");
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file first
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("title", selectedDocumentForUpload.title);
      formData.append(
        "description",
        selectedDocumentForUpload.description || ""
      );
      formData.append("category", selectedDocumentForUpload.category);
      formData.append(
        "documentType",
        selectedDocumentForUpload.documentType || "other"
      );
      formData.append("enableOCR", "true");
      formData.append("autoClassify", "true");

      const response = await uploadDocument(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Move to OCR processing step
      setProcessingStep("ocr");
      await processDocumentWithOCR(response.data.documentId);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const processDocumentWithOCR = async (documentId) => {
    setIsProcessingOCR(true);
    try {
      // Call OCR service to process the document
      const response = await fetch(`/api/documents/${documentId}/ocr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const ocrData = await response.json();
        setOcrResults(ocrData);

        // Pre-fill metadata based on OCR results
        setDocumentMetadata({
          title: ocrData.suggestedTitle || selectedDocumentForUpload.title,
          description: ocrData.suggestedDescription || "",
          category:
            ocrData.suggestedCategory || selectedDocumentForUpload.category,
          confidentialityLevel: ocrData.suggestedConfidentiality || "internal",
          tags: ocrData.suggestedTags || [],
          confidence: ocrData.confidence || 0,
        });

        setShowOcrResults(true);
        setProcessingStep("review");
        toast.success("Document processed with OCR successfully!");
      } else {
        throw new Error("OCR processing failed");
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      toast.error("Failed to process document with OCR");
      // Fallback to manual review
      setProcessingStep("review");
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleSaveDocument = async () => {
    try {
      const response = await fetch(
        `/api/documents/${selectedDocumentForUpload.id}/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            ...documentMetadata,
            ocrResults: ocrResults,
            status: "pending_approval",
          }),
        }
      );

      if (response.ok) {
        toast.success("Document saved and sent for approval!");

        // Send notification to executive
        await sendExecutiveNotification();

        // Refresh documents list
        await fetchDocuments();

        // Close modal
        setShowUploadScanModal(false);
        setSelectedDocumentForUpload(null);
        setSelectedFile(null);
        setOcrResults(null);
        setShowOcrResults(false);
        setProcessingStep("upload");
        setDocumentMetadata({
          title: "",
          description: "",
          category: "",
          confidentialityLevel: "internal",
          tags: [],
          confidence: 0,
        });
      } else {
        throw new Error("Failed to save document");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save document");
    }
  };

  const sendExecutiveNotification = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          type: "document_approval",
          title: "Document Approval Required",
          message: `Document "${documentMetadata.title}" requires your approval`,
          recipient: "executive", // This will be handled by the backend
          priority: "high",
          metadata: {
            documentId: selectedDocumentForUpload.id,
            projectId: selectedDocumentForUpload.project?.id,
          },
        }),
      });
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  const handleDetectScanners = async () => {
    try {
      const response = await detectScanners();
      if (response.success) {
        setScanners(response.data.scanners);
        if (response.data.scanners.length > 0) {
          setSelectedScanner(response.data.scanners[0]);
        }
        toast.success(`${response.data.total} scanner(s) detected`);
      } else {
        toast.error(
          "No scanners detected. Please ensure scanner is connected and drivers are installed."
        );
      }
    } catch (error) {
      console.error("Scanner detection error:", error);
      toast.error("Failed to detect scanners");
    }
  };

  const handleScanDocument = async () => {
    if (!selectedScanner) {
      toast.error("Please select a scanner");
      return;
    }

    setIsScanning(true);
    setScanProgress(0);

    try {
      // Simulate scan progress
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 5;
        });
      }, 300);

      const response = await scanDocument(selectedScanner.id, {
        resolution: 300,
        format: "pdf",
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (response.success) {
        // Process the scanned document
        const metadata = {
          title: selectedDocumentForUpload.title,
          description:
            selectedDocumentForUpload.description || "Scanned document",
          category: selectedDocumentForUpload.category,
          documentType: selectedDocumentForUpload.documentType || "other",
        };

        const processResponse = await processScannedDocument(
          response.data.scanResult,
          metadata
        );

        if (processResponse.success) {
          toast.success("Document scanned and processed successfully!");

          // Refresh documents list
          await fetchDocuments();

          // Close modal
          setShowUploadScanModal(false);
          setSelectedDocumentForUpload(null);
          setScanProgress(0);
        } else {
          throw new Error(processResponse.message || "Processing failed");
        }
      } else {
        throw new Error(response.message || "Scanning failed");
      }
    } catch (error) {
      console.error("Scanning error:", error);
      toast.error(error.message || "Failed to scan document");
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const getProjectStatusColor = (projectData) => {
    const completionRate =
      projectData.completedDocuments / projectData.totalDocuments;
    if (completionRate === 1) return "bg-green-100 text-green-800";
    if (completionRate >= 0.5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getProjectStatusText = (projectData) => {
    const completionRate =
      projectData.completedDocuments / projectData.totalDocuments;
    if (completionRate === 1) return "Complete";
    if (completionRate >= 0.5) return "In Progress";
    return "Pending";
  };

  const columns = [
    {
      key: "project",
      header: "Project",
      renderer: (projectData) => (
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-[var(--elra-primary)] rounded-lg flex items-center justify-center">
            {projectData.isStandalone ? (
              <HiDocument className="w-5 h-5 text-white" />
            ) : (
              <HiFolder className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {projectData.isStandalone
                ? "Standalone Documents"
                : projectData.project.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {projectData.isStandalone
                ? `${projectData.totalDocuments} document${
                    projectData.totalDocuments !== 1 ? "s" : ""
                  }`
                : `Code: ${
                    projectData.project.code
                  } • Budget: ₦${projectData.project.budget?.toLocaleString()}`}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getProjectStatusColor(
                  projectData
                )}`}
              >
                {getProjectStatusText(projectData)}
              </span>
              <span className="text-xs text-gray-500">
                {projectData.completedDocuments}/{projectData.totalDocuments}{" "}
                docs
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "categories",
      header: "Classifications",
      renderer: (projectData) => {
        if (projectData.isStandalone) {
          const categories = [
            ...new Set(projectData.documents.map((d) => d.category)),
          ];
          return (
            <div className="flex flex-wrap gap-1">
              {categories.slice(0, 2).map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {category}
                </span>
              ))}
              {categories.length > 2 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  +{categories.length - 2}
                </span>
              )}
            </div>
          );
        }

        const categories = [
          ...new Set(projectData.documents.map((d) => d.category)),
        ];
        return (
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {category}
              </span>
            ))}
            {categories.length > 2 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                +{categories.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "updated",
      header: "Date Created",
      renderer: (projectData) => (
        <div className="text-sm text-gray-900">
          {new Date(projectData.lastUpdated).toLocaleDateString()}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
          <p className="text-gray-600 mt-1">
            Manage your documents and project files
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Upload functionality will be implemented later */}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                );
              })}
            </select>
            <HiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search projects or documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <HiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DataTable
          data={getFilteredData()}
          columns={columns}
          loading={loading}
          emptyMessage="No projects or documents found"
          actions={{
            showEdit: false,
            showDelete: false,
            showToggle: false,
            customActions: (row) => (
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewProjectDocuments(row);
                  }}
                  className="p-2 text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white rounded-lg transition-colors"
                  title="View Documents"
                >
                  <HiEye className="w-4 h-4" />
                </button>
              </div>
            ),
          }}
        />
      </div>

      {/* Project Documents Modal */}
      {showProjectDocumentsModal && selectedProject && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-[90vw] w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <ELRALogo variant="dark" size="md" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedProject.isStandalone
                        ? "Standalone Documents"
                        : selectedProject.project.name}
                    </h2>
                    <p className="text-white text-opacity-80">
                      {selectedProject.isStandalone
                        ? `${selectedProject.totalDocuments} document${
                            selectedProject.totalDocuments !== 1 ? "s" : ""
                          }`
                        : `Project Code: ${
                            selectedProject.project.code
                          } • Budget: ₦${selectedProject.project.budget?.toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProjectDocumentsModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <HiXMark className="w-8 h-8" />
                </button>
              </div>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedProject.documents.map((document) => (
                  <div
                    key={document.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <HiDocument className="w-5 h-5 text-[var(--elra-primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {document.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {document.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentStatusColor(
                                document.status
                              )}`}
                            >
                              {document.status.replace("_", " ").toUpperCase()}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {document.category}
                            </span>
                            {document.project &&
                              document.status === "draft" && (
                                <span className="text-xs text-blue-600 font-medium">
                                  📄 Required Document
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDocument(document)}
                          className="p-2 text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white rounded-lg transition-colors"
                          title="View Document"
                        >
                          <HiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(document.id)}
                          className="p-2 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-colors"
                          title="Download Document"
                        >
                          <HiArrowDownTray className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUploadOrScanDocument(document)}
                          className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                          title="Upload/Scan Document"
                        >
                          <HiArrowUpTray className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditDocument(document.id)}
                          className="p-2 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition-colors"
                          title="Edit Document"
                        >
                          <HiDocumentText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(document.id)}
                          className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                          title="Delete Document"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedProject.completedDocuments} of{" "}
                  {selectedProject.totalDocuments} documents completed
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowProjectDocumentsModal(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer */}
      {showDocumentViewer && viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          onClose={() => {
            setShowDocumentViewer(false);
            setViewingDocument(null);
          }}
          onDownload={handleDownloadDocument}
          onEdit={handleEditDocument}
        />
      )}

      {/* Upload/Scan Modal */}
      <AnimatePresence>
        {showUploadScanModal && selectedDocumentForUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Upload or Scan Document
                    </h2>
                    <p className="text-white text-opacity-90 mt-1 text-sm">
                      {selectedDocumentForUpload.title}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setShowUploadScanModal(false);
                        setSelectedDocumentForUpload(null);
                      }}
                      className="bg-white text-[var(--elra-primary)] px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium border border-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowUploadScanModal(false);
                        setSelectedDocumentForUpload(null);
                      }}
                      className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                    >
                      <HiXMark className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 bg-white">
                {/* Processing Steps Indicator */}
                <div className="mb-8">
                  <div className="flex items-center justify-center space-x-4">
                    <div
                      className={`flex items-center space-x-2 ${
                        processingStep === "upload"
                          ? "text-[var(--elra-primary)]"
                          : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          processingStep === "upload"
                            ? "bg-[var(--elra-primary)] text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        1
                      </div>
                      <span className="font-medium">Upload</span>
                    </div>
                    <div
                      className={`w-8 h-1 ${
                        processingStep === "ocr" || processingStep === "review"
                          ? "bg-[var(--elra-primary)]"
                          : "bg-gray-200"
                      }`}
                    ></div>
                    <div
                      className={`flex items-center space-x-2 ${
                        processingStep === "ocr"
                          ? "text-[var(--elra-primary)]"
                          : processingStep === "review"
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          processingStep === "ocr"
                            ? "bg-[var(--elra-primary)] text-white"
                            : processingStep === "review"
                            ? "bg-green-600 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        2
                      </div>
                      <span className="font-medium">OCR Process</span>
                    </div>
                    <div
                      className={`w-8 h-1 ${
                        processingStep === "review"
                          ? "bg-green-600"
                          : "bg-gray-200"
                      }`}
                    ></div>
                    <div
                      className={`flex items-center space-x-2 ${
                        processingStep === "review"
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          processingStep === "review"
                            ? "bg-green-600 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        3
                      </div>
                      <span className="font-medium">Review & Save</span>
                    </div>
                  </div>
                </div>

                {/* Step 1: Upload */}
                {processingStep === "upload" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upload Option */}
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-[var(--elra-primary)] hover:shadow-lg transition-all duration-300 group">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                          <HiArrowUpTray className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          Upload File
                        </h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                          Upload a PDF file for OCR processing and
                          categorization
                        </p>

                        {selectedFile ? (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <HiDocument className="w-5 h-5 text-green-600" />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="font-medium text-green-800 truncate cursor-help"
                                    title={selectedFile.name}
                                  >
                                    {selectedFile.name.length > 30
                                      ? selectedFile.name.substring(0, 30) +
                                        "..."
                                      : selectedFile.name}
                                  </p>
                                  <p className="text-sm text-green-600">
                                    {formatFileSize(selectedFile.size)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedFile(null)}
                                className="text-red-600 hover:text-red-800 ml-2 flex-shrink-0"
                              >
                                <HiXMark className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={handleFileSelect}
                              className="hidden"
                              id="file-upload"
                            />
                            <label
                              htmlFor="file-upload"
                              className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold cursor-pointer inline-block"
                            >
                              Choose PDF File
                            </label>
                          </>
                        )}

                        {isUploading && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Uploading...
                              </span>
                              <span className="text-sm text-gray-500">
                                {uploadProgress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[var(--elra-primary)] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {selectedFile && !isUploading && (
                          <button
                            onClick={handleUploadFile}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
                          >
                            Upload & Process with OCR
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scan Option */}
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-[var(--elra-primary)] hover:shadow-lg transition-all duration-300 group">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                          <HiDocument className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          Scan Document
                        </h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                          Use a scanner to digitize a physical document
                        </p>

                        {/* Scanner Detection */}
                        {scanners.length === 0 && (
                          <button
                            onClick={handleDetectScanners}
                            className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
                          >
                            Detect Scanners
                          </button>
                        )}

                        {/* Scanner Selection */}
                        {scanners.length > 0 && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select Scanner
                            </label>
                            <select
                              value={selectedScanner?.id || ""}
                              onChange={(e) => {
                                const scanner = scanners.find(
                                  (s) => s.id === e.target.value
                                );
                                setSelectedScanner(scanner);
                              }}
                              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-300 bg-white"
                            >
                              {scanners.map((scanner) => (
                                <option key={scanner.id} value={scanner.id}>
                                  {scanner.name} ({scanner.type})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Scan Progress */}
                        {isScanning && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Scanning...
                              </span>
                              <span className="text-sm text-gray-500">
                                {scanProgress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[var(--elra-primary)] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${scanProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Scan Button */}
                        {selectedScanner && !isScanning && (
                          <button
                            onClick={handleScanDocument}
                            className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
                          >
                            Start Scanning
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: OCR Processing */}
                {processingStep === "ocr" && (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-full flex items-center justify-center mx-auto mb-6">
                      <HiDocument className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Processing Document with OCR
                    </h3>
                    <p className="text-gray-600 mb-8">
                      Analyzing document content, extracting text, and
                      categorizing information...
                    </p>

                    {isProcessingOCR && (
                      <div className="max-w-md mx-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Processing...
                          </span>
                          <span className="text-sm text-gray-500">
                            {Math.floor(Math.random() * 30) + 70}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-[var(--elra-primary)] h-3 rounded-full transition-all duration-500 animate-pulse"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Review & Save */}
                {processingStep === "review" && showOcrResults && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Review OCR Results
                      </h3>
                      <p className="text-gray-600">
                        Review and edit the extracted information before saving
                      </p>
                    </div>

                    {/* OCR Results Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-blue-900">
                          📊 OCR Analysis Results
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-blue-700">
                            Confidence:
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              documentMetadata.confidence >= 80
                                ? "bg-green-100 text-green-800"
                                : documentMetadata.confidence >= 60
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {documentMetadata.confidence}%
                          </span>
                        </div>
                      </div>

                      {ocrResults && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="bg-white p-3 rounded-lg">
                            <span className="font-medium text-gray-700">
                              Extracted Text:
                            </span>
                            <p className="text-gray-900 mt-1 line-clamp-3">
                              {ocrResults.extractedText?.substring(0, 150)}...
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <span className="font-medium text-gray-700">
                              Detected Keywords:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ocrResults.keywords
                                ?.slice(0, 5)
                                .map((keyword, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Document Metadata Form */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        📝 Document Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Document Title
                          </label>
                          <input
                            type="text"
                            value={documentMetadata.title}
                            onChange={(e) =>
                              setDocumentMetadata({
                                ...documentMetadata,
                                title: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                          </label>
                          <select
                            value={documentMetadata.category}
                            onChange={(e) =>
                              setDocumentMetadata({
                                ...documentMetadata,
                                category: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                          >
                            <option value="">Select Category</option>
                            <option value="financial">Financial</option>
                            <option value="technical">Technical</option>
                            <option value="legal">Legal</option>
                            <option value="hr">HR</option>
                            <option value="compliance">Compliance</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={documentMetadata.description}
                            onChange={(e) =>
                              setDocumentMetadata({
                                ...documentMetadata,
                                description: e.target.value,
                              })
                            }
                            rows="3"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confidentiality Level
                          </label>
                          <select
                            value={documentMetadata.confidentialityLevel}
                            onChange={(e) =>
                              setDocumentMetadata({
                                ...documentMetadata,
                                confidentialityLevel: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                          >
                            <option value="public">Public</option>
                            <option value="internal">Internal</option>
                            <option value="confidential">Confidential</option>
                            <option value="restricted">Restricted</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={() => {
                          setProcessingStep("upload");
                          setShowOcrResults(false);
                          setOcrResults(null);
                        }}
                        className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors font-semibold"
                      >
                        Back to Upload
                      </button>
                      <button
                        onClick={handleSaveDocument}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
                      >
                        Save & Send for Approval
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Info */}
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">
                  📄 Current Document Info
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                    <span className="text-gray-600 font-medium">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${getDocumentStatusColor(
                        selectedDocumentForUpload.status
                      )}`}
                    >
                      {selectedDocumentForUpload.status
                        .replace("_", " ")
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                    <span className="text-gray-600 font-medium">Category:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedDocumentForUpload.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                    <span className="text-gray-600 font-medium">
                      File Size:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatFileSize(selectedDocumentForUpload.fileSize)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                    <span className="text-gray-600 font-medium">
                      Last Updated:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {new Date(
                        selectedDocumentForUpload.updatedAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyDocuments;
