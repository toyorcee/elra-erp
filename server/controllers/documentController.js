import Document from "../models/Document.js";
import User from "../models/User.js";
import {
  upload,
  formatFileSize,
  getFileExtension,
} from "../utils/fileUtils.js";
import {
  createDocumentMetadata,
  getDocumentType,
  generateDocRef,
} from "../utils/documentUtils.js";
import { hasPermission } from "../utils/permissionUtils.js";
import AuditService from "../services/auditService.js";
import NotificationService from "../services/notificationService.js";
import OCRService from "../services/ocrService.js";
import SearchService from "../services/searchService.js";
import ApprovalLevel from "../models/ApprovalLevel.js";
import Project from "../models/Project.js";
import ProjectDocumentService from "../services/projectDocumentService.js";
import ProjectAuditService from "../services/projectAuditService.js";

// Smart function to determine document status
const determineDocumentStatus = async (currentUser, category, department) => {
  try {
    // Check if any approval workflows are configured for ELRA
    const approvalWorkflows = await ApprovalLevel.find({
      isActive: true,
    });

    // If no approval workflows exist, auto-approve the document
    if (!approvalWorkflows || approvalWorkflows.length === 0) {
      console.log(
        "✅ [documentController] No approval workflows found - auto-approving document"
      );
      return "APPROVED";
    }

    // Check if there's a specific workflow for this category/department
    const relevantWorkflow = approvalWorkflows.find(
      (workflow) =>
        (workflow.category === category || workflow.category === "ALL") &&
        (workflow.department === department || workflow.department === "ALL")
    );

    // If no specific workflow found, check for default workflow
    const defaultWorkflow = approvalWorkflows.find(
      (workflow) => workflow.category === "ALL" && workflow.department === "ALL"
    );

    const workflowToUse = relevantWorkflow || defaultWorkflow;

    if (workflowToUse) {
      console.log(
        `📋 [documentController] Found approval workflow: ${workflowToUse.name} - setting status to PENDING_APPROVAL`
      );
      return "PENDING_APPROVAL";
    } else {
      console.log(
        "✅ [documentController] No matching approval workflow found - auto-approving document"
      );
      return "APPROVED";
    }
  } catch (error) {
    console.error(
      "❌ [documentController] Error determining document status:",
      error
    );
    // Default to APPROVED if there's an error (safer than losing documents)
    return "APPROVED";
  }
};

