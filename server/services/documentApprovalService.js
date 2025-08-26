import mongoose from "mongoose";
import crypto from "crypto";
import Project from "../models/Project.js";
import Document from "../models/Document.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import WorkflowTaskService from "./workflowTaskService.js";

class DocumentApprovalService {
  /**
   * Initialize document approval chain for a project
   */
  static async initializeDocumentApprovalChain(project) {
    try {
      console.log(
        "📋 [DOC APPROVAL] Initializing approval chain for project:",
        project._id
      );

      // Get the project's approval chain
      const approvalChain = project.approvalChain;
      if (!approvalChain || approvalChain.length === 0) {
        throw new Error("Project approval chain not found");
      }

      // Initialize approval history for each required document
      for (const doc of project.requiredDocuments) {
        if (doc.isRequired && doc.isSubmitted) {
          doc.approvalHistory = [];
          doc.currentApprovalLevel = "hod";
          doc.approvalStatus = "pending";

          // Create approval history entries based on project approval chain
          for (const approvalStep of approvalChain) {
            const approvalEntry = {
              level: approvalStep.level,
              department: approvalStep.department,
              status: "pending",
              documentVersion: 1,
              documentModified: false,
              documentHash: await this.generateDocumentHash(doc.documentId),
            };

            // Set approver if available
            if (approvalStep.approver) {
              approvalEntry.approver = approvalStep.approver;
            }

            doc.approvalHistory.push(approvalEntry);
          }

          // Initialize document versions
          doc.documentVersions = [
            {
              version: 1,
              documentId: doc.documentId,
              fileName: doc.fileName,
              fileUrl: doc.fileUrl,
              modifiedBy: doc.submittedBy,
              modifiedAt: doc.submittedAt,
              approvalLevel: "hod",
              contentHash: await this.generateDocumentHash(doc.documentId),
            },
          ];
        }
      }

      await project.save();
      console.log("✅ [DOC APPROVAL] Document approval chain initialized");

      return project;
    } catch (error) {
      console.error(
        "❌ [DOC APPROVAL] Error initializing approval chain:",
        error
      );
      throw error;
    }
  }

  /**
   * Approve document at current level
   */
  static async approveDocument(
    projectId,
    documentType,
    approverId,
    comments = ""
  ) {
    try {
      console.log(
        "✅ [DOC APPROVAL] Approving document:",
        documentType,
        "by:",
        approverId
      );

      const project = await Project.findById(projectId)
        .populate("requiredDocuments.documentId")
        .populate("requiredDocuments.approvalHistory.approver")
        .populate("requiredDocuments.approvalHistory.department");

      if (!project) {
        throw new Error("Project not found");
      }

      const document = project.requiredDocuments.find(
        (doc) => doc.documentType === documentType
      );
      if (!document) {
        throw new Error("Document not found");
      }

      const currentLevel = document.currentApprovalLevel;
      const approvalEntry = document.approvalHistory.find(
        (entry) => entry.level === currentLevel
      );

      if (!approvalEntry) {
        throw new Error("Approval entry not found for current level");
      }

      // Update approval status
      approvalEntry.status = "approved";
      approvalEntry.approver = approverId;
      approvalEntry.approvedAt = new Date();
      approvalEntry.comments = comments;

      // Move to next approval level
      const nextLevel = this.getNextApprovalLevel(
        currentLevel,
        project.approvalChain
      );
      if (nextLevel) {
        document.currentApprovalLevel = nextLevel;
        console.log(
          "📋 [DOC APPROVAL] Document moved to next level:",
          nextLevel
        );
      } else {
        // All approvals complete
        document.approvalStatus = "approved";
        console.log("🎉 [DOC APPROVAL] Document fully approved");
      }

      await project.save();
      return { success: true, nextLevel, isComplete: !nextLevel };
    } catch (error) {
      console.error("❌ [DOC APPROVAL] Error approving document:", error);
      throw error;
    }
  }

  /**
   * Reject document at current level
   */
  static async rejectDocument(
    projectId,
    documentType,
    approverId,
    comments = ""
  ) {
    try {
      console.log(
        "❌ [DOC APPROVAL] Rejecting document:",
        documentType,
        "by:",
        approverId
      );

      const project = await Project.findById(projectId);
      const document = project.requiredDocuments.find(
        (doc) => doc.documentType === documentType
      );

      if (!document) {
        throw new Error("Document not found");
      }

      const currentLevel = document.currentApprovalLevel;
      const approvalEntry = document.approvalHistory.find(
        (entry) => entry.level === currentLevel
      );

      if (!approvalEntry) {
        throw new Error("Approval entry not found for current level");
      }

      // Update approval status
      approvalEntry.status = "rejected";
      approvalEntry.approver = approverId;
      approvalEntry.approvedAt = new Date();
      approvalEntry.comments = comments;

      // Document is rejected
      document.approvalStatus = "rejected";

      await project.save();
      return { success: true, status: "rejected" };
    } catch (error) {
      console.error("❌ [DOC APPROVAL] Error rejecting document:", error);
      throw error;
    }
  }

