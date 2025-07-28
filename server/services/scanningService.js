import fs from "fs";
import path from "path";
import { promisify } from "util";
import { exec } from "child_process";
import OCRService from "./ocrService.js";
import Document from "../models/Document.js";
import { generateDocRef } from "../utils/documentUtils.js";

const execAsync = promisify(exec);

class ScanningService {
  constructor() {
    this.supportedScanners = [
      "twain",
      "wia", // Windows Image Acquisition
      "sane", // Linux scanner access
      "escl", // eSCL protocol
    ];
  }

  /**
   * Check for available scanners on the system
   */
  async detectScanners() {
    try {
      const scanners = [];

      // Check for TWAIN-compliant scanners
      try {
        const { stdout } = await execAsync("scanimage -L");
        const lines = stdout.split("\n").filter((line) => line.trim());

        lines.forEach((line) => {
          const match = line.match(/device `([^`]+)` is a (.+)/);
          if (match) {
            scanners.push({
              id: match[1],
              name: match[2],
              type: "sane",
              available: true,
            });
          }
        });
      } catch (error) {
        console.log("No SANE scanners detected");
      }

      // Check for WIA scanners (Windows)
      if (process.platform === "win32") {
        try {
          const { stdout } = await execAsync("wia-cmd-scanner list");
          const lines = stdout.split("\n").filter((line) => line.trim());

          lines.forEach((line) => {
            const match = line.match(/(.+)\s+\((.+)\)/);
            if (match) {
              scanners.push({
                id: match[2],
                name: match[1],
                type: "wia",
                available: true,
              });
            }
          });
        } catch (error) {
          console.log("No WIA scanners detected");
        }
      }

      return {
        success: true,
        scanners,
        total: scanners.length,
      };
    } catch (error) {
      console.error("Scanner detection failed:", error);
      return {
        success: false,
        error: error.message,
        scanners: [],
      };
    }
  }

  /**
   * Scan document using detected scanner
   */
  async scanDocument(scannerId, options = {}) {
    try {
      const {
        resolution = 300,
        format = "jpeg",
        quality = 90,
        pageSize = "A4",
        colorMode = "color",
      } = options;

      const timestamp = Date.now();
      const filename = `scan-${timestamp}.${format}`;
      const outputPath = path.join("uploads", "scans", filename);

      // Ensure scans directory exists
      const scansDir = path.join("uploads", "scans");
      if (!fs.existsSync(scansDir)) {
        fs.mkdirSync(scansDir, { recursive: true });
      }

      let command;

      // Use SANE for Linux/Mac
      if (process.platform !== "win32") {
        command = `scanimage -d "${scannerId}" --resolution ${resolution} --format=${format} --output-file="${outputPath}"`;
      } else {
        // Use WIA for Windows
        command = `wia-cmd-scanner scan "${scannerId}" --output "${outputPath}" --resolution ${resolution}`;
      }

      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes("Warning")) {
        throw new Error(`Scanning error: ${stderr}`);
      }

      // Get file stats
      const stats = fs.statSync(outputPath);

      return {
        success: true,
        filePath: outputPath,
        filename,
        fileSize: stats.size,
        mimeType: `image/${format}`,
        scanDetails: {
          scannerId,
          resolution,
          format,
          quality,
          pageSize,
          colorMode,
          timestamp,
        },
      };
    } catch (error) {
      console.error("Document scanning failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Bulk scan multiple documents
   */
  async bulkScanDocuments(scannerId, documentCount, options = {}) {
    try {
      const results = [];

      for (let i = 0; i < documentCount; i++) {
        console.log(`Scanning document ${i + 1}/${documentCount}...`);

        const scanResult = await this.scanDocument(scannerId, options);

        if (scanResult.success) {
          results.push({
            documentNumber: i + 1,
            ...scanResult,
          });
        } else {
          results.push({
            documentNumber: i + 1,
            success: false,
            error: scanResult.error,
          });
        }

        // Wait between scans to avoid overwhelming the scanner
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      return {
        success: true,
        results,
        totalScanned: results.filter((r) => r.success).length,
        totalFailed: results.filter((r) => !r.success).length,
      };
    } catch (error) {
      console.error("Bulk scanning failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process scanned document and create database entry
   */
  async processScannedDocument(scanResult, metadata, user) {
    try {
      // Process with OCR
      const ocrResult = await OCRService.processDocument(
        scanResult.filePath,
        scanResult.mimeType,
        { language: "eng" }
      );

      // Generate document reference
      const reference = generateDocRef();

      // Create document entry
      const documentData = {
        title:
          metadata.title ||
          `Scanned Document - ${new Date().toLocaleDateString()}`,
        description:
          metadata.description || "Document scanned from physical copy",
        filename: scanResult.filename,
        originalName: metadata.originalName || scanResult.filename,
        filePath: scanResult.filePath,
        fileSize: scanResult.fileSize,
        mimeType: scanResult.mimeType,
        documentType: ocrResult.success
          ? ocrResult.metadata.documentType
          : "Scanned Document",
        category: metadata.category || "General",
        priority: metadata.priority || "Medium",
        status: "DRAFT",
        reference,
        uploadedBy: user._id,
        department: metadata.department || user.department,
        tags: metadata.tags || ["scanned", "archived"],
        isConfidential: metadata.isConfidential || false,
        // OCR data
        ocrData: ocrResult.success
          ? {
              extractedText: ocrResult.extractedText,
              confidence: ocrResult.metadata.confidence,
              documentType: ocrResult.metadata.documentType,
              keywords: ocrResult.metadata.keywords,
              dateReferences: ocrResult.metadata.dateReferences,
              organizationReferences: ocrResult.metadata.organizationReferences,
              monetaryValues: ocrResult.metadata.monetaryValues,
              ocrLanguage: "eng",
            }
          : {
              extractedText: "",
              confidence: 0,
              documentType: "Scanned Document",
              keywords: [],
              dateReferences: [],
              organizationReferences: [],
              monetaryValues: [],
              ocrLanguage: "eng",
            },
        // Scan metadata
        scanMetadata: {
          scannerId: scanResult.scanDetails.scannerId,
          resolution: scanResult.scanDetails.resolution,
          format: scanResult.scanDetails.format,
          scanDate: new Date(scanResult.scanDetails.timestamp),
          originalDocumentDate: metadata.originalDate,
          archiveLocation: metadata.archiveLocation,
          boxNumber: metadata.boxNumber,
          folderNumber: metadata.folderNumber,
        },
      };

      const document = new Document(documentData);
      await document.save();

      return {
        success: true,
        document: {
          id: document._id,
          title: document.title,
          reference: document.reference,
          filename: document.filename,
          ocrConfidence: document.ocrData.confidence,
          documentType: document.ocrData.documentType,
        },
      };
    } catch (error) {
      console.error("Document processing failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Bulk process scanned documents for archiving
   */
  async bulkProcessScannedDocuments(scanResults, metadataTemplate, user) {
    try {
      const results = [];

      for (let i = 0; i < scanResults.length; i++) {
        const scanResult = scanResults[i];

        if (!scanResult.success) {
          results.push({
            documentNumber: scanResult.documentNumber,
            success: false,
            error: scanResult.error,
          });
          continue;
        }

        // Apply metadata template with document-specific overrides
        const metadata = {
          ...metadataTemplate,
          title: `${metadataTemplate.title} - Document ${scanResult.documentNumber}`,
          originalName: `Archive_Doc_${scanResult.documentNumber}.${scanResult.scanDetails.format}`,
          boxNumber: metadataTemplate.boxNumber,
          folderNumber: metadataTemplate.folderNumber,
          archiveLocation: metadataTemplate.archiveLocation,
        };

        const processResult = await this.processScannedDocument(
          scanResult,
          metadata,
          user
        );

        results.push({
          documentNumber: scanResult.documentNumber,
          ...processResult,
        });
      }

      return {
        success: true,
        results,
        totalProcessed: results.filter((r) => r.success).length,
        totalFailed: results.filter((r) => !r.success).length,
      };
    } catch (error) {
      console.error("Bulk processing failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate archive reference numbers
   */
  generateArchiveReference(category, year, sequence) {
    const yearCode = year.toString().slice(-2);
    const categoryCode = category.substring(0, 3).toUpperCase();
    const sequenceCode = sequence.toString().padStart(4, "0");

    return `ARCH-${categoryCode}-${yearCode}-${sequenceCode}`;
  }

  /**
   * Get next sequence number for archive category
   */
  async getNextArchiveSequence(category, year) {
    try {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);

      const lastDocument = await Document.findOne({
        category,
        createdAt: { $gte: yearStart, $lte: yearEnd },
        "scanMetadata.archiveLocation": { $exists: true },
      }).sort({
        "scanMetadata.boxNumber": -1,
        "scanMetadata.folderNumber": -1,
      });

      if (!lastDocument) {
        return 1;
      }

      return (lastDocument.scanMetadata?.folderNumber || 0) + 1;
    } catch (error) {
      console.error("Error getting archive sequence:", error);
      return 1;
    }
  }

  /**
   * Create archive batch
   */
  async createArchiveBatch(metadata, user) {
    try {
      const currentYear = new Date().getFullYear();
      const sequence = await this.getNextArchiveSequence(
        metadata.category,
        currentYear
      );

      const archiveReference = this.generateArchiveReference(
        metadata.category,
        currentYear,
        sequence
      );

      return {
        success: true,
        archiveReference,
        sequence,
        year: currentYear,
        metadata: {
          ...metadata,
          archiveReference,
          sequence,
          year: currentYear,
        },
      };
    } catch (error) {
      console.error("Archive batch creation failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new ScanningService();
