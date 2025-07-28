import ScanningService from "../services/scanningService.js";
import { hasPermission } from "../utils/permissionUtils.js";
import AuditService from "../services/auditService.js";

// Detect available scanners
export const detectScanners = async (req, res) => {
  try {
    const currentUser = req.user;

    if (!hasPermission(currentUser, "document.scan")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to scan documents",
      });
    }

    const result = await ScanningService.detectScanners();

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        scanners: result.scanners,
        total: result.total,
        message:
          result.total > 0
            ? `${result.total} scanner(s) detected`
            : "No scanners detected. Please ensure scanner is connected and drivers are installed.",
      },
    });
  } catch (error) {
    console.error("Scanner detection error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to detect scanners",
    });
  }
};

// Scan single document
export const scanDocument = async (req, res) => {
  try {
    const currentUser = req.user;
    const { scannerId, options = {} } = req.body;

    // Check if user has permission to scan documents
    if (!hasPermission(currentUser, "document.scan")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to scan documents",
      });
    }

    if (!scannerId) {
      return res.status(400).json({
        success: false,
        message: "Scanner ID is required",
      });
    }

    const scanResult = await ScanningService.scanDocument(scannerId, options);

    if (!scanResult.success) {
      return res.status(400).json({
        success: false,
        message: scanResult.error,
      });
    }

    // Log scanning action
    await AuditService.logDocumentAction(
      currentUser._id,
      "DOCUMENT_SCANNED",
      null,
      {
        scannerId,
        filename: scanResult.filename,
        fileSize: scanResult.fileSize,
        resolution: scanResult.scanDetails.resolution,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.json({
      success: true,
      data: {
        scanResult,
        message: "Document scanned successfully",
      },
    });
  } catch (error) {
    console.error("Document scanning error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to scan document",
    });
  }
};

// Bulk scan documents
export const bulkScanDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const { scannerId, documentCount, options = {} } = req.body;

    // Check if user has permission to scan documents
    if (!hasPermission(currentUser, "document.scan")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to scan documents",
      });
    }

    if (!scannerId || !documentCount) {
      return res.status(400).json({
        success: false,
        message: "Scanner ID and document count are required",
      });
    }

    const scanResult = await ScanningService.bulkScanDocuments(
      scannerId,
      documentCount,
      options
    );

    if (!scanResult.success) {
      return res.status(400).json({
        success: false,
        message: scanResult.error,
      });
    }

    // Log bulk scanning action
    await AuditService.logDocumentAction(
      currentUser._id,
      "BULK_SCAN_COMPLETED",
      null,
      {
        scannerId,
        documentCount,
        totalScanned: scanResult.totalScanned,
        totalFailed: scanResult.totalFailed,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.json({
      success: true,
      data: {
        scanResult,
        message: `Bulk scanning completed. ${scanResult.totalScanned} documents scanned successfully.`,
      },
    });
  } catch (error) {
    console.error("Bulk scanning error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform bulk scanning",
    });
  }
};

// Process scanned document and create database entry
export const processScannedDocument = async (req, res) => {
  try {
    const currentUser = req.user;
    const { scanResult, metadata } = req.body;

    // Check if user has permission to upload documents
    if (!hasPermission(currentUser, "document.upload")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to upload documents",
      });
    }

    if (!scanResult || !scanResult.filePath) {
      return res.status(400).json({
        success: false,
        message: "Scan result with file path is required",
      });
    }

    const processResult = await ScanningService.processScannedDocument(
      scanResult,
      metadata,
      currentUser
    );

    if (!processResult.success) {
      return res.status(400).json({
        success: false,
        message: processResult.error,
      });
    }

    // Log document processing
    await AuditService.logDocumentAction(
      currentUser._id,
      "SCANNED_DOCUMENT_PROCESSED",
      processResult.document.id,
      {
        documentTitle: processResult.document.title,
        documentReference: processResult.document.reference,
        ocrConfidence: processResult.document.ocrConfidence,
        documentType: processResult.document.documentType,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.json({
      success: true,
      data: {
        document: processResult.document,
        message: "Scanned document processed and saved successfully",
      },
    });
  } catch (error) {
    console.error("Document processing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process scanned document",
    });
  }
};