  /**
   * Update document during approval process
   */
  static async updateDocumentDuringApproval(
    projectId,
    documentType,
    newDocumentId,
    updaterId,
    comments = ""
  ) {
    try {
      console.log(
        "📝 [DOC APPROVAL] Updating document:",
        documentType,
        "by:",
        updaterId
      );

      const project = await Project.findById(projectId);
      const document = project.requiredDocuments.find(
        (doc) => doc.documentType === documentType
      );

      if (!document) {
        throw new Error("Document not found");
      }

      const currentLevel = document.currentApprovalLevel;
      const approvalEntry = document.approvalHistory.find(
        (entry) => entry.level === currentLevel
      );

      if (!approvalEntry) {
        throw new Error("Approval entry not found for current level");
      }

      // Create new document version
      const newVersion = document.documentVersions.length + 1;
      const newDocumentVersion = {
        version: newVersion,
        documentId: newDocumentId,
        fileName: document.fileName, // Will be updated from new document
        fileUrl: document.fileUrl, // Will be updated from new document
        modifiedBy: updaterId,
        modifiedAt: new Date(),
        approvalLevel: currentLevel,
        comments: comments,
        contentHash: await this.generateDocumentHash(newDocumentId),
      };

      document.documentVersions.push(newDocumentVersion);

      // Update current document
      document.documentId = newDocumentId;
      document.documentModified = true;

      // Mark approval entry as modified
      approvalEntry.documentModified = true;
      approvalEntry.documentVersion = newVersion;
      approvalEntry.documentHash = newDocumentVersion.contentHash;

      // Reset approval status to pending for current level
      approvalEntry.status = "pending";
      approvalEntry.approver = null;
      approvalEntry.approvedAt = null;

      await project.save();
      return { success: true, newVersion };
    } catch (error) {
      console.error("❌ [DOC APPROVAL] Error updating document:", error);
      throw error;
    }
  }

  /**
   * Get next approval level
   */
  static getNextApprovalLevel(currentLevel, approvalChain) {
    const levels = approvalChain.map((step) => step.level);
    const currentIndex = levels.indexOf(currentLevel);

    if (currentIndex === -1 || currentIndex === levels.length - 1) {
      return null; // No next level
    }

    return levels[currentIndex + 1];
  }

  /**
   * Generate document content hash
   */
  static async generateDocumentHash(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        return null;
      }

      // Create hash from document content and metadata
      const content = `${document.fileName}${document.fileSize}${document.mimeType}${document.uploadedAt}`;
      return crypto.createHash("sha256").update(content).digest("hex");
    } catch (error) {
      console.error("❌ [DOC APPROVAL] Error generating document hash:", error);
      return null;
    }
  }

  /**
   * Get document approval status
   */
  static async getDocumentApprovalStatus(projectId, documentType) {
    try {
      const project = await Project.findById(projectId)
        .populate("requiredDocuments.approvalHistory.approver")
        .populate("requiredDocuments.approvalHistory.department");

      const document = project.requiredDocuments.find(
        (doc) => doc.documentType === documentType
      );
      if (!document) {
        throw new Error("Document not found");
      }

      return {
        documentType: document.documentType,
        currentLevel: document.currentApprovalLevel,
        approvalStatus: document.approvalStatus,
        approvalHistory: document.approvalHistory,
        documentVersions: document.documentVersions,
        isComplete:
          document.approvalStatus === "approved" ||
          document.approvalStatus === "rejected",
      };
    } catch (error) {
      console.error("❌ [DOC APPROVAL] Error getting approval status:", error);
      throw error;
    }
  }

  /**
   * Check if all documents are approved for project
   */
  static async checkAllDocumentsApproved(projectId) {
    try {
      const project = await Project.findById(projectId);

      const requiredDocuments = project.requiredDocuments.filter(
        (doc) => doc.isRequired
      );
      const approvedDocuments = requiredDocuments.filter(
        (doc) => doc.approvalStatus === "approved"
      );

      return {
        allApproved: requiredDocuments.length === approvedDocuments.length,
        totalRequired: requiredDocuments.length,
        totalApproved: approvedDocuments.length,
        pendingDocuments: requiredDocuments.filter(
          (doc) => doc.approvalStatus === "pending"
        ),
        rejectedDocuments: requiredDocuments.filter(
          (doc) => doc.approvalStatus === "rejected"
        ),
      };
    } catch (error) {
      console.error(
        "❌ [DOC APPROVAL] Error checking document approval:",
        error
      );
      throw error;
    }
  }

  /**
   * Trigger inventory creation after document approval
   */
  static async triggerInventoryCreation(projectId) {
    try {
      console.log(
        "📦 [DOC APPROVAL] Triggering inventory creation for project:",
        projectId
      );

      const approvalStatus = await this.checkAllDocumentsApproved(projectId);

      if (approvalStatus.allApproved) {
        const project = await Project.findById(projectId);

        // Update workflow triggers
        project.workflowTriggers.inventoryCreated = true;
        project.workflowPhase = "implementation";
        project.workflowStep = 2;

        // Add to workflow history
        project.workflowHistory.push({
          phase: "implementation",
          action: "inventory_creation_triggered",
          triggeredBy: "auto",
          metadata: {
            trigger: "all_documents_approved",
            approvalStatus: approvalStatus,
          },
          timestamp: new Date(),
        });

        await project.save();
        console.log("✅ [DOC APPROVAL] Inventory creation triggered");

        // Automatically create Operations tasks
        try {
          await WorkflowTaskService.createOperationsTasks(project._id);
          console.log("✅ [DOC APPROVAL] Operations tasks created successfully");
        } catch (taskError) {
          console.error("⚠️ [DOC APPROVAL] Error creating Operations tasks:", taskError);
        }

        // Here you would call the inventory creation service
        // await InventoryService.createInventoryForProject(projectId);

        return { success: true, message: "Inventory creation triggered" };
      } else {
        console.log("⏳ [DOC APPROVAL] Not all documents approved yet");
        return {
          success: false,
          message: "Not all documents approved",
          approvalStatus,
        };
      }
    } catch (error) {
      console.error(
        "❌ [DOC APPROVAL] Error triggering inventory creation:",
        error
      );
      throw error;
    }
  }
}

export default DocumentApprovalService;