// Upload document
export const uploadDocument = async (req, res) => {
  console.log("🚀 [documentController] Starting document upload process");
  console.log("👤 [documentController] User:", {
    id: req.user._id,
    username: req.user.username,
    role: req.user.role?.name,
    permissions: req.user.role?.permissions,
  });

  try {
    const currentUser = req.user;

    // Check if user has permission to upload documents
    if (!hasPermission(currentUser, "document.upload")) {
      console.log(
        "❌ [documentController] Permission denied for document upload"
      );
      return res.status(403).json({
        success: false,
        message: "You do not have permission to upload documents",
      });
    }

    console.log("✅ [documentController] User has upload permission");

    // Use multer upload middleware
    upload.single("document")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const {
        title,
        description,
        category,
        documentType,
        priority,
        tags,
        department,
      } = req.body;

      console.log("[documentController] Incoming req.body:", req.body);
      console.log(
        "[documentController] Department value received:",
        department
      );

      console.log("📄 [documentController] File received:", {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        path: req.file.path,
      });

      // Process document with OCR for enhanced metadata
      let ocrMetadata = {};
      let extractedText = "";

      console.log("🔍 [documentController] Starting OCR processing...");
      try {
        const ocrResult = await OCRService.processDocument(req.file.path, {
          language: "eng",
        });

        console.log("📊 [documentController] OCR result:", {
          success: ocrResult.success,
          confidence: ocrResult.confidence,
          documentType: ocrResult.documentType,
          keywordsCount: ocrResult.keywords?.length || 0,
        });

        if (ocrResult.success) {
          ocrMetadata = ocrResult;
          extractedText = ocrResult.extractedText;

          // Auto-classify document type if not provided
          if (!documentType && ocrMetadata.documentType) {
            documentType = ocrMetadata.documentType;
            console.log(
              "🏷️ [documentController] Auto-classified document type:",
              documentType
            );
          }

          // Auto-extract tags from keywords
          if (!tags && ocrMetadata.suggestedTags) {
            tags = ocrMetadata.suggestedTags.slice(0, 5).join(",");
            console.log("🏷️ [documentController] Auto-extracted tags:", tags);
          }
        }
      } catch (ocrError) {
        console.warn(
          "❌ [documentController] OCR processing failed, continuing with basic upload:",
          ocrError.message
        );
      }

      // Generate ELRA-specific reference number
      const reference = await generateDocRef("ELRA", currentUser._id);

      console.log(
        `[documentController] Generated reference: ${reference} for ELRA`
      );

      const metadata = createDocumentMetadata(
        req.file,
        currentUser._id,
        category
      );

      // Create document with enhanced metadata
      const docData = {
        title,
        description,
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        documentType: documentType || "Other",
        category,
        priority: priority || "Medium",
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        uploadedBy: currentUser._id,
        reference: reference,
        // Smart status determination based on approval workflow
        status: await determineDocumentStatus(
          currentUser,
          category,
          department
        ),
        // Enhanced metadata from OCR
        ocrData: {
          extractedText,
          confidence: ocrMetadata?.confidence || 0,
          documentType: ocrMetadata?.documentType,
          keywords: ocrMetadata?.keywords || [],
          suggestedTitle: ocrMetadata?.suggestedTitle,
          suggestedDescription: ocrMetadata?.suggestedDescription,
          suggestedCategory: ocrMetadata?.suggestedCategory,
          suggestedConfidentiality: ocrMetadata?.suggestedConfidentiality,
          suggestedTags: ocrMetadata?.suggestedTags || [],
          processingDate: new Date(),
          language: "eng",
        },
        // Document classification based on OCR
        classification: {
          autoClassified: !!ocrMetadata?.documentType,
          confidence: ocrMetadata?.confidence || 0,
          suggestedCategory: ocrMetadata?.suggestedCategory,
          suggestedTags: ocrMetadata?.suggestedTags || [],
        },
      };
      // Auto-assign user's department if not provided
      if (department && department.trim() !== "") {
        docData.department = department;
      } else if (currentUser.department?.code) {
        docData.department = currentUser.department.code;
      }
      const document = new Document(docData);

      console.log("💾 [documentController] Saving document to database:", {
        title: document.title,
        reference: document.reference,
        category: document.category,
        documentType: document.documentType,
        priority: document.priority,
        status: document.status,
        fileSize: document.fileSize,
      });

      await document.save();

      console.log("✅ [documentController] Document saved successfully:", {
        documentId: document._id,
        reference: document.reference,
      });

      // Log document creation
      if (currentUser && currentUser._id) {
        console.log("📝 [documentController] Creating audit log entry");
        await AuditService.logDocumentAction(
          currentUser._id,
          "DOCUMENT_CREATED",
          document._id,
          {
            documentTitle: document.title,
            documentType: document.documentType,
            category: document.category,
            priority: document.priority,
            status: document.status,
            fileSize: document.fileSize,
            fileName: document.filename,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
          }
        );
        console.log("✅ [documentController] Audit log created successfully");
      } else {
        console.error("❌ [documentController] No valid userId for audit log");
      }

      try {
        console.log(
          "📧 [documentController] Sending notification to document creator"
        );
        await NotificationService.sendDocumentUploadSuccessNotification(
          document._id,
          currentUser._id,
          document.title,
          document.documentType,
          document.category
        );
        console.log(
          "✅ [documentController] Creator notification sent successfully"
        );

        // Send appropriate notification based on document status
        if (document.status === "APPROVED") {
          console.log(
            "📧 [documentController] Sending auto-approval notification"
          );
          await NotificationService.sendDocumentAutoApprovalNotification(
            document._id,
            currentUser._id,
            document.title,
            document.documentType,
            document.category
          );
          console.log(
            "✅ [documentController] Auto-approval notification sent successfully"
          );
        } else if (document.status === "PENDING_APPROVAL") {
          console.log(
            "📧 [documentController] Sending approval request notification"
          );
          await NotificationService.sendDocumentApprovalRequestNotification(
            document._id,
            currentUser._id,
            document.title,
            document.documentType,
            document.category
          );
          console.log(
            "✅ [documentController] Approval request notification sent successfully"
          );
        }

        // Send OCR processing notification if OCR was successful
        if (ocrMetadata && ocrMetadata.confidence) {
          console.log(
            "📧 [documentController] Sending OCR processing notification"
          );
          await NotificationService.sendDocumentOCRProcessingNotification(
            document._id,
            currentUser._id,
            document.title,
            ocrMetadata.confidence,
            ocrMetadata.suggestedTags || []
          );
          console.log(
            "✅ [documentController] OCR notification sent successfully"
          );
        }

        // Notify department members (if department is specified)
        if (document.department) {
          console.log(
            "📧 [documentController] Sending department notifications"
          );
          try {
            await NotificationService.sendDocumentUploadDepartmentNotification(
              document._id,
              document.department,
              document.title,
              document.documentType,
              document.category,
              currentUser.name || currentUser.username
            );
            console.log(
              "✅ [documentController] Department notifications sent successfully"
            );
          } catch (deptError) {
            console.warn(
              "⚠️ [documentController] Department notification failed:",
              deptError.message
            );
          }
        }

        // Notify admins and super admins (existing logic with updated service)
        let adminsToNotify = [];
        if (document.department) {
          adminsToNotify = await User.find({
            department: document.department,
            "role.level": { $gte: 80 },
            _id: { $ne: currentUser._id },
          });
        } else {
          adminsToNotify = await User.find({
            "role.level": { $gte: 80 },
            _id: { $ne: currentUser._id },
          });
        }

        if (adminsToNotify && adminsToNotify.length > 0) {
          console.log("📧 [documentController] Sending admin notifications");
          for (const admin of adminsToNotify) {
            const departmentInfo = document.department
              ? `in ${admin.department} department`
              : "across all departments";
            await NotificationService.createNotification({
              recipient: admin._id,
              type: "DOCUMENT_SUBMITTED",
              title: "New Document Uploaded",
              message: `${
                currentUser.name || currentUser.username
              } has uploaded "${document.title}" ${departmentInfo}.`,
              data: {
                documentId: document._id,
                actionUrl: `/documents/${document._id}`,
                priority: document.priority.toLowerCase(),
                senderId: currentUser._id,
                department: document.department || "General",
              },
            });
          }
          console.log(
            "✅ [documentController] Admin notifications sent successfully"
          );
        } else {
          console.warn(
            "[documentController] No admins to notify for this document upload."
          );
        }

        // If document is confidential, notify super admins
        if (document.isConfidential) {
          console.log(
            "📧 [documentController] Sending confidential document notifications"
          );
          const superAdmins = await User.find({
            "role.level": { $gte: 100 },
            _id: { $ne: currentUser._id },
          });

          for (const superAdmin of superAdmins) {
            await NotificationService.createNotification({
              recipient: superAdmin._id,
              type: "SYSTEM_ALERT",
              title: "Confidential Document Uploaded",
              message: `A confidential document "${
                document.title
              }" has been uploaded by ${
                currentUser.name || currentUser.username
              }.`,
              data: {
                documentId: document._id,
                actionUrl: `/documents/${document._id}`,
                priority: "high",
                senderId: currentUser._id,
              },
            });
          }
          console.log(
            "✅ [documentController] Confidential document notifications sent successfully"
          );
        }

        // Note: Creator notification is already sent above via NotificationService.sendDocumentUploadSuccessNotification
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError);
        // Don't fail the upload if notifications fail
      }

      // Populate user info
      await document.populate("uploadedBy", "name email");
      const normalizedFilePath = document.filePath.replace(/\\/g, "/");
      const fileUrl = `${
        process.env.BASE_URL || "http://localhost:5000"
      }/${normalizedFilePath}`;

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: {
          id: document._id,
          title: document.title,
          reference: document.reference,
          filename: document.filename,
          fileSize: formatFileSize(document.fileSize),
          status: document.status,
          uploadedBy: document.uploadedBy.name,
          uploadDate: document.createdAt,
          fileUrl,
        },
      });
    });
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload document",
    });
  }
};

