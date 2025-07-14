import Document from '../models/Document.js';
import User from '../models/User.js';
import { upload, formatFileSize, getFileExtension } from '../utils/fileUtils.js';
import { createDocumentMetadata, getDocumentType } from '../utils/documentUtils.js';
import { hasPermission } from '../utils/permissionUtils.js';

// Upload document
export const uploadDocument = async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Check if user has permission to upload documents
    if (!hasPermission(currentUser, 'document.upload')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to upload documents'
      });
    }

    // Use multer upload middleware
    upload.single('document')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { title, description, category, documentType, priority, tags } = req.body;

      // Create document metadata
      const metadata = createDocumentMetadata(req.file, currentUser.userId, category);

      // Create document
      const document = new Document({
        title,
        description,
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        documentType: documentType || 'Other',
        category,
        priority: priority || 'Medium',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        uploadedBy: currentUser.userId,
        department: currentUser.department,
        status: 'DRAFT'
      });

      // Add audit entry
      document.addAuditEntry('UPLOADED', currentUser.userId, 'Document uploaded', req.ip);

      await document.save();

      // Populate user info
      await document.populate('uploadedBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          id: document._id,
          title: document.title,
          reference: document.reference,
          filename: document.filename,
          fileSize: formatFileSize(document.fileSize),
          status: document.status,
          uploadedBy: document.uploadedBy.name,
          uploadDate: document.createdAt
        }
      });
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
};

// Get all documents (with role-based filtering)
export const getAllDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const { status, category, department, page = 1, limit = 10 } = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, 'document.view')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view documents'
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
    if (department && currentUser.role.level >= 80) query.department = department;

    const skip = (page - 1) * limit;

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email')
      .populate('currentApprover', 'name email')
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
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
};

// Get document by ID
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const document = await Document.findById(id)
      .populate('uploadedBy', 'name email department')
      .populate('currentApprover', 'name email')
      .populate('approvalChain.approver', 'name email role');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can access this document
    if (!document.canAccess(currentUser)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this document'
      });
    }

    // Add view audit entry
    document.addAuditEntry('VIEWED', currentUser.userId, 'Document viewed', req.ip);
    await document.save();

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document'
    });
  }
};

// Submit document for approval
export const submitForApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { approvers } = req.body; // Array of user IDs for approval chain

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user owns the document
    if (!document.uploadedBy.equals(currentUser.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit your own documents for approval'
      });
    }

    // Validate approvers
    if (!approvers || approvers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one approver is required'
      });
    }

    // Build approval chain
    const approvalChain = [];
    for (let i = 0; i < approvers.length; i++) {
      const approver = await User.findById(approvers[i]);
      if (!approver) {
        return res.status(400).json({
          success: false,
          message: `Approver ${approvers[i]} not found`
        });
      }

      approvalChain.push({
        level: i + 1,
        approver: approver._id,
        status: 'PENDING',
        deadline: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000) // 24 hours per level
      });
    }

    document.approvalChain = approvalChain;
    document.currentApprover = approvers[0];
    document.status = 'SUBMITTED';

    // Add audit entry
    document.addAuditEntry('SUBMITTED', currentUser.userId, 'Document submitted for approval', req.ip);

    await document.save();

    await document.populate('currentApprover', 'name email');

    res.json({
      success: true,
      message: 'Document submitted for approval',
      data: {
        id: document._id,
        status: document.status,
        currentApprover: document.currentApprover.name,
        approvalChain: document.approvalChain.length
      }
    });
  } catch (error) {
    console.error('Submit for approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit document for approval'
    });
  }
};

// Approve document
export const approveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { comments } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is the current approver
    if (!document.currentApprover.equals(currentUser.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not the current approver for this document'
      });
    }

    // Check if user has permission to approve
    if (!hasPermission(currentUser, 'document.approve')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to approve documents'
      });
    }

    // Approve the document
    document.approve(currentUser.userId, comments);

    // Check if there are more approvals needed
    const nextApprover = document.getNextApprover();
    if (nextApprover) {
      document.currentApprover = nextApprover;
      document.status = 'UNDER_REVIEW';
    } else {
      document.status = 'APPROVED';
      document.currentApprover = null;
    }

    await document.save();

    await document.populate('currentApprover', 'name email');

    res.json({
      success: true,
      message: 'Document approved successfully',
      data: {
        id: document._id,
        status: document.status,
        currentApprover: document.currentApprover ? document.currentApprover.name : null
      }
    });
  } catch (error) {
    console.error('Approve document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve document'
    });
  }
};

// Reject document
export const rejectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { comments } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is the current approver
    if (!document.currentApprover.equals(currentUser.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not the current approver for this document'
      });
    }

    // Check if user has permission to reject
    if (!hasPermission(currentUser, 'document.reject')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reject documents'
      });
    }

    // Reject the document
    document.reject(currentUser.userId, comments);

    await document.save();

    res.json({
      success: true,
      message: 'Document rejected successfully',
      data: {
        id: document._id,
        status: document.status
      }
    });
  } catch (error) {
    console.error('Reject document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject document'
    });
  }
};

// Get documents pending approval
export const getPendingApprovals = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user has permission to approve documents
    if (!hasPermission(currentUser, 'document.approve')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to approve documents'
      });
    }

    const documents = await Document.find({
      currentApprover: currentUser.userId,
      status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] },
      isActive: true
    })
    .populate('uploadedBy', 'name email department')
    .populate('approvalChain.approver', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals'
    });
  }
};

// Delete document (soft delete)
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can delete this document
    if (!document.uploadedBy.equals(currentUser.userId) && 
        !hasPermission(currentUser, 'document.delete')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this document'
      });
    }

    // Soft delete
    document.isActive = false;
    document.addAuditEntry('DELETED', currentUser.userId, 'Document deleted', req.ip);
    await document.save();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
};

// Search documents
export const searchDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const { q, category, status, dateFrom, dateTo } = req.query;

    // Check if user has permission to view documents
    if (!hasPermission(currentUser, 'document.view')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to search documents'
      });
    }

    let query = { isActive: true };

    // Text search
    if (q) {
      query.$text = { $search: q };
    }

    // Filters
    if (category) query.category = category;
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Department filter for non-admin users
    if (currentUser.role.level < 80) {
      query.department = currentUser.department;
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email')
      .populate('currentApprover', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    console.error('Search documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search documents'
    });
  }
}; 