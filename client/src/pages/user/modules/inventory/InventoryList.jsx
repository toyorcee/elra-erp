import React, { useState, useEffect } from "react";
import {
  CubeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import inventoryService from "../../../../services/inventoryService";
import { toast } from "react-toastify";
import DataTable from "../../../../components/common/DataTable";
import { getFileTypeInfo } from "../../../../constants/fileTypes";
import {
  viewDocument,
  uploadInventoryDocuments,
} from "../../../../services/documents";
import {
  CATEGORY_GROUPS,
  CATEGORY_DISPLAY_NAMES,
} from "../../../../constants/unifiedCategories";
import {
  formatCurrency,
  formatDate,
  formatNumberWithCommas,
  parseFormattedNumber,
} from "../../../../utils/formatters";
import ELRALogo from "../../../../components/ELRALogo.jsx";
import SmartFileUpload from "../../../../components/common/SmartFileUpload";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
} from "../../../../constants/fileTypes";

// Simple button spinner component
const ButtonSpinner = ({ size = "sm" }) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-white border-t-transparent`}
    ></div>
  );
};

const InventoryList = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    completionStatus: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    serialNumber: "",
    licenseType: "",
    numberOfUsers: "",
    location: "",
    dimensions: {
      length: "",
      width: "",
      height: "",
      unit: "m",
    },
    weight: {
      value: "",
      unit: "kg",
    },
    notes: "",
    documents: [],
    deliveryCondition: "",
    receivedBy: "",
    receivedDate: new Date().toISOString().split("T")[0],
    lastMaintenanceDate: "",
    nextMaintenanceDate: "",
    maintenanceInterval: 90,
    customMaintenanceInterval: null,
    maintenanceNotes: "",
  });
  const [isCalculatingMaintenance, setIsCalculatingMaintenance] =
    useState(false);
  const [completingItem, setCompletingItem] = useState(null);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendingItem, setResendingItem] = useState(null);
  const [resendingNotifications, setResendingNotifications] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(null);
  const [loadingView, setLoadingView] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(null);

  const userRole = user?.role?.name || user?.role;
  const userDepartment = user?.department?.name;
  const isSuperAdmin = user?.role?.level === 1000;
  const isOperationsHOD =
    user?.role?.level === 700 && userDepartment === "Operations";
  const hasAccess = user && (isSuperAdmin || isOperationsHOD);

  const needsCompletion = (item) => {
    if (item.completionStatus === "completed") {
      return false;
    }

    const specs = item.specifications || {};
    const hasIncompleteSpecs =
      specs.brand === "TBD" ||
      specs.model === "TBD" ||
      !specs.dimensions?.length ||
      !specs.dimensions?.width ||
      !specs.dimensions?.height;

    const hasNoDocuments = !item.documents || item.documents.length === 0;
    const hasNoNotes = !item.notes || item.notes.length === 0;

    return hasIncompleteSpecs || hasNoDocuments || hasNoNotes;
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Inventory Management. This
            module is restricted to Super Admin and Operations HOD only.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inventoryResponse, statsResponse] = await Promise.all([
        inventoryService.getAllInventory(),
        inventoryService.getInventoryStats(),
      ]);

      if (inventoryResponse.success) {
        setInventory(inventoryResponse.data);
      } else {
        toast.error("Failed to load inventory data");
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error("Error loading inventory data:", error);
      toast.error("Error loading inventory data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (itemId) => {
    setLoadingView(itemId);
    setLoadingDetails(true);
    try {
      const response = await inventoryService.getInventoryById(itemId);
      if (response.success) {
        setSelectedItem(response.data);
        setShowDetailsModal(true);
      } else {
        toast.error("Failed to load item details");
      }
    } catch (error) {
      console.error("Error loading item details:", error);
      toast.error("Error loading item details");
    } finally {
      setLoadingDetails(false);
      setLoadingView(null);
    }
  };

  const handleStatusUpdate = async (itemId, newStatus) => {
    try {
      const response = await inventoryService.updateStatus(itemId, newStatus);
      if (response.success) {
        toast.success("Status updated successfully");
        loadData();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status");
    }
  };

  const resetCompletionForm = () => {
    setCompletionForm({
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      serialNumber: "",
      licenseType: "",
      numberOfUsers: "",
      location: "",
      dimensions: {
        length: "",
        width: "",
        height: "",
        unit: "cm",
      },
      weight: {
        value: "",
        unit: "kg",
      },
      notes: "",
      documents: [],
      deliveryCondition: "",
      receivedBy: "",
      receivedDate: new Date().toISOString().split("T")[0],
      lastMaintenanceDate: "",
      nextMaintenanceDate: "",
      maintenanceInterval: 90,
      customMaintenanceInterval: null,
      maintenanceNotes: "",
    });
    setIsCalculatingMaintenance(false);
  };

  const calculateNextMaintenanceDate = async (lastDate, interval) => {
    setIsCalculatingMaintenance(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    let nextDate = "";
    if (lastDate && interval) {
      const lastDateObj = new Date(lastDate);
      const nextDateObj = new Date(lastDateObj);
      nextDateObj.setDate(lastDateObj.getDate() + interval);
      nextDate = nextDateObj.toISOString().split("T")[0];
    }

    setIsCalculatingMaintenance(false);
    return nextDate;
  };

  const handleCompleteInventory = (item) => {
    setLoadingComplete(item._id);
    setCompletingItem(item);
    setCompletionForm({
      brand: item.specifications?.brand || "",
      model: item.specifications?.model || "",
      year: item.specifications?.year || new Date().getFullYear(),
      licenseType: item.specifications?.licenseType || "",
      numberOfUsers: item.specifications?.numberOfUsers || "",
      location: item.location || "",
      notes: item.notes?.map((n) => n.text).join("\n") || "",
      documents: item.documents || [],
      deliveryCondition: item.deliveryCondition || "",
      receivedBy: item.receivedBy || "",
      receivedDate: item.receivedDate || new Date().toISOString().split("T")[0],
      lastMaintenanceDate: item.maintenance?.lastServiceDate
        ? new Date(item.maintenance.lastServiceDate).toISOString().split("T")[0]
        : "",
      nextMaintenanceDate: item.maintenance?.nextServiceDate
        ? new Date(item.maintenance.nextServiceDate).toISOString().split("T")[0]
        : "",
      maintenanceInterval: item.maintenance?.serviceInterval || 90,
      customMaintenanceInterval: null,
      maintenanceNotes: item.maintenance?.maintenanceNotes || "",
    });
    setShowCompletionModal(true);
    setLoadingComplete(null);
  };

  const handleSubmitCompletion = async () => {
    if (!completingItem) return;

    // Debug logging
    console.log("🔍 [COMPLETION] Form data:", completionForm);
    console.log("🔍 [COMPLETION] Form validation errors:", validateForm());
    console.log("🔍 [COMPLETION] Mode:", isEditMode ? "EDIT" : "CREATE");
    console.log("🔍 [COMPLETION] Documents in form:", completionForm.documents);
    console.log(
      "🔍 [COMPLETION] Documents length:",
      completionForm.documents.length
    );

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);

      console.log("❌ [COMPLETION] Validation errors found:", errors);

      const missingFields = [];
      if (!completionForm.brand || completionForm.brand === "TBD")
        missingFields.push("Brand");
      if (!completionForm.model || completionForm.model === "TBD")
        missingFields.push("Model");
      if (!completionForm.deliveryCondition)
        missingFields.push("Delivery Condition");
      if (!completionForm.receivedBy) missingFields.push("Received By");
      if (!completionForm.receivedDate) missingFields.push("Received Date");

      // Check dimensions
      if (!completionForm.dimensions?.length) missingFields.push("Length");
      if (!completionForm.dimensions?.width) missingFields.push("Width");
      if (!completionForm.dimensions?.height) missingFields.push("Height");

      // Check weight
      if (!completionForm.weight?.value) missingFields.push("Weight");

      // Check maintenance
      if (!completionForm.lastMaintenanceDate)
        missingFields.push("Last Maintenance Date");
      if (!completionForm.nextMaintenanceDate)
        missingFields.push("Next Maintenance Date");
      if (
        !completionForm.maintenanceInterval &&
        !completionForm.customMaintenanceInterval
      )
        missingFields.push("Maintenance Interval");

      console.log("🔍 [COMPLETION] Missing fields detected:", missingFields);
      console.log(
        "🔍 [COMPLETION] Validation errors from validateForm():",
        Object.keys(errors)
      );

      let errorMessage;
      if (missingFields.length > 0) {
        errorMessage = `Missing required fields: ${missingFields.join(", ")}`;
      } else if (errors.nextMaintenanceDate) {
        errorMessage = errors.nextMaintenanceDate;
      } else {
        errorMessage = `Please fix the validation errors: ${Object.keys(
          errors
        ).join(", ")}`;
      }

      toast.error(errorMessage);
      return;
    }

    setValidationErrors({});
    setSubmittingCompletion(true);
    try {
      // First, upload any new documents if they exist
      let uploadedDocumentIds = [];

      console.log("🔍 [DOCUMENTS] Starting document processing:");
      console.log(
        "🔍 [DOCUMENTS] completionForm.documents:",
        completionForm.documents
      );
      console.log(
        "🔍 [DOCUMENTS] completionForm.documents.length:",
        completionForm.documents.length
      );

      if (completionForm.documents.length > 0) {
        // Separate existing documents from new files
        const existingDocuments = completionForm.documents.filter(
          (doc) => doc._id
        );
        const newFiles = completionForm.documents.filter(
          (doc) => !doc._id && doc.file
        );

        console.log("🔍 [DOCUMENTS] Existing documents:", existingDocuments);
        console.log("🔍 [DOCUMENTS] New files:", newFiles);

        uploadedDocumentIds.push(...existingDocuments.map((doc) => doc._id));
        console.log(
          "🔍 [DOCUMENTS] After adding existing docs, uploadedDocumentIds:",
          uploadedDocumentIds
        );

        if (newFiles.length > 0) {
          try {
            const formData = new FormData();

            // Add files to formData (same as project module)
            newFiles.forEach((file, index) => {
              formData.append("documents", file.file);
              formData.append(`title_${index}`, file.name);
              formData.append(`documentType_${index}`, "other");
            });

            // Add inventory metadata
            formData.append("inventoryId", completingItem._id);
            formData.append("inventoryName", completingItem.name);

            console.log(
              "🔍 [DOCUMENTS] Uploading new files via uploadInventoryDocuments..."
            );
            const uploadResponse = await uploadInventoryDocuments(formData);
            console.log("🔍 [DOCUMENTS] Upload response:", uploadResponse);

            if (uploadResponse.success) {
              uploadedDocumentIds.push(...uploadResponse.data.documentIds);
              console.log(
                `✅ [INVENTORY] Uploaded ${newFiles.length} documents successfully`
              );
              console.log(
                "🔍 [DOCUMENTS] Final uploadedDocumentIds after upload:",
                uploadedDocumentIds
              );
            }
          } catch (uploadError) {
            console.error(
              "❌ [INVENTORY] Document upload failed:",
              uploadError
            );
            toast.error("Failed to upload some documents. Please try again.");
            return;
          }
        }
      }

      const updateData = {
        specifications: {
          brand: completionForm.brand,
          model: completionForm.model,
          year: completionForm.year,
          serialNumber: completionForm.serialNumber,
          licenseType: completionForm.licenseType,
          numberOfUsers: completionForm.numberOfUsers,
          dimensions: {
            length: completionForm.dimensions?.length || "",
            width: completionForm.dimensions?.width || "",
            height: completionForm.dimensions?.height || "",
            unit: completionForm.dimensions?.unit || "m",
          },
          weight: {
            value: completionForm.weight?.value || "",
            unit: completionForm.weight?.unit || "kg",
          },
        },
        location: completionForm.location,
        deliveryCondition: completionForm.deliveryCondition,
        receivedBy: completionForm.receivedBy,
        receivedDate: completionForm.receivedDate,
        notes: completionForm.notes
          ? [
              {
                text: completionForm.notes,
                type: "completion",
                addedBy: user._id,
                addedAt: new Date(),
              },
            ]
          : [],
        documents: uploadedDocumentIds,
        maintenance: {
          lastServiceDate: completionForm.lastMaintenanceDate,
          nextServiceDate: completionForm.nextMaintenanceDate,
          serviceInterval:
            completionForm.customMaintenanceInterval ||
            completionForm.maintenanceInterval,
          maintenanceNotes: completionForm.maintenanceNotes,
        },
      };

      console.log(
        "🔍 [SUBMIT] Final uploadedDocumentIds before sending:",
        uploadedDocumentIds
      );
      console.log("🔍 [SUBMIT] Sending updateData to backend:", updateData);
      console.log("🔍 [SUBMIT] Mode:", isEditMode ? "EDIT" : "COMPLETION");
      console.log("🔍 [SUBMIT] Completing item ID:", completingItem._id);

      await inventoryService.updateInventory(completingItem._id, updateData);

      toast.success(
        isEditMode
          ? "Inventory item updated successfully!"
          : "Inventory item completed successfully!"
      );
      setShowCompletionModal(false);
      setCompletingItem(null);
      setIsEditMode(false);
      resetCompletionForm();
      loadData();
    } catch (error) {
      toast.error("Failed to complete inventory item");
      console.error("Completion error:", error);
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const handleEditInventory = (item) => {
    setLoadingEdit(item._id);
    setCompletionForm({
      brand: item.specifications?.brand || "",
      model: item.specifications?.model || "",
      year: item.specifications?.year || new Date().getFullYear(),
      serialNumber: item.specifications?.serialNumber || "",
      licenseType: item.specifications?.licenseType || "",
      numberOfUsers: item.specifications?.numberOfUsers || "",
      location: item.location || "",
      dimensions: {
        length: item.specifications?.dimensions?.length || "",
        width: item.specifications?.dimensions?.width || "",
        height: item.specifications?.dimensions?.height || "",
        unit: item.specifications?.dimensions?.unit || "m",
      },
      weight: {
        value: item.specifications?.weight?.value || "",
        unit: item.specifications?.weight?.unit || "kg",
      },
      notes: item.notes?.map((n) => n.text).join("\n") || "",
      documents: item.documents || [],
      deliveryCondition: item.deliveryCondition || "",
      receivedBy: item.receivedBy || "",
      receivedDate: item.receivedDate
        ? new Date(item.receivedDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      lastMaintenanceDate: item.maintenance?.lastServiceDate
        ? new Date(item.maintenance.lastServiceDate).toISOString().split("T")[0]
        : "",
      nextMaintenanceDate: item.maintenance?.nextServiceDate
        ? new Date(item.maintenance.nextServiceDate).toISOString().split("T")[0]
        : "",
      maintenanceInterval: item.maintenance?.serviceInterval || 90,
      customMaintenanceInterval: null,
      maintenanceNotes: item.maintenance?.maintenanceNotes || "",
    });

    setCompletingItem(item);
    setIsEditMode(true);
    setShowCompletionModal(true);
    setLoadingEdit(null);
  };

  const handleResendNotifications = (item) => {
    setResendingItem(item);
    setShowResendModal(true);
  };

  const handleConfirmResend = async () => {
    if (!resendingItem) return;

    setResendingNotifications(true);
    try {
      const response = await inventoryService.resendNotifications(
        resendingItem._id
      );
      if (response.success) {
        toast.success("Notifications resent successfully!");
        console.log("Resend response:", response.data);
      } else {
        toast.error(response.message || "Failed to resend notifications");
      }
    } catch (error) {
      toast.error("Failed to resend notifications");
      console.error("Resend error:", error);
    } finally {
      setResendingNotifications(false);
      setShowResendModal(false);
      setResendingItem(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      available: "bg-green-100 text-green-800",
      leased: "bg-blue-100 text-blue-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      retired: "bg-gray-100 text-gray-800",
      lost: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || statusColors.available
        }`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    const typeIcons = {
      equipment: "⚙️",
      vehicle: "🚗",
      property: "🏢",
      furniture: "🪑",
      electronics: "💻",
      other: "📦",
    };
    return typeIcons[type] || "📦";
  };

  // Helper function to format text by replacing underscores with spaces
  const formatText = (text) => {
    if (!text) return "N/A";
    return text.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Helper function to get file type info for documents
  const getFileTypeInfoForFile = (filename) => {
    if (!filename) return { icon: "📄", name: "File", color: "text-gray-600" };

    const extension = filename.split(".").pop()?.toLowerCase();
    const mimeType = getMimeTypeFromExtension(extension);
    return (
      getFileTypeInfo(mimeType) || {
        icon: "📄",
        name: "File",
        color: "text-gray-600",
      }
    );
  };

  // Helper function to get MIME type from file extension
  const getMimeTypeFromExtension = (extension) => {
    const mimeTypes = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      txt: "text/plain",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
    };
    return mimeTypes[extension] || "application/octet-stream";
  };

  // Handle document viewing
  const handleViewDocument = async (doc) => {
    setLoadingDocument(doc._id || doc.name);
    try {
      if (doc._id) {
        await viewDocument(doc._id);
        toast.success("Document opened successfully");
      } else {
        const url =
          doc.fileUrl || doc.path || `/uploads/${doc.filename || doc.title}`;
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Failed to open document. Please try again.");
    } finally {
      setLoadingDocument(null);
    }
  };

  // Validation functions
  const validateForm = () => {
    const errors = {};

    // Required field validation
    if (!completionForm.brand?.trim()) {
      errors.brand = "Brand is required";
    }
    if (!completionForm.model?.trim()) {
      errors.model = "Model is required";
    }
    if (!completionForm.deliveryCondition) {
      errors.deliveryCondition = "Delivery condition is required";
    }
    if (!completionForm.receivedBy?.trim()) {
      errors.receivedBy = "Received by is required";
    }
    if (!completionForm.receivedDate) {
      errors.receivedDate = "Received date is required";
    }

    // Number field validation
    if (
      completionForm.year &&
      (completionForm.year < 1900 ||
        completionForm.year > new Date().getFullYear() + 45)
    ) {
      errors.year =
        "Year must be between 1900 and " + (new Date().getFullYear() + 45);
    }
    if (
      completionForm.numberOfUsers &&
      (isNaN(completionForm.numberOfUsers) || completionForm.numberOfUsers < 1)
    ) {
      errors.numberOfUsers = "Number of users must be a positive number";
    }
    if (
      completionForm.dimensions?.length &&
      (isNaN(completionForm.dimensions.length) ||
        completionForm.dimensions.length < 0)
    ) {
      errors.dimensionsLength = "Length must be a positive number";
    }
    if (
      completionForm.dimensions?.width &&
      (isNaN(completionForm.dimensions.width) ||
        completionForm.dimensions.width < 0)
    ) {
      errors.dimensionsWidth = "Width must be a positive number";
    }
    if (
      completionForm.dimensions?.height &&
      (isNaN(completionForm.dimensions.height) ||
        completionForm.dimensions.height < 0)
    ) {
      errors.dimensionsHeight = "Height must be a positive number";
    }
    if (
      completionForm.weight?.value &&
      (isNaN(completionForm.weight.value) || completionForm.weight.value < 0)
    ) {
      errors.weightValue = "Weight must be a positive number";
    }

    // Date validation
    if (
      completionForm.lastMaintenanceDate &&
      new Date(completionForm.lastMaintenanceDate) > new Date()
    ) {
      errors.lastMaintenanceDate =
        "Last maintenance date cannot be in the future";
    }
    if (
      completionForm.nextMaintenanceDate &&
      new Date(completionForm.nextMaintenanceDate) < new Date()
    ) {
      console.log("🔍 [DATE VALIDATION] Next maintenance date issue:", {
        nextMaintenanceDate: completionForm.nextMaintenanceDate,
        nextDate: new Date(completionForm.nextMaintenanceDate),
        today: new Date(),
        isPast: new Date(completionForm.nextMaintenanceDate) < new Date(),
      });

      if (
        completionForm.lastMaintenanceDate &&
        completionForm.maintenanceInterval
      ) {
        const lastDate = new Date(completionForm.lastMaintenanceDate);
        const interval =
          completionForm.customMaintenanceInterval ||
          completionForm.maintenanceInterval;
        const calculatedNext = new Date(lastDate);
        calculatedNext.setDate(lastDate.getDate() + interval);

        if (
          calculatedNext.toISOString().split("T")[0] ===
          completionForm.nextMaintenanceDate
        ) {
          errors.nextMaintenanceDate = `⚠️ Auto-calculated next maintenance date (${completionForm.nextMaintenanceDate}) is in the past. Please change your last maintenance date to a more recent date (like today or yesterday) so the next maintenance falls in the future.`;
        } else {
          errors.nextMaintenanceDate =
            "Next maintenance date must be today or in the future";
        }
      } else {
        errors.nextMaintenanceDate =
          "Next maintenance date must be today or in the future";
      }
    }

    return errors;
  };

  const columns = [
    {
      header: "Item Details",
      accessor: "name",
      renderer: (item) => (
        <div className="flex items-center">
          <div>
            <div className="font-medium text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-500">{item.code}</div>
            <div className="text-xs text-gray-400">
              Qty: {item.quantity || 1}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Project & Procurement",
      accessor: "project",
      renderer: (item) => {
        const docCount = item.documents?.length || 0;
        const hasCompletionPDF = item.documents?.some(
          (doc) => doc.type === "completion_certificate"
        );

        return (
          <div>
            <div className="font-medium text-gray-900">
              {item.project?.name || "N/A"}
            </div>
            <div className="text-sm text-gray-500">
              PO:{" "}
              {item.procurementId?.poNumber ||
                item.specifications?.procurementOrder ||
                "N/A"}
            </div>
            <div className="text-xs text-gray-400">
              {formatText(item.category)}
            </div>
            {docCount > 0 && (
              <div className="text-xs text-blue-600 mt-1 flex items-center space-x-1">
                <DocumentIcon className="h-3 w-3" />
                <span>{docCount} docs</span>
                {hasCompletionPDF && (
                  <span className="text-green-600">+ PDF</span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Delivery Address",
      accessor: "deliveryAddress",
      renderer: (item) => {
        const deliveryAddress = item.procurementId?.deliveryAddress;
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {deliveryAddress?.street || "N/A"}
            </div>
            <div className="text-gray-500">
              {deliveryAddress?.city && deliveryAddress?.state
                ? `${deliveryAddress.city}, ${deliveryAddress.state}`
                : deliveryAddress?.city || deliveryAddress?.state || "N/A"}
            </div>
            <div className="text-xs text-gray-400">
              Contact: {deliveryAddress?.contactPerson || "N/A"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Price & Value",
      accessor: "currentValue",
      renderer: (item) => (
        <div className="space-y-1">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(item.currentValue)}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Unit: {formatCurrency(item.unitPrice || item.purchasePrice)}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (item) => getStatusBadge(item.status),
    },
    {
      header: "Completion",
      accessor: "completion",
      renderer: (item) => {
        const incomplete = needsCompletion(item);
        return (
          <div className="flex items-center">
            {incomplete ? (
              <div className="flex items-center text-amber-600">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Needs Completion</span>
              </div>
            ) : (
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Complete</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Maintenance",
      accessor: "maintenance",
      renderer: (item) => {
        const lastMaintenance = item.maintenance?.lastServiceDate;
        const nextMaintenance = item.maintenance?.nextServiceDate;

        if (!lastMaintenance || !nextMaintenance) {
          return <div className="text-xs text-gray-400">Not scheduled</div>;
        }

        const nextDate = new Date(nextMaintenance);
        const today = new Date();
        const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

        let statusColor = "text-green-600";
        let statusText = `${daysUntil} days`;

        if (daysUntil <= 0) {
          statusColor = "text-red-600";
          statusText = "Overdue";
        } else if (daysUntil <= 7) {
          statusColor = "text-amber-600";
          statusText = `${daysUntil} days`;
        }

        return (
          <div className="text-xs">
            <div className="text-gray-500">
              Last: {formatDate(lastMaintenance)}
            </div>
            <div className={`font-medium ${statusColor}`}>
              Next: {formatDate(nextMaintenance)}
            </div>
            <div className={`text-xs ${statusColor}`}>{statusText}</div>
          </div>
        );
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      renderer: (item) => {
        const incomplete = needsCompletion(item);
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewDetails(item._id)}
              disabled={loadingView === item._id}
              className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="View Details"
            >
              {loadingView === item._id ? (
                <ButtonSpinner size="xs" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
            {incomplete && (
              <button
                onClick={() => handleCompleteInventory(item)}
                disabled={loadingComplete === item._id}
                className="px-2 py-1 text-xs font-medium text-white bg-[var(--elra-primary)] rounded-md hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1"
                title="Complete Inventory"
              >
                {loadingComplete === item._id ? (
                  <>
                    <ButtonSpinner size="xs" />
                    Loading...
                  </>
                ) : (
                  "Complete"
                )}
              </button>
            )}
            {!incomplete && (
              <>
                <button
                  onClick={() => handleEditInventory(item)}
                  disabled={loadingEdit === item._id}
                  className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Edit Inventory"
                >
                  {loadingEdit === item._id ? (
                    <ButtonSpinner size="xs" />
                  ) : (
                    <PencilIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleResendNotifications(item)}
                  className="p-1 text-green-600 hover:text-green-800 cursor-pointer transition-colors"
                  title="Resend Notifications"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  const filteredInventory = inventory.filter((item) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        item.name?.toLowerCase().includes(searchLower) ||
        item.code?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) {
        return false;
      }
    }

    // Status filter
    if (filters.status !== "all" && item.status !== filters.status) {
      return false;
    }

    // Category filter
    if (filters.category !== "all" && item.category !== filters.category) {
      return false;
    }

    // Completion status filter
    if (filters.completionStatus !== "all") {
      const needsCompletionCheck = needsCompletion(item);
      if (filters.completionStatus === "incomplete" && !needsCompletionCheck) {
        return false;
      }
      if (filters.completionStatus === "complete" && needsCompletionCheck) {
        return false;
      }
    }

    return true;
  });

  const totalItems = inventory.length;
  const availableItems = inventory.filter(
    (item) => item.status === "available"
  ).length;
  const maintenanceDue = inventory.filter(
    (item) =>
      item.maintenance?.nextServiceDate &&
      new Date(item.maintenance.nextServiceDate) <= new Date()
  ).length;
  const incompleteItems = inventory.filter((item) =>
    needsCompletion(item)
  ).length;
  const totalValue = inventory.reduce(
    (sum, item) => sum + (item.currentValue || 0),
    0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Inventory Management
        </h1>
        <p className="text-gray-600">
          Manage and track all inventory items, equipment, and assets
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <CubeIcon className="h-8 w-8 text-[var(--elra-primary)]" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {availableItems}
              </p>
              <p className="text-xs text-gray-500">
                {((availableItems / totalItems) * 100).toFixed(1)}% of total
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Maintenance Due</p>
              <p className="text-2xl font-bold text-gray-900">
                {maintenanceDue}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-[var(--elra-primary)]" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Needs Completion</p>
              <p className="text-2xl font-bold text-gray-900">
                {incompleteItems}
              </p>
              <p className="text-xs text-gray-500">
                {totalItems > 0
                  ? ((incompleteItems / totalItems) * 100).toFixed(1)
                  : 0}
                % of total
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4 w-full">
            {/* Search Input */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, code, or description..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent transition-all duration-200 hover:bg-gray-100"
                />
              </div>
            </div>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="leased">Leased</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
              <option value="lost">Lost</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
            >
              <option value="all">All Categories</option>
              {CATEGORY_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.categories.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_DISPLAY_NAMES[category]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <select
              value={filters.completionStatus}
              onChange={(e) =>
                setFilters({ ...filters, completionStatus: e.target.value })
              }
              className="rounded-md border-gray-300 shadow-sm focus:border-[var(--elra-primary)] focus:ring focus:ring-[var(--elra-primary)] focus:ring-opacity-50"
            >
              <option value="all">All Items</option>
              <option value="incomplete">Needs Completion</option>
              <option value="complete">Completed</option>
            </select>
            <button
              onClick={loadData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)]"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredInventory}
          actions={{
            showEdit: false,
            showDelete: false,
            showToggle: false,
          }}
        />
      </div>

      {/* Item Details Modal */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Enhanced Header with ELRA Branding */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <ELRALogo variant="dark" size="md" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedItem.name}
                    </h2>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-white text-opacity-90 text-sm">
                        Code: {selectedItem.code}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-white bg-opacity-60 rounded-full"></span>
                        <span className="text-white text-opacity-75 text-xs">
                          {formatText(selectedItem.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedItem(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Enhanced Information Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Basic Information Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Basic Information
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-blue-100">
                      <span className="text-sm font-medium text-gray-600">
                        Type
                      </span>
                      <span className="text-sm font-semibold text-gray-900 bg-blue-100 px-3 py-1 rounded-full">
                        {formatText(selectedItem.type)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-100">
                      <span className="text-sm font-medium text-gray-600">
                        Category
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatText(selectedItem.category)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-100">
                      <span className="text-sm font-medium text-gray-600">
                        Status
                      </span>
                      <div>{getStatusBadge(selectedItem.status)}</div>
                    </div>
                    <div className="pt-2">
                      <span className="text-sm font-medium text-gray-600 block mb-2">
                        Description
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedItem.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Information Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Financial Information
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-green-100">
                      <span className="text-sm font-medium text-gray-600">
                        Purchase Price
                      </span>
                      <span className="text-sm font-bold text-green-700">
                        {formatCurrency(selectedItem.purchasePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-100">
                      <span className="text-sm font-medium text-gray-600">
                        Current Value
                      </span>
                      <span className="text-sm font-bold text-green-700">
                        {formatCurrency(selectedItem.currentValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-100">
                      <span className="text-sm font-medium text-gray-600">
                        Created Date
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatDate(selectedItem.createdAt)}
                      </span>
                    </div>
                    <div className="pt-2">
                      <div className="bg-green-100 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-green-700">
                            Value Retention
                          </span>
                          <span className="text-xs font-bold text-green-800">
                            {(
                              (selectedItem.currentValue /
                                selectedItem.purchasePrice) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Information Card */}
              {selectedItem.location && selectedItem.location.trim() !== "" && (
                <div className="mb-8">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Location
                      </h3>
                    </div>
                    <div className="text-sm text-gray-700">
                      {selectedItem.location}
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Information Card */}
              {selectedItem.maintenance &&
                (selectedItem.maintenance.lastServiceDate ||
                  selectedItem.maintenance.nextServiceDate ||
                  selectedItem.maintenance.serviceInterval) && (
                  <div className="mb-8">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <WrenchScrewdriverIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Maintenance
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {selectedItem.maintenance.lastServiceDate && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-600">
                              Last Service
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatDate(
                                selectedItem.maintenance.lastServiceDate
                              )}
                            </span>
                          </div>
                        )}
                        {selectedItem.maintenance.nextServiceDate && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-600">
                              Next Service
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatDate(
                                selectedItem.maintenance.nextServiceDate
                              )}
                            </span>
                          </div>
                        )}
                        {selectedItem.maintenance.serviceInterval && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-medium text-gray-600">
                              Service Interval
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              Every {selectedItem.maintenance.serviceInterval}{" "}
                              days
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Documents Section */}
              {selectedItem.documents && selectedItem.documents.length > 0 && (
                <div className="mb-8">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <DocumentIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Documents ({selectedItem.documents.length})
                      </h3>
                    </div>

                    {/* Categorize documents */}
                    {(() => {
                      const completionPDFs = selectedItem.documents.filter(
                        (doc) => doc.type === "completion_certificate"
                      );
                      const userDocuments = selectedItem.documents.filter(
                        (doc) => doc.type !== "completion_certificate"
                      );

                      return (
                        <div className="space-y-6">
                          {/* Generated PDFs Section */}
                          {completionPDFs.length > 0 && (
                            <div>
                              <h4 className="text-md font-medium text-gray-700 mb-3">
                                Generated Completion Certificates (
                                {completionPDFs.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {completionPDFs.map((doc, index) => {
                                  const fileTypeInfo = getFileTypeInfoForFile(
                                    doc.title || doc.filename
                                  );

                                  return (
                                    <div
                                      key={`completion-${index}`}
                                      className="border border-gray-200 bg-gray-50 rounded-lg p-4"
                                    >
                                      <div className="flex items-start space-x-3">
                                        <div
                                          className={`text-2xl ${fileTypeInfo.color}`}
                                        >
                                          {fileTypeInfo.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center space-x-2">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                              {doc.title || doc.filename}
                                            </p>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                              Generated PDF
                                            </span>
                                          </div>
                                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                                            <span className="capitalize">
                                              {doc.type ||
                                                "completion_certificate"}
                                            </span>
                                            {doc.size && (
                                              <span>
                                                {(doc.size / 1024).toFixed(1)}{" "}
                                                KB
                                              </span>
                                            )}
                                            {doc.uploadedAt && (
                                              <span>
                                                {formatDate(doc.uploadedAt)}
                                              </span>
                                            )}
                                          </div>
                                          <div className="mt-2">
                                            <button
                                              onClick={() =>
                                                handleViewDocument(doc)
                                              }
                                              disabled={
                                                loadingDocument === doc._id
                                              }
                                              className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                              title="View Completion Certificate"
                                            >
                                              {loadingDocument === doc._id ? (
                                                <ButtonSpinner size="xs" />
                                              ) : (
                                                <EyeIcon className="h-4 w-4" />
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* User Uploaded Documents Section */}
                          {userDocuments.length > 0 && (
                            <div>
                              <h4 className="text-md font-medium text-gray-700 mb-3">
                                User Uploaded Documents ({userDocuments.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userDocuments.map((doc, index) => {
                                  const fileTypeInfo = getFileTypeInfoForFile(
                                    doc.title || doc.filename
                                  );

                                  return (
                                    <div
                                      key={`user-${index}`}
                                      className="border border-gray-200 bg-gray-50 rounded-lg p-4"
                                    >
                                      <div className="flex items-start space-x-3">
                                        <div
                                          className={`text-2xl ${fileTypeInfo.color}`}
                                        >
                                          {fileTypeInfo.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center space-x-2">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                              {doc.title || doc.filename}
                                            </p>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                              Uploaded
                                            </span>
                                          </div>
                                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                                            <span className="capitalize">
                                              {doc.type || "other"}
                                            </span>
                                            {doc.size && (
                                              <span>
                                                {(doc.size / 1024).toFixed(1)}{" "}
                                                KB
                                              </span>
                                            )}
                                            {doc.uploadedAt && (
                                              <span>
                                                {formatDate(doc.uploadedAt)}
                                              </span>
                                            )}
                                          </div>
                                          <div className="mt-2">
                                            <button
                                              onClick={() =>
                                                handleViewDocument(doc)
                                              }
                                              disabled={
                                                loadingDocument === doc._id
                                              }
                                              className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                              title="View Document"
                                            >
                                              {loadingDocument === doc._id ? (
                                                <ButtonSpinner size="xs" />
                                              ) : (
                                                <EyeIcon className="h-4 w-4" />
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Completion Modal */}
      {showCompletionModal && completingItem && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <ELRALogo variant="dark" size="md" />
                </div>
                <div className="flex-1 text-center">
                  <h2 className="text-2xl font-bold">
                    {isEditMode
                      ? "Edit Inventory Item"
                      : "Complete Inventory Item"}
                  </h2>
                  <p className="text-white text-opacity-90 mt-1 text-sm">
                    {completingItem.name} - {completingItem.code}
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-white text-opacity-75">
                    <div>Project: {completingItem.project?.name || "N/A"}</div>
                    <div>
                      Procurement:{" "}
                      {completingItem.procurementId?.poNumber ||
                        completingItem.specifications?.procurementOrder ||
                        "N/A"}
                    </div>
                    <div>
                      Quantity: {completingItem.quantity || 1} | Price:{" "}
                      {formatCurrency(completingItem.purchasePrice)}
                    </div>
                    <div>
                      Delivery Address:{" "}
                      {completingItem.procurementId?.deliveryAddress?.street ||
                        "N/A"}
                      ,{" "}
                      {completingItem.procurementId?.deliveryAddress?.city ||
                        "N/A"}
                      ,{" "}
                      {completingItem.procurementId?.deliveryAddress?.state ||
                        "N/A"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowCompletionModal(false);
                      setCompletingItem(null);
                      resetCompletionForm();
                    }}
                    disabled={submittingCompletion}
                    className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 bg-white overflow-y-auto flex-1">
              {/* Form */}
              <div className="space-y-6">
                {/* Specifications Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CubeIcon className="h-5 w-5 mr-2 text-[var(--elra-primary)]" />
                    Item Specifications
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={completionForm.brand}
                        onChange={(e) => {
                          setCompletionForm({
                            ...completionForm,
                            brand: e.target.value,
                          });
                          // Clear error when user starts typing
                          if (validationErrors.brand) {
                            setValidationErrors({
                              ...validationErrors,
                              brand: null,
                            });
                          }
                        }}
                        placeholder="Enter brand name (e.g., Microsoft, Adobe)"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                          validationErrors.brand
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {validationErrors.brand && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.brand}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={completionForm.model}
                        onChange={(e) =>
                          setCompletionForm({
                            ...completionForm,
                            model: e.target.value,
                          })
                        }
                        placeholder="Enter model name (e.g., Office 365, Creative Cloud)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        value={completionForm.year}
                        onChange={(e) => {
                          setCompletionForm({
                            ...completionForm,
                            year: parseInt(e.target.value) || "",
                          });
                          if (validationErrors.year) {
                            setValidationErrors({
                              ...validationErrors,
                              year: null,
                            });
                          }
                        }}
                        placeholder="2025"
                        min="1900"
                        max={new Date().getFullYear() + 45}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                          validationErrors.year
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {validationErrors.year && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.year}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        value={completionForm.serialNumber}
                        onChange={(e) =>
                          setCompletionForm({
                            ...completionForm,
                            serialNumber: e.target.value,
                          })
                        }
                        placeholder="Enter serial number (e.g., MS-365-2025-001)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Type
                      </label>
                      <select
                        value={completionForm.licenseType}
                        onChange={(e) =>
                          setCompletionForm({
                            ...completionForm,
                            licenseType: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      >
                        <option value="">Select license type</option>
                        <option value="Annual">Annual</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Perpetual">Perpetual</option>
                        <option value="One-time">One-time</option>
                        <option value="Trial">Trial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Users
                      </label>
                      <input
                        type="text"
                        value={
                          completionForm.numberOfUsers
                            ? formatNumberWithCommas(
                                completionForm.numberOfUsers.toString()
                              )
                            : ""
                        }
                        onChange={(e) => {
                          const numericValue = parseFormattedNumber(
                            e.target.value
                          );
                          setCompletionForm({
                            ...completionForm,
                            numberOfUsers: numericValue,
                          });
                        }}
                        placeholder="Enter number of users (e.g., 1,000)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={completionForm.location}
                        onChange={(e) =>
                          setCompletionForm({
                            ...completionForm,
                            location: e.target.value,
                          })
                        }
                        placeholder="Enter storage/installation location"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dimensions (Length x Width x Height)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          value={completionForm.dimensions?.length || ""}
                          onChange={(e) =>
                            setCompletionForm({
                              ...completionForm,
                              dimensions: {
                                ...completionForm.dimensions,
                                length: parseFloat(e.target.value),
                              },
                            })
                          }
                          placeholder="Length"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                        />
                        <input
                          type="number"
                          value={completionForm.dimensions?.width || ""}
                          onChange={(e) =>
                            setCompletionForm({
                              ...completionForm,
                              dimensions: {
                                ...completionForm.dimensions,
                                width: parseFloat(e.target.value),
                              },
                            })
                          }
                          placeholder="Width"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                        />
                        <input
                          type="number"
                          value={completionForm.dimensions?.height || ""}
                          onChange={(e) =>
                            setCompletionForm({
                              ...completionForm,
                              dimensions: {
                                ...completionForm.dimensions,
                                height: parseFloat(e.target.value),
                              },
                            })
                          }
                          placeholder="Height"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weight
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={
                            completionForm.weight?.value
                              ? formatNumberWithCommas(
                                  completionForm.weight.value.toString()
                                )
                              : ""
                          }
                          onChange={(e) => {
                            const formattedValue = formatNumberWithCommas(
                              e.target.value
                            );
                            const numericValue = parseFormattedNumber(
                              e.target.value
                            );

                            setCompletionForm({
                              ...completionForm,
                              weight: {
                                ...completionForm.weight,
                                value: numericValue,
                              },
                            });
                          }}
                          placeholder="Weight value (e.g., 1,000)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                        />
                        <select
                          value={completionForm.weight?.unit || "kg"}
                          onChange={(e) =>
                            setCompletionForm({
                              ...completionForm,
                              weight: {
                                ...completionForm.weight,
                                unit: e.target.value,
                              },
                            })
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                        >
                          <option value="g">g (grams)</option>
                          <option value="kg">kg (kilograms)</option>
                          <option value="lbs">lbs (pounds)</option>
                          <option value="tons">tons</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Information Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2 text-[var(--elra-primary)]" />
                    Delivery & Receipt Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Condition{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={completionForm.deliveryCondition}
                        onChange={(e) =>
                          setCompletionForm({
                            ...completionForm,
                            deliveryCondition: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      >
                        <option value="">Select condition</option>
                        <option value="excellent">Excellent - No issues</option>
                        <option value="good">Good - Minor issues</option>
                        <option value="fair">Fair - Some damage</option>
                        <option value="poor">Poor - Significant damage</option>
                        <option value="damaged">Damaged - Not usable</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Received By <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={completionForm.receivedBy}
                        onChange={(e) =>
                          setCompletionForm({
                            ...completionForm,
                            receivedBy: e.target.value,
                          })
                        }
                        placeholder="Enter name of person who received the items"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Received Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={completionForm.receivedDate}
                        onChange={(e) =>
                          setCompletionForm({
                            ...completionForm,
                            receivedDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Upload Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-[var(--elra-primary)]" />
                    Attach Documents
                  </h3>

                  <SmartFileUpload
                    files={completionForm.documents}
                    onFilesChange={(newFiles) => {
                      console.log(
                        "🔍 [SmartFileUpload] onFilesChange called with:",
                        newFiles
                      );
                      setCompletionForm({
                        ...completionForm,
                        documents: newFiles,
                      });
                    }}
                    maxFiles={5}
                    maxSizePerFile={MAX_FILE_SIZE}
                    acceptedTypes={ALLOWED_FILE_TYPES}
                  />
                </div>

                {/* Maintenance Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-[var(--elra-primary)]" />
                    Maintenance Schedule
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Step 1: Maintenance Interval */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maintenance Interval (Days){" "}
                        <span className="text-blue-500">*</span>
                      </label>
                      <select
                        value={
                          completionForm.maintenanceInterval === "custom"
                            ? "custom"
                            : completionForm.maintenanceInterval || ""
                        }
                        onChange={async (e) => {
                          const selectedValue = e.target.value;
                          if (selectedValue === "custom") {
                            setCompletionForm({
                              ...completionForm,
                              maintenanceInterval: "custom",
                              nextMaintenanceDate: "",
                            });
                          } else {
                            const interval = parseInt(selectedValue) || null;
                            let nextDate = "";

                            if (interval) {
                              if (completionForm.lastMaintenanceDate) {
                                nextDate = await calculateNextMaintenanceDate(
                                  completionForm.lastMaintenanceDate,
                                  interval
                                );
                              } else {
                                const currentDate = new Date();
                                const nextDateObj = new Date(currentDate);
                                nextDateObj.setDate(
                                  currentDate.getDate() + interval
                                );
                                nextDate = nextDateObj
                                  .toISOString()
                                  .split("T")[0];
                              }
                            }

                            setCompletionForm({
                              ...completionForm,
                              maintenanceInterval: interval,
                              customMaintenanceInterval: null,
                              nextMaintenanceDate: nextDate,
                            });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      >
                        <option value="">Select interval first</option>
                        <option value="1">1 day (Daily)</option>
                        <option value="7">7 days (Weekly)</option>
                        <option value="14">14 days (Bi-weekly)</option>
                        <option value="30">30 days (Monthly)</option>
                        <option value="60">60 days (Bi-monthly)</option>
                        <option value="90">90 days (Quarterly)</option>
                        <option value="120">120 days (4 months)</option>
                        <option value="180">180 days (6 months)</option>
                        <option value="365">365 days (Annual)</option>
                        <option value="custom">Custom (specify days)</option>
                      </select>
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Select this first to enable smart date calculation
                      </p>

                      {/* Custom interval input */}
                      {completionForm.maintenanceInterval === "custom" && (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Custom Interval (Days)
                          </label>
                          <input
                            type="number"
                            value={
                              completionForm.customMaintenanceInterval || ""
                            }
                            onChange={async (e) => {
                              const customInterval =
                                parseInt(e.target.value) || null;
                              let nextDate = "";

                              if (customInterval) {
                                if (completionForm.lastMaintenanceDate) {
                                  nextDate = await calculateNextMaintenanceDate(
                                    completionForm.lastMaintenanceDate,
                                    customInterval
                                  );
                                } else {
                                  const currentDate = new Date();
                                  const nextDateObj = new Date(currentDate);
                                  nextDateObj.setDate(
                                    currentDate.getDate() + customInterval
                                  );
                                  nextDate = nextDateObj
                                    .toISOString()
                                    .split("T")[0];
                                }
                              }

                              setCompletionForm({
                                ...completionForm,
                                customMaintenanceInterval: customInterval,
                                maintenanceInterval: "custom",
                                nextMaintenanceDate: nextDate,
                              });
                            }}
                            placeholder="Enter number of days"
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter the number of days between maintenance
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Last Maintenance Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Maintenance Date
                      </label>
                      <input
                        type="date"
                        value={completionForm.lastMaintenanceDate || ""}
                        onChange={async (e) => {
                          const lastDate = e.target.value;
                          let nextDate = "";

                          if (lastDate && completionForm.maintenanceInterval) {
                            const intervalToUse =
                              completionForm.customMaintenanceInterval ||
                              completionForm.maintenanceInterval;

                            if (
                              typeof intervalToUse === "number" &&
                              intervalToUse > 0
                            ) {
                              nextDate = await calculateNextMaintenanceDate(
                                lastDate,
                                intervalToUse
                              );
                            }
                          }

                          setCompletionForm({
                            ...completionForm,
                            lastMaintenanceDate: lastDate,
                            nextMaintenanceDate: nextDate,
                          });
                        }}
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                        disabled={!completionForm.maintenanceInterval}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {!completionForm.maintenanceInterval
                          ? "⚠️ Select maintenance interval first"
                          : "When was this item last serviced?"}
                      </p>
                    </div>

                    {/* Step 3: Next Maintenance Date (Auto-calculated) */}
                    <div>
                      <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                        <span>
                          Next Maintenance Date
                          {completionForm.maintenanceInterval &&
                            completionForm.lastMaintenanceDate && (
                              <span className="text-green-500 ml-1">
                                ✨ Auto-calculated
                              </span>
                            )}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCompletionForm({
                              ...completionForm,
                              lastMaintenanceDate: "",
                              nextMaintenanceDate: "",
                              maintenanceInterval: 90,
                              customMaintenanceInterval: null,
                            });
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1"
                          title="Clear maintenance dates and reset interval"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={completionForm.nextMaintenanceDate || ""}
                          onChange={(e) =>
                            setCompletionForm({
                              ...completionForm,
                              nextMaintenanceDate: e.target.value,
                            })
                          }
                          min={new Date().toISOString().split("T")[0]}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent ${
                            completionForm.maintenanceInterval &&
                            completionForm.lastMaintenanceDate
                              ? "border-green-300 bg-green-50"
                              : "border-gray-300"
                          } ${isCalculatingMaintenance ? "opacity-50" : ""}`}
                          disabled={
                            !completionForm.maintenanceInterval ||
                            !completionForm.lastMaintenanceDate ||
                            isCalculatingMaintenance
                          }
                        />
                        {isCalculatingMaintenance && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--elra-primary)]"></div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {!completionForm.maintenanceInterval ||
                        !completionForm.lastMaintenanceDate
                          ? "Will be auto-calculated after setting interval and last date"
                          : "✅ Automatically calculated based on interval and last date"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maintenance Notes
                      </label>
                      <textarea
                        value={completionForm.maintenanceNotes}
                        onChange={(e) =>
                          setCompletionForm({
                            ...completionForm,
                            maintenanceNotes: e.target.value,
                          })
                        }
                        placeholder="Enter maintenance requirements, special instructions, or notes..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-[var(--elra-primary)]" />
                    Additional Notes
                  </h3>
                  <textarea
                    value={completionForm.notes}
                    onChange={(e) =>
                      setCompletionForm({
                        ...completionForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Enter any additional notes, installation instructions, or special requirements..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 pt-0 border-t border-gray-200 bg-white">
              <button
                onClick={handleSubmitCompletion}
                disabled={
                  submittingCompletion ||
                  !completionForm.brand ||
                  !completionForm.model ||
                  !completionForm.deliveryCondition ||
                  !completionForm.receivedBy ||
                  !completionForm.receivedDate
                }
                className="px-6 py-3 mt-4 text-sm font-medium text-white bg-[var(--elra-primary)] border border-transparent rounded-lg hover:bg-[var(--elra-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300 cursor-pointer"
              >
                {submittingCompletion ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditMode ? "Updating..." : "Completing..."}
                  </>
                ) : isEditMode ? (
                  "Update Inventory"
                ) : (
                  "Complete Inventory"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend Notifications Modal */}
      {showResendModal && resendingItem && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
                <ArrowPathIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Resend Notifications
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to resend completion notifications for{" "}
                <span className="font-medium">{resendingItem.name}</span> (
                {resendingItem.code})?
                <br />
                <span className="text-xs text-gray-400 mt-1 block">
                  This will send emails to Project Manager, Project Owner,
                  Project Management HOD, and Super Admins.
                </span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowResendModal(false);
                    setResendingItem(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={resendingNotifications}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmResend}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={resendingNotifications}
                >
                  {resendingNotifications ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resending...
                    </div>
                  ) : (
                    "Resend Notifications"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