// Get all documents (with role-based filtering)
export const getAllDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const { status, category, department, page = 1, limit = 10 } = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view documents",
      });
    }

    let query = { isActive: true };

    // Filter by department if user is not admin/manager
    if (currentUser.role.level < 80) {
      query.department = currentUser.department;
    }

    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (department && currentUser.role.level >= 80)
      query.department = department;

    const skip = (page - 1) * limit;

    const documents = await Document.find(query)
      .populate("uploadedBy", "firstName lastName email")
      .populate("currentApprover", "firstName lastName email")
      .populate("project", "name code category budget")
      .populate("department", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all documents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
};

// @desc    Get user's documents (my-documents endpoint)
// @route   GET /api/documents/my-documents
// @access  Private
export const getMyDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const {
      status,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    console.log(
      "📄 [getMyDocuments] Fetching documents for user:",
      currentUser._id
    );
    console.log("📄 [getMyDocuments] Filters:", {
      status,
      category,
      search,
      sortBy,
      sortOrder,
    });

    let query = {
      isActive: true,
      $or: [
        { createdBy: currentUser._id },
        { uploadedBy: currentUser._id },
        { isPublic: true },
      ],
    };

    if (currentUser.role.level >= 600) {
      const userProjects = await Project.find({
        $or: [
          { projectManager: currentUser._id },
          { "teamMembers.user": currentUser._id },
          { createdBy: currentUser._id },
        ],
      }).select("_id");

      if (userProjects.length > 0) {
        const projectIds = userProjects.map((p) => p._id);
        query.$or.push({ project: { $in: projectIds } });
        console.log(
          `📄 [getMyDocuments] Found ${userProjects.length} user projects:`,
          projectIds
        );
      }

      console.log(`📄 [getMyDocuments] User ID: ${currentUser._id}`);
    }

    // Apply filters
    if (status && status !== "all") {
      query.status = status;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    // Apply search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "metadata.generatedContent": { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;

    console.log(
      "📄 [getMyDocuments] Final query:",
      JSON.stringify(query, null, 2)
    );

    const documents = await Document.find(query)
      .populate("uploadedBy", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("project", "name code category budget status")
      .populate("department", "name")
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(query);

    console.log(
      `📄 [getMyDocuments] Found ${documents.length} documents out of ${total} total`
    );

    // Transform documents for frontend
    const transformedDocuments = documents.map((doc) => ({
      id: doc._id,
      title: doc.title,
      description: doc.description,
      fileName: doc.fileName,
      originalFileName: doc.originalFileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      documentType: doc.documentType,
      category: doc.category,
      status: doc.status,
      isRequired: doc.isRequired,
      isPublic: doc.isPublic,
      version: doc.version,
      project: doc.project
        ? {
            id: doc.project._id,
            name: doc.project.name,
            code: doc.project.code,
            category: doc.project.category,
            budget: doc.project.budget,
            status: doc.project.status,
          }
        : null,
      department: doc.department
        ? {
            id: doc.department._id,
            name: doc.department.name,
          }
        : null,
      uploadedBy: doc.uploadedBy
        ? {
            id: doc.uploadedBy._id,
            name: `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`,
            email: doc.uploadedBy.email,
          }
        : null,
      createdBy: doc.createdBy
        ? {
            id: doc.createdBy._id,
            name: `${doc.createdBy.firstName} ${doc.createdBy.lastName}`,
            email: doc.createdBy.email,
          }
        : null,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    res.json({
      success: true,
      data: transformedDocuments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ [getMyDocuments] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your documents",
      error: error.message,
    });
  }
};

// @desc    Get project documents
// @route   GET /api/documents/project/:projectId
// @access  Private (HOD+)
export const getProjectDocuments = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Get documents for the project
    const documents = await ProjectDocumentService.getProjectDocuments(
      projectId
    );

    res.status(200).json({
      success: true,
      data: {
        projectId: project._id,
        projectName: project.name,
        projectCode: project.code,
        documents: documents,
        totalDocuments: documents.length,
      },
    });
  } catch (error) {
    console.error("Error getting project documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get project documents",
      error: error.message,
    });
  }
};

// @desc    Get documents pending approval for current user
// @route   GET /api/documents/pending-approval
// @access  Private (HOD+)
export const getPendingApprovalDocuments = async (req, res) => {
  try {
    const currentUser = req.user;

    const documents = await ProjectDocumentService.getPendingApprovalDocuments(
      currentUser._id
    );

    res.status(200).json({
      success: true,
      data: {
        documents: documents,
        totalPending: documents.length,
      },
    });
  } catch (error) {
    console.error("Error getting pending approval documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending approval documents",
      error: error.message,
    });
  }
};

