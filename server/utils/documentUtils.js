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

// Generate document reference number
export const generateDocRef = (prefix = "DOC") => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
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
