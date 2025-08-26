import DocumentApprovalService from "../services/documentApprovalService.js";
import Project from "../models/Project.js";
import { checkRole } from "../middleware/auth.js";

// @desc    Initialize document approval chain for a project
// @route   POST /api/document-approval/:projectId/initialize
// @access  Private (HOD+)
export const initializeDocumentApproval = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    // Check if user has permission
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Only HOD and above can initialize document approval",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if project belongs to user's department or user is super admin
    if (
      currentUser.role.level < 1000 &&
      project.department.toString() !== currentUser.department.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only initialize approval for projects in your department",
      });
    }

    const result =
      await DocumentApprovalService.initializeDocumentApprovalChain(project);

    res.status(200).json({
      success: true,
      message: "Document approval chain initialized successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error initializing document approval:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize document approval",
      error: error.message,
    });
  }
};

// @desc    Approve document at current level
// @route   POST /api/document-approval/:projectId/approve/:documentType
// @access  Private (Approvers)
export const approveDocument = async (req, res) => {
  try {
    const { projectId, documentType } = req.params;
    const { comments } = req.body;
    const currentUser = req.user;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user can approve at current level
    const document = project.requiredDocuments.find(
      (doc) => doc.documentType === documentType
    );
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const currentLevel = document.currentApprovalLevel;
    const approvalEntry = document.approvalHistory.find(
      (entry) => entry.level === currentLevel
    );

    if (!approvalEntry) {
      return res.status(400).json({
        success: false,
        message: "No approval entry found for current level",
      });
    }

    // Check permissions based on approval level
    if (currentLevel === "hod" && currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Only HOD can approve at this level",
      });
    }

    if (
      currentLevel === "finance" &&
      currentUser.department?.name !== "Finance & Accounting"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Finance department can approve at finance level",
      });
    }

    if (
      currentLevel === "executive" &&
      currentUser.department?.name !== "Executive Office"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Executive department can approve at executive level",
      });
    }

    const result = await DocumentApprovalService.approveDocument(
      projectId,
      documentType,
      currentUser._id,
      comments
    );

    // Check if all documents are approved and trigger inventory creation
    if (result.isComplete) {
      await DocumentApprovalService.triggerInventoryCreation(projectId);
    }

    res.status(200).json({
      success: true,
      message: "Document approved successfully",
      data: result,
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

// @desc    Reject document at current level
// @route   POST /api/document-approval/:projectId/reject/:documentType
// @access  Private (Approvers)
export const rejectDocument = async (req, res) => {
  try {
    const { projectId, documentType } = req.params;
    const { comments } = req.body;
    const currentUser = req.user;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user can reject at current level (same permissions as approve)
    const document = project.requiredDocuments.find(
      (doc) => doc.documentType === documentType
    );
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const currentLevel = document.currentApprovalLevel;

    // Check permissions based on approval level
    if (currentLevel === "hod" && currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Only HOD can reject at this level",
      });
    }

    if (
      currentLevel === "finance" &&
      currentUser.department?.name !== "Finance & Accounting"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Finance department can reject at finance level",
      });
    }

    if (
      currentLevel === "executive" &&
      currentUser.department?.name !== "Executive Office"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Executive department can reject at executive level",
      });
    }

    const result = await DocumentApprovalService.rejectDocument(
      projectId,
      documentType,
      currentUser._id,
      comments
    );

    res.status(200).json({
      success: true,
      message: "Document rejected successfully",
      data: result,
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

// @desc    Update document during approval process
// @route   POST /api/document-approval/:projectId/update/:documentType
// @access  Private (Project Manager+)
export const updateDocumentDuringApproval = async (req, res) => {
  try {
    const { projectId, documentType } = req.params;
    const { newDocumentId, comments } = req.body;
    const currentUser = req.user;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user can update documents (Project Manager or HOD)
    if (currentUser.role.level < 600) {
      return res.status(403).json({
        success: false,
        message: "Only Project Manager and above can update documents",
      });
    }

    // Check if user is project manager or HOD of project department
    const isProjectManager =
      project.projectManager?.toString() === currentUser._id.toString();
    const isHOD =
      currentUser.role.level >= 700 &&
      project.department.toString() === currentUser.department.toString();

    if (!isProjectManager && !isHOD) {
      return res.status(403).json({
        success: false,
        message:
          "You can only update documents for projects you manage or in your department",
      });
    }

    const result = await DocumentApprovalService.updateDocumentDuringApproval(
      projectId,
      documentType,
      newDocumentId,
      currentUser._id,
      comments
    );

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      data: result,
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

// @desc    Get document approval status
// @route   GET /api/document-approval/:projectId/status/:documentType
// @access  Private (Project Team)
export const getDocumentApprovalStatus = async (req, res) => {
  try {
    const { projectId, documentType } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user has access to project
    const hasAccess =
      project.createdBy.toString() === currentUser._id.toString() ||
      project.projectManager?.toString() === currentUser._id.toString() ||
      project.teamMembers.some(
        (member) => member.user.toString() === currentUser._id.toString()
      ) ||
      currentUser.role.level >= 700;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this project",
      });
    }

    const result = await DocumentApprovalService.getDocumentApprovalStatus(
      projectId,
      documentType
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting document approval status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get document approval status",
      error: error.message,
    });
  }
};

// @desc    Get all documents approval status for a project
// @route   GET /api/document-approval/:projectId/status
// @access  Private (Project Team)
export const getAllDocumentsApprovalStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(projectId)
      .populate("requiredDocuments.approvalHistory.approver")
      .populate("requiredDocuments.approvalHistory.department");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user has access to project
    const hasAccess =
      project.createdBy.toString() === currentUser._id.toString() ||
      project.projectManager?.toString() === currentUser._id.toString() ||
      project.teamMembers.some(
        (member) => member.user.toString() === currentUser._id.toString()
      ) ||
      currentUser.role.level >= 700;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this project",
      });
    }

    const approvalStatus =
      await DocumentApprovalService.checkAllDocumentsApproved(projectId);

    res.status(200).json({
      success: true,
      data: {
        projectId,
        approvalStatus,
        documents: project.requiredDocuments.map((doc) => ({
          documentType: doc.documentType,
          currentLevel: doc.currentApprovalLevel,
          approvalStatus: doc.approvalStatus,
          approvalHistory: doc.approvalHistory,
          documentVersions: doc.documentVersions,
          isComplete:
            doc.approvalStatus === "approved" ||
            doc.approvalStatus === "rejected",
        })),
      },
    });
  } catch (error) {
    console.error("Error getting all documents approval status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get documents approval status",
      error: error.message,
    });
  }
};

// @desc    Trigger inventory creation manually
// @route   POST /api/document-approval/:projectId/trigger-inventory
// @access  Private (HOD+)
export const triggerInventoryCreation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    // Check if user has permission
    if (currentUser.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Only HOD and above can trigger inventory creation",
      });
    }

    const result = await DocumentApprovalService.triggerInventoryCreation(
      projectId
    );

    res.status(200).json({
      success: true,
      message: result.success
        ? "Inventory creation triggered successfully"
        : "Not all documents approved yet",
      data: result,
    });
  } catch (error) {
    console.error("Error triggering inventory creation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger inventory creation",
      error: error.message,
    });
  }
};