// @desc    Approve a document
// @route   POST /api/documents/:id/approve
// @access  Private (HOD+)
export const approveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const currentUser = req.user;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user is a reviewer for this document
    const isReviewer = document.reviewers.some(
      (reviewer) => reviewer.reviewer.toString() === currentUser._id.toString()
    );

    if (!isReviewer) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to approve this document",
      });
    }

    // Approve the document
    const updatedDocument = await ProjectDocumentService.approveDocument(
      id,
      currentUser._id,
      comments
    );

    // Audit logging
    try {
      await ProjectAuditService.logDocumentApproved(
        document,
        currentUser,
        comments
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging document approval:", error);
    }

    res.status(200).json({
      success: true,
      message: "Document approved successfully",
      data: updatedDocument,
    });
  } catch (error) {
    console.error("Error approving document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve document",
      error: error.message,
    });
  }
};

// @desc    Reject a document
// @route   POST /api/documents/:id/reject
// @access  Private (HOD+)
export const rejectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const currentUser = req.user;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user is a reviewer for this document
    const isReviewer = document.reviewers.some(
      (reviewer) => reviewer.reviewer.toString() === currentUser._id.toString()
    );

    if (!isReviewer) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this document",
      });
    }

    // Reject the document
    const updatedDocument = await ProjectDocumentService.rejectDocument(
      id,
      currentUser._id,
      comments
    );

    // Audit logging
    try {
      await ProjectAuditService.logDocumentRejected(
        document,
        currentUser,
        comments
      );
    } catch (error) {
      console.error("❌ [AUDIT] Error logging document rejection:", error);
    }

    res.status(200).json({
      success: true,
      message: "Document rejected successfully",
      data: updatedDocument,
    });
  } catch (error) {
    console.error("Error rejecting document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject document",
      error: error.message,
    });
  }
};

