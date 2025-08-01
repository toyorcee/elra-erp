import path from "path";
import fs from "fs";

// Get document type from file extension
export const getDocumentType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    ".pdf": "PDF",
    ".doc": "Word Document",
    ".docx": "Word Document",
    ".xls": "Excel Spreadsheet",
    ".xlsx": "Excel Spreadsheet",
    ".jpg": "Image",
    ".jpeg": "Image",
    ".png": "Image",
    ".txt": "Text File",
  };
  return types[ext] || "Unknown";
};

export const generateDocRef = async (companyCode = "COMP", userId = null) => {
  try {
    // Get the current year
    const currentYear = new Date().getFullYear();

    // Find the last document for this company in the current year
    const Document = (await import("../models/Document.js")).default;
    const lastDoc = await Document.findOne({
      reference: { $regex: `^${companyCode}-${currentYear}-` },
    })
      .sort({ reference: -1 })
      .limit(1);

    let sequenceNumber = 1;

    if (lastDoc && lastDoc.reference) {
      // Extract sequence number from last document
      const match = lastDoc.reference.match(
        new RegExp(`${companyCode}-${currentYear}-(\\d+)`)
      );
      if (match) {
        sequenceNumber = parseInt(match[1]) + 1;
      }
    }

    // Format: COMP001-2025-0001
    const formattedSequence = sequenceNumber.toString().padStart(4, "0");
    return `${companyCode}001-${currentYear}-${formattedSequence}`;
  } catch (error) {
    console.error("Error generating document reference:", error);
    // Fallback to timestamp-based reference
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${companyCode}001-${new Date().getFullYear()}-${timestamp}-${random}`;
  }
};

// Check if document is image
export const isImage = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".gif", ".bmp"].includes(ext);
};

// Check if document is PDF
export const isPDF = (filename) => {
  return path.extname(filename).toLowerCase() === ".pdf";
};

// Get file info
export const getFileInfo = (filepath) => {
  try {
    const stats = fs.statSync(filepath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {
    return null;
  }
};

// Create document metadata
export const createDocumentMetadata = (file, userId, category = "General") => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    uploadedBy: userId,
    category: category,
    uploadDate: new Date(),
    documentType: getDocumentType(file.originalname),
    reference: generateDocRef(),
  };
};
