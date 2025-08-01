import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  uploadDocument,
  getDocumentMetadata,
  processOCR,
} from "../services/documents";
import { toast } from "react-toastify";

import {
  MdCloudUpload,
  MdDescription,
  MdDelete,
  MdScanner,
  MdAutoFixHigh,
  MdPreview,
  MdSave,
} from "react-icons/md";
import { getDepartments } from "../services/departments";

const DocumentScanning = ({ context = "user" }) => {
  const { user } = useAuth();

  const fileInputRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [ocrResults, setOcrResults] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [documentMetadata, setDocumentMetadata] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [uploadedDocument, setUploadedDocument] = useState(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        // Fetch departments
        const deptData = await getDepartments();
        let depts = Array.isArray(deptData)
          ? deptData
          : Array.isArray(deptData?.departments)
          ? deptData.departments
          : Array.isArray(deptData?.data?.departments)
          ? deptData.data.departments
          : Array.isArray(deptData?.docs)
          ? deptData.docs
          : [];
        setDepartments(depts);
        console.log("[DocumentScanning.jsx] Departments fetched:", depts);

        // Fetch document metadata
        const metadataResponse = await getDocumentMetadata();
        if (metadataResponse.data?.success) {
          setDocumentMetadata(metadataResponse.data.data);
          console.log(
            "[DocumentScanning.jsx] Document metadata fetched:",
            metadataResponse.data.data
          );
        }
      } catch (err) {
        console.error("[DocumentScanning.jsx] Error fetching data:", err);
        toast.error("Failed to fetch required data");
        setDepartments([]);
      } finally {
        setMetadataLoading(false);
      }
    }
    fetchData();
  }, []);

  // Permission-based features
  const isSuperAdmin = user?.role?.level >= 100;
  const isAdmin = user?.role?.level >= 90;
  const hasUploadPermission =
    user?.role?.permissions?.includes("document.upload");
  const hasBypassPermission = user?.role?.permissions?.includes(
    "document.bypass_approval"
  );

  // File size limits based on role
  const maxFileSize = isSuperAdmin ? 50 * 1024 * 1024 : 25 * 1024 * 1024; // 50MB for super admin, 25MB for others

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    documentType: "Other",
    priority: "Medium",
    tags: "",
    isConfidential: false,
    department: "",
    bypassApproval: hasBypassPermission, // Only show if user has permission
    enableOCR: true,
    autoClassify: true,
  });

  const priorities = documentMetadata?.priorityLevels?.map((p) => p.value) || [
    "Low",
    "Medium",
    "High",
    "Critical",
  ];

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
    console.log("🔍 [DocumentScanning] File selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
      maxFileSize: maxFileSize,
      userRole: user?.role?.name,
      context: context,
      hasUploadPermission: hasUploadPermission,
    });

    // Check file size
    if (file.size > maxFileSize) {
      console.log("❌ [DocumentScanning] File size exceeds limit:", {
        fileSize: file.size,
        maxFileSize: maxFileSize,
        difference: file.size - maxFileSize,
      });
      toast.error(`File size must be less than ${formatFileSize(maxFileSize)}`);
      return;
    }

    // Check file type
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/tiff",
      "image/bmp",
      "application/pdf",
    ];

    if (!supportedTypes.includes(file.type)) {
      console.log("❌ [DocumentScanning] Invalid file type:", file.type);
      toast.error(
        "Please select a supported file type (JPEG, PNG, TIFF, BMP, PDF)"
      );
      return;
    }

    setSelectedFile(file);
    setOcrResults(null);

    // Auto-generate title from filename
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    setFormData((prev) => ({
      ...prev,
      title:
        fileName.charAt(0).toUpperCase() +
        fileName.slice(1).replace(/[-_]/g, " "),
    }));

    console.log("✅ [DocumentScanning] File validated and set successfully:", {
      fileName: fileName,
      generatedTitle:
        fileName.charAt(0).toUpperCase() +
        fileName.slice(1).replace(/[-_]/g, " "),
    });
    toast.success("File selected for scanning");
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleScanDocument = async () => {
    console.log("🚀 [DocumentScanning] Starting OCR scan process:", {
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
      fileType: selectedFile?.type,
      context: context,
      userRole: user?.role?.name,
      hasBypassPermission: hasBypassPermission,
    });

    if (!selectedFile) {
      console.log("❌ [DocumentScanning] No file selected for scanning");
      toast.error("Please select a file to scan");
      return;
    }

    setIsScanning(true);
    setScanProgress(0);

    try {
      console.log("📊 [DocumentScanning] Starting progress simulation");

      // Simulate OCR processing progress
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            console.log(
              "📊 [DocumentScanning] Progress simulation completed at 85%"
            );
            return 85;
          }
          const newProgress = prev + 5;
          console.log(`📊 [DocumentScanning] Progress: ${newProgress}%`);
          return newProgress;
        });
      }, 300);

      const scanFormData = new FormData();
      scanFormData.append("document", selectedFile);
      scanFormData.append("enableOCR", "true");
      scanFormData.append("autoClassify", "true");
      scanFormData.append("scanMode", "true");

      console.log("📤 [DocumentScanning] FormData created for scanning:", {
        enableOCR: "true",
        autoClassify: "true",
        scanMode: "true",
      });

      console.log("🔍 [DocumentScanning] Calling OCR API...");
      const ocrResponse = await processOCR(scanFormData);

      if (ocrResponse.data?.success) {
        const ocrResults = ocrResponse.data.data;
        console.log(
          "✅ [DocumentScanning] Real OCR results received:",
          ocrResults
        );

        setOcrResults(ocrResults);
        setScanProgress(100);

        setFormData((prev) => ({
          ...prev,
          documentType: ocrResults.documentType || "Other",
          category: ocrResults.suggestedCategory || "General",
          tags: ocrResults.keywords?.join(", ") || "",
          description: `Scanned document processed with OCR (Confidence: ${(
            (ocrResults.confidence || 0) * 100
          ).toFixed(1)}%)`,
        }));
      } else {
        throw new Error(ocrResponse.data?.message || "OCR processing failed");
      }

      toast.success("Document scanned successfully!");
      clearInterval(progressInterval);
    } catch (error) {
      console.error("Scanning error:", error);
      toast.error("Failed to scan document");
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("📤 [DocumentScanning] Starting document upload process:", {
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
      formData: formData,
      context: context,
      userRole: user?.role?.name,
      hasBypassPermission: hasBypassPermission,
    });

    if (!selectedFile) {
      console.log("❌ [DocumentScanning] No file selected for upload");
      toast.error("Please select a file to upload");
      return;
    }

    if (!formData.title.trim()) {
      console.log("❌ [DocumentScanning] No title provided");
      toast.error("Please enter a document title");
      return;
    }

    setIsScanning(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("document", selectedFile);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("documentType", formData.documentType);
      formDataToSend.append("priority", formData.priority);
      formDataToSend.append("tags", formData.tags);
      formDataToSend.append("isConfidential", formData.isConfidential);
      formDataToSend.append("department", formData.department);
      formDataToSend.append("bypassApproval", formData.bypassApproval);
      formDataToSend.append("enableOCR", formData.enableOCR);
      formDataToSend.append("autoClassify", formData.autoClassify);

      console.log("📤 [DocumentScanning] FormData prepared for upload:", {
        title: formData.title,
        category: formData.category,
        documentType: formData.documentType,
        priority: formData.priority,
        isConfidential: formData.isConfidential,
        bypassApproval: formData.bypassApproval,
        enableOCR: formData.enableOCR,
        autoClassify: formData.autoClassify,
      });

      const response = await uploadDocument(formDataToSend);

      console.log("✅ [DocumentScanning] Document uploaded successfully:", {
        response: response,
        documentId: response?.data?.document?._id,
      });

      setUploadedDocument(response?.data?.document);
      setModalMessage("Document scanned and uploaded successfully!");
      setShowSuccessModal(true);

      // Reset form
      setSelectedFile(null);
      setOcrResults(null);
      setFormData({
        title: "",
        description: "",
        category: "General",
        documentType: "Other",
        priority: "Medium",
        tags: "",
        isConfidential: false,
        department: "",
        bypassApproval: hasBypassPermission,
        enableOCR: true,
        autoClassify: true,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("❌ [DocumentScanning] Upload error:", error);
      setModalMessage(
        error.response?.data?.message || "Failed to upload document"
      );
      setShowErrorModal(true);
    } finally {
      setIsScanning(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setOcrResults(null);
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

  // Check if user has upload permission
  if (!hasUploadPermission) {
    return (
      <div className="w-full max-w-6xl mx-auto py-6">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-300 mb-2">Access Denied</h2>
          <p className="text-red-200">
            You don't have permission to upload documents. Please contact your
            administrator.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching metadata
  if (metadataLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto py-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 text-center">
          <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
          </div>
          <p className="text-gray-300 text-lg font-medium">
            Loading document scanning options...
          </p>
          <p className="text-gray-400 text-sm mt-2">Preparing your workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Document Scanning & OCR (Optical Character Recognition)
        </h1>
        <p className="text-gray-300">
          Scan physical documents and automatically extract text, classify
          content, and generate metadata using OCR (Optical Character
          Recognition) technology.
          {context === "admin" && " (Admin Mode)"}
        </p>

        {/* Step-by-Step Guide */}
        <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg backdrop-blur-sm">
          <h3 className="text-green-300 font-semibold mb-2">
            📋 Step-by-Step Process:
          </h3>
          <ol className="text-sm text-gray-300 space-y-2">
            <li>
              <strong>Step 1:</strong> Choose your scanning method (camera, file
              upload, or scanner)
            </li>
            <li>
              <strong>Step 2:</strong> Select or capture your document
            </li>
            <li>
              <strong>Step 3:</strong> Click "Scan Document with OCR" to extract
              text and metadata
            </li>
            <li>
              <strong>Step 4:</strong> Review and edit the auto-generated
              information
            </li>
            <li>
              <strong>Step 5:</strong> Fill in any missing details (title,
              category, priority)
            </li>
            <li>
              <strong>Step 6:</strong> Click "Upload Document" to save to
              database
            </li>
            <li>
              <strong>Step 7:</strong> Document gets chronological reference
              number and is categorized
            </li>
          </ol>
        </div>

        {/* Scanning Options Info */}
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg backdrop-blur-sm">
          <h3 className="text-blue-300 font-semibold mb-2">
            📱 Available Scanning Methods:
          </h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>
              • <strong>Physical Scanner:</strong> Connect USB scanner to your
              computer → Scan document → File automatically appears
            </li>
            <li>
              • <strong>Mobile Camera:</strong> Use phone camera to capture
              documents → Transfer to computer → Upload file
            </li>
            <li>
              • <strong>File Upload:</strong> Upload existing scanned files
              (PDF, JPG, PNG) directly from your device
            </li>
            <li>
              • <strong>Webcam:</strong> Use computer webcam for real-time
              scanning → Capture document → File automatically saved
            </li>
          </ul>
          <p className="text-xs text-blue-200 mt-2">
            <strong>Note:</strong> After selecting your scanning method and
            getting a file, proceed to Step 3 to process with OCR.
          </p>
        </div>

        {/* Document Categories Info */}
        <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg backdrop-blur-sm">
          <h3 className="text-purple-300 font-semibold mb-2">
            📂 Document Categories & Sections:
          </h3>
          <div className="text-sm text-gray-300">
            <p className="mb-2">
              <strong>Main Categories:</strong>{" "}
              {documentMetadata?.categories?.join(", ") || "Loading..."}
            </p>
            <p className="mb-2">
              <strong>Document Sections:</strong> Header (Title, Date,
              Reference), Body (Content, Details), Footer (Signature, Approval),
              Metadata (Tags, Priority)
            </p>
            <p>
              <strong>Auto-Classification:</strong> OCR automatically suggests
              category and tags based on content
            </p>
          </div>
        </div>

        {!isSuperAdmin && (
          <div className="mt-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg backdrop-blur-sm">
            <p className="text-blue-200 text-sm">
              <strong>Note:</strong> File size limit:{" "}
              {formatFileSize(maxFileSize)}.
              {!hasBypassPermission && " Approval workflow will be applied."}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Section */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MdScanner className="mr-2" />
            Document Upload
          </h2>

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              dragActive
                ? "border-blue-400 bg-blue-900/20"
                : "border-white/30 hover:border-white/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <MdDescription className="w-12 h-12 text-blue-400 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-gray-300 text-sm">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <div className="mt-2 flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                    <span className="text-green-400 text-xs">
                      Ready for scanning
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={removeFile}
                    className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full hover:bg-red-900/20"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <MdCloudUpload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-white font-medium">
                    Drop your document here
                  </p>
                  <p className="text-gray-300 text-sm">or click to browse</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) =>
                    e.target.files[0] && handleFileSelect(e.target.files[0])
                  }
                  className="hidden"
                  accept="image/*,.pdf"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Choose File
                </button>
              </div>
            )}
          </div>

          {/* Scan Button */}
          {selectedFile && !ocrResults && (
            <div className="mt-4">
              <button
                onClick={handleScanDocument}
                disabled={isScanning}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? (
                  <>
                    <div className="w-6 h-6 mr-2 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    </div>
                    <span>Scanning... {scanProgress}%</span>
                  </>
                ) : (
                  <>
                    <MdAutoFixHigh className="mr-2 cursor-pointer" />
                    Scan Document with OCR
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* OCR Results Section */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MdAutoFixHigh className="mr-2" />
            OCR Results
          </h2>

          {ocrResults ? (
            <div className="space-y-4">
              {/* Confidence Score */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-300 font-medium">
                    OCR Confidence
                  </span>
                  <span className="text-green-200 font-bold">
                    {(ocrResults.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-green-900/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${ocrResults.confidence * 100}%` }}
                  >
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-green-300 mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>

              {/* Extracted Information */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Detected Document Type
                  </label>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg px-3 py-2">
                    <span className="text-blue-200">
                      {ocrResults.documentType}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Suggested Category
                  </label>
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg px-3 py-2">
                    <span className="text-purple-200">
                      {ocrResults.suggestedCategory}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Extracted Keywords
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ocrResults.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-yellow-900/30 border border-yellow-500/30 rounded text-yellow-200 text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {ocrResults.dateReferences.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Date References
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ocrResults.dateReferences.map((date, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-900/30 border border-green-500/30 rounded text-green-200 text-sm"
                        >
                          {date}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {ocrResults.monetaryValues.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Monetary Values
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ocrResults.monetaryValues.map((value, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-900/30 border border-red-500/30 rounded text-red-200 text-sm"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Toggle */}
              <div className="pt-4 border-t border-white/20">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center text-blue-300 hover:text-blue-200 transition-colors"
                >
                  <MdPreview className="mr-2" />
                  {previewMode ? "Hide" : "Show"} Extracted Text
                </button>
              </div>

              {previewMode && (
                <div className="bg-gray-900/50 border border-gray-600/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <p className="text-gray-200 text-sm whitespace-pre-wrap">
                    {ocrResults.extractedText}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <MdAutoFixHigh className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">
                Upload a document and click "Scan Document with OCR" to extract
                text and metadata.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Document Details Form */}
      {ocrResults && (
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MdSave className="mr-2" />
            Document Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-300"
                  placeholder="Enter document title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Document Type
                </label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white"
                >
                  {documentMetadata?.documentTypes?.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  )) || []}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white"
                >
                  {documentMetadata?.categories?.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  )) || []}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white"
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-300"
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-300"
                placeholder="Enter document description"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isConfidential"
                  checked={formData.isConfidential}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-white">
                  Mark as Confidential
                </span>
              </label>

              {hasBypassPermission && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="bypassApproval"
                    checked={formData.bypassApproval}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-white">
                    Bypass Approval {isSuperAdmin && "(Super Admin)"}
                  </span>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setOcrResults(null);
                  setFormData({
                    title: "",
                    description: "",
                    category: "General",
                    documentType: "Other",
                    priority: "Medium",
                    tags: "",
                    isConfidential: false,
                    department: "",
                    bypassApproval: hasBypassPermission,
                    enableOCR: true,
                    autoClassify: true,
                  });
                }}
                className="px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isScanning}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? (
                  <>
                    <div className="w-5 h-5 mr-2 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <MdSave className="mr-2" />
                    Save Document
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-white/20 transform transition-all duration-300 scale-100">
            <div className="p-6 text-center">
              <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
              <p className="text-gray-300 mb-4">{modalMessage}</p>
              <p className="text-green-200 text-sm mb-4">
                📧 A notification has been sent to your account
              </p>
              {uploadedDocument && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-4">
                  <p className="text-green-200 text-sm">
                    <strong>Reference:</strong> {uploadedDocument.reference}
                  </p>
                  <p className="text-green-200 text-sm">
                    <strong>Title:</strong> {uploadedDocument.title}
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setUploadedDocument(null);
                }}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-white/20 transform transition-all duration-300 scale-100">
            <div className="p-6 text-center">
              <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-red-300 mb-2">
                Upload Failed
              </h3>
              <p className="text-gray-300 mb-4">{modalMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentScanning;