// @desc    Process document with OCR
// @route   POST /api/documents/:id/ocr
// @access  Private
export const processDocumentWithOCR = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    console.log("🔍 [OCR] Processing document with OCR:", id);

    // Find the document
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user has permission to process this document
    if (document.createdBy.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to process this document",
      });
    }

    // Process document with OCR
    const ocrResult = await OCRService.processDocument(document.fileUrl, {
      enableTextExtraction: true,
      enableCategorization: true,
      enableKeywordDetection: true,
      enableConfidenceScoring: true,
    });

    console.log("✅ [OCR] Document processed successfully:", {
      documentId: id,
      confidence: ocrResult.confidence,
      keywordsCount: ocrResult.keywords?.length || 0,
    });

    // Update document with OCR results
    document.ocrResults = ocrResult;
    document.lastProcessedAt = new Date();
    await document.save();

    res.status(200).json({
      success: true,
      message: "Document processed with OCR successfully",
      data: {
        documentId: document._id,
        ocrResults: ocrResult,
        suggestedTitle: ocrResult.suggestedTitle,
        suggestedDescription: ocrResult.suggestedDescription,
        suggestedCategory: ocrResult.suggestedCategory,
        suggestedConfidentiality: ocrResult.suggestedConfidentiality,
        suggestedTags: ocrResult.suggestedTags,
        confidence: ocrResult.confidence,
        extractedText: ocrResult.extractedText,
        keywords: ocrResult.keywords,
      },
    });
  } catch (error) {
    console.error("❌ [OCR] Error processing document with OCR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process document with OCR",
      error: error.message,
    });
  }
};