// Bulk process scanned documents for archiving
export const bulkProcessScannedDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const { scanResults, metadataTemplate } = req.body;

    // Check if user has permission to upload documents
    if (!hasPermission(currentUser, "document.upload")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to upload documents",
      });
    }

    if (
      !scanResults ||
      !Array.isArray(scanResults) ||
      scanResults.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Scan results array is required",
      });
    }

    const processResult = await ScanningService.bulkProcessScannedDocuments(
      scanResults,
      metadataTemplate,
      currentUser
    );

    if (!processResult.success) {
      return res.status(400).json({
        success: false,
        message: processResult.error,
      });
    }

    // Log bulk processing
    await AuditService.logDocumentAction(
      currentUser._id,
      "BULK_ARCHIVE_PROCESSED",
      null,
      {
        totalProcessed: processResult.totalProcessed,
        totalFailed: processResult.totalFailed,
        metadataTemplate: metadataTemplate.category,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.json({
      success: true,
      data: {
        processResult,
        message: `Bulk processing completed. ${processResult.totalProcessed} documents processed successfully.`,
      },
    });
  } catch (error) {
    console.error("Bulk processing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process scanned documents",
    });
  }
};

// Create archive batch
export const createArchiveBatch = async (req, res) => {
  try {
    const currentUser = req.user;
    const { metadata } = req.body;

    // Check if user has permission to create archives
    if (!hasPermission(currentUser, "document.archive")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create archives",
      });
    }

    if (!metadata || !metadata.category) {
      return res.status(400).json({
        success: false,
        message: "Archive metadata with category is required",
      });
    }

    const batchResult = await ScanningService.createArchiveBatch(
      metadata,
      currentUser
    );

    if (!batchResult.success) {
      return res.status(400).json({
        success: false,
        message: batchResult.error,
      });
    }

    res.json({
      success: true,
      data: {
        archiveBatch: batchResult,
        message: `Archive batch created: ${batchResult.archiveReference}`,
      },
    });
  } catch (error) {
    console.error("Archive batch creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create archive batch",
    });
  }
};

// Get archive statistics
export const getArchiveStats = async (req, res) => {
  try {
    const currentUser = req.user;
    const { year } = req.query;

    // Check if user has permission to view archives
    if (!hasPermission(currentUser, "document.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view archives",
      });
    }

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    // Get archive statistics
    const stats = await Document.aggregate([
      {
        $match: {
          company: currentUser.company,
          "scanMetadata.archiveLocation": { $exists: true },
          createdAt: { $gte: yearStart, $lte: yearEnd },
        },
      },
      {
        $group: {
          _id: {
            category: "$category",
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          totalSize: { $sum: "$fileSize" },
          avgConfidence: { $avg: "$ocrData.confidence" },
        },
      },
      {
        $group: {
          _id: "$_id.category",
          monthlyStats: {
            $push: {
              month: "$_id.month",
              count: "$count",
              totalSize: "$totalSize",
              avgConfidence: "$avgConfidence",
            },
          },
          totalDocuments: { $sum: "$count" },
          totalSize: { $sum: "$totalSize" },
          avgConfidence: { $avg: "$avgConfidence" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        year: currentYear,
        stats,
        summary: {
          totalCategories: stats.length,
          totalDocuments: stats.reduce(
            (sum, cat) => sum + cat.totalDocuments,
            0
          ),
          totalSize: stats.reduce((sum, cat) => sum + cat.totalSize, 0),
          avgConfidence:
            stats.reduce((sum, cat) => sum + cat.avgConfidence, 0) /
            stats.length,
        },
      },
    });
  } catch (error) {
    console.error("Archive stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get archive statistics",
    });
  }
};