// @desc    Get document details with approval status
// @route   GET /api/documents/:id
// @access  Private (HOD+)
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const document = await Document.findById(id)
      .populate("project", "name code category budget")
      .populate("createdBy", "firstName lastName email")
      .populate(
        "reviewers.reviewer",
        "firstName lastName email role department"
      )
      .populate("approvedBy", "firstName lastName email")
      .populate("department", "name");

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user has access to this document
    const hasAccess =
      document.isPublic ||
      document.createdBy._id.toString() === currentUser._id.toString() ||
      document.reviewers.some(
        (reviewer) =>
          reviewer.reviewer._id.toString() === currentUser._id.toString()
      ) ||
      currentUser.role.level >= 1000; // SUPER_ADMIN

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this document",
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error getting document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get document",
      error: error.message,
    });
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private (HOD+)
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user can edit this document
    const canEdit =
      document.createdBy.toString() === currentUser._id.toString() ||
      currentUser.role.level >= 1000; // SUPER_ADMIN

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to edit this document",
      });
    }

    // Update document
    const updatedDocument = await Document.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedBy: currentUser._id,
      },
      { new: true, runValidators: true }
    )
      .populate("project", "name code category budget")
      .populate("createdBy", "firstName lastName email")
      .populate(
        "reviewers.reviewer",
        "firstName lastName email role department"
      )
      .populate("department", "name");

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      data: updatedDocument,
    });
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update document",
      error: error.message,
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (HOD+)
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user can delete this document
    const canDelete =
      document.createdBy.toString() === currentUser._id.toString() ||
      currentUser.role.level >= 1000; // SUPER_ADMIN

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this document",
      });
    }

    // Soft delete
    document.isActive = false;
    document.updatedBy = currentUser._id;
    await document.save();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete document",
      error: error.message,
    });
  }
};

// @desc    Get document statistics
// @route   GET /api/documents/stats
// @access  Private (HOD+)
export const getDocumentStats = async (req, res) => {
  try {
    const currentUser = req.user;

    // Get document statistics based on user role
    let query = { isActive: true };

    if (currentUser.role.level < 1000) {
      // Non-SUPER_ADMIN users see only their documents or documents they can review
      query.$or = [
        { createdBy: currentUser._id },
        { "reviewers.reviewer": currentUser._id },
        { isPublic: true },
      ];
    }

    const totalDocuments = await Document.countDocuments(query);
    const pendingReview = await Document.countDocuments({
      ...query,
      reviewStatus: "pending",
    });
    const approvedDocuments = await Document.countDocuments({
      ...query,
      reviewStatus: "approved",
    });
    const rejectedDocuments = await Document.countDocuments({
      ...query,
      reviewStatus: "rejected",
    });

    // Get documents by category
    const categoryStats = await Document.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDocuments,
        pendingReview,
        approvedDocuments,
        rejectedDocuments,
        categoryStats,
      },
    });
  } catch (error) {
    console.error("Error getting document stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get document statistics",
      error: error.message,
    });
  }
};

// Enhanced search documents with OCR capabilities
export const searchDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const searchParams = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to search documents",
      });
    }

    const result = await SearchService.advancedSearch(
      searchParams,
      currentUser
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Search documents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search documents",
    });
  }
};

// Full-text search within OCR extracted text
export const fullTextSearch = async (req, res) => {
  try {
    const currentUser = req.user;
    const { query, page = 1, limit = 20, minConfidence = 50 } = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to search documents",
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const result = await SearchService.fullTextSearch(query, currentUser, {
      page: parseInt(page),
      limit: parseInt(limit),
      minConfidence: parseInt(minConfidence),
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Full-text search error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform full-text search",
    });
  }
};

// Search by metadata (dates, organizations, monetary values)
export const metadataSearch = async (req, res) => {
  try {
    const currentUser = req.user;
    const searchParams = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to search documents",
      });
    }

    const result = await SearchService.metadataSearch(
      searchParams,
      currentUser
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Metadata search error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform metadata search",
    });
  }
};

// Find similar documents
export const findSimilarDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const { documentId } = req.params;
    const { limit = 10 } = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to search documents",
      });
    }

    const result = await SearchService.findSimilarDocuments(
      documentId,
      currentUser,
      {
        limit: parseInt(limit),
      }
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Similar documents search error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to find similar documents",
    });
  }
};

// Get search suggestions
export const getSearchSuggestions = async (req, res) => {
  try {
    const currentUser = req.user;
    const { query } = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to search documents",
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const result = await SearchService.getSearchSuggestions(query, currentUser);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Search suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get search suggestions",
    });
  }
};

// Process OCR for a document
export const processOCR = async (req, res) => {
  console.log("🔍 [documentController] Starting OCR processing");

  try {
    const currentUser = req.user;

    if (!hasPermission(currentUser, "document.upload")) {
      console.log(
        "❌ [documentController] Permission denied for OCR processing"
      );
      return res.status(403).json({
        success: false,
        message: "You do not have permission to process documents",
      });
    }

    // Use multer upload middleware for OCR
    upload.single("document")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded for OCR processing",
        });
      }

      console.log("📄 [documentController] File received for OCR:", {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });

      try {
        const ocrResult = await OCRService.processDocument(
          req.file.path,
          req.file.mimetype,
          { language: "eng" }
        );

        console.log("📊 [documentController] OCR result:", {
          success: ocrResult.success,
          confidence: ocrResult.metadata?.confidence,
          documentType: ocrResult.metadata?.documentType,
          keywordsCount: ocrResult.metadata?.keywords?.length || 0,
        });

        if (ocrResult.success) {
          res.json({
            success: true,
            data: {
              extractedText: ocrResult.extractedText,
              confidence: ocrResult.metadata?.confidence || 0,
              documentType: ocrResult.metadata?.documentType || "Other",
              suggestedCategory:
                ocrResult.metadata?.suggestedCategory || "General",
              keywords: ocrResult.metadata?.keywords || [],
              dateReferences: ocrResult.metadata?.dateReferences || [],
              organizationReferences:
                ocrResult.metadata?.organizationReferences || [],
              monetaryValues: ocrResult.metadata?.monetaryValues || [],
              processingTime: ocrResult.metadata?.processingTime || "Unknown",
            },
          });
        } else {
          res.status(400).json({
            success: false,
            message: "OCR processing failed",
            error: ocrResult.error,
          });
        }
      } catch (ocrError) {
        console.error(
          "❌ [documentController] OCR processing error:",
          ocrError
        );
        res.status(500).json({
          success: false,
          message: "OCR processing failed",
          error: ocrError.message,
        });
      }
    });
  } catch (error) {
    console.error("❌ [documentController] OCR controller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process OCR",
      error: error.message,
    });
  }
};

// Get document metadata (classifications, categories, etc.)
export const getDocumentMetadata = async (req, res) => {
  try {
    console.log("📋 [documentController] Getting document metadata");

    // Import the classifications here to avoid circular dependencies
    const {
      default: documentClassifications,
      categories,
      documentTypes,
      documentSections,
      priorityLevels,
      documentStatuses,
    } = await import("../constants/documentClassifications.js");

    // Get department options from the Document model
    const departmentOptions = [
      "Finance",
      "HR",
      "Legal",
      "IT",
      "Operations",
      "Marketing",
      "Sales",
      "Executive",
      "External",
    ];

    const metadata = {
      success: true,
      data: {
        classifications: documentClassifications,
        categories,
        documentTypes,
        documentSections,
        priorityLevels,
        documentStatuses,
        departmentOptions,
        supportedFileTypes: [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/tiff",
          "image/bmp",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
          "text/csv",
        ],
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFileSizeMB: 50,
      },
    };

    console.log(
      "✅ [documentController] Document metadata retrieved successfully"
    );
    res.json(metadata);
  } catch (error) {
    console.error(
      "❌ [documentController] Error getting document metadata:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to get document metadata",
      error: error.message,
    });
  }
};
