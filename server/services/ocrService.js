import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

class OCRService {
  constructor() {
    this.supportedFormats = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/tiff",
      "image/bmp",
      "application/pdf",
    ];
  }

  /**
   * Check if Tesseract OCR is installed
   */
  async checkTesseractInstallation() {
    try {
      await execAsync("tesseract --version");
      return true;
    } catch (error) {
      console.error("Tesseract OCR not found:", error.message);
      return false;
    }
  }

  /**
   * Extract text from image using Tesseract OCR
   */
  async extractTextFromImage(imagePath, options = {}) {
    try {
      const isInstalled = await this.checkTesseractInstallation();
      if (!isInstalled) {
        throw new Error("Tesseract OCR is not installed on the system");
      }

      const {
        language = "eng",
        config = "--psm 6", // Assume uniform block of text
        outputFormat = "txt",
      } = options;

      const outputPath = imagePath.replace(/\.[^/.]+$/, "");
      const command = `tesseract "${imagePath}" "${outputPath}" -l ${language} ${config}`;

      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes("Warning")) {
        throw new Error(`OCR processing error: ${stderr}`);
      }

      // Read the extracted text
      const textFilePath = `${outputPath}.${outputFormat}`;
      const extractedText = fs.readFileSync(textFilePath, "utf8");

      // Clean up temporary files
      try {
        fs.unlinkSync(textFilePath);
      } catch (cleanupError) {
        console.warn("Failed to cleanup OCR temp file:", cleanupError.message);
      }

      return {
        success: true,
        text: extractedText.trim(),
        confidence: this.calculateConfidence(extractedText),
        language: language,
      };
    } catch (error) {
      console.error("OCR extraction failed:", error);
      return {
        success: false,
        error: error.message,
        text: "",
      };
    }
  }

  /**
   * Process PDF documents for text extraction
   */
  async extractTextFromPDF(pdfPath, options = {}) {
    try {
      // For PDFs, we'll use a different approach
      // This is a simplified version - in production, you'd use pdf2image + tesseract
      const { stdout, stderr } = await execAsync(`pdftotext "${pdfPath}" -`);

      if (stderr) {
        throw new Error(`PDF text extraction error: ${stderr}`);
      }

      return {
        success: true,
        text: stdout.trim(),
        confidence: this.calculateConfidence(stdout),
        language: "eng",
      };
    } catch (error) {
      console.error("PDF text extraction failed:", error);
      return {
        success: false,
        error: error.message,
        text: "",
      };
    }
  }

  /**
   * Extract metadata from document content
   */
  extractMetadata(text, filename) {
    const metadata = {
      documentType: this.classifyDocumentType(text, filename),
      keywords: this.extractKeywords(text),
      dateReferences: this.extractDates(text),
      organizationReferences: this.extractOrganizations(text),
      monetaryValues: this.extractMonetaryValues(text),
      confidence: this.calculateConfidence(text),
    };

    return metadata;
  }

  /**
   * Classify document type based on content and filename
   */
  classifyDocumentType(text, filename) {
    const lowerText = text.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // Invoice detection
    if (
      lowerText.includes("invoice") ||
      lowerText.includes("bill") ||
      lowerFilename.includes("invoice") ||
      lowerFilename.includes("bill")
    ) {
      return "Invoice";
    }

    // Contract detection
    if (
      lowerText.includes("contract") ||
      lowerText.includes("agreement") ||
      lowerText.includes("terms and conditions") ||
      lowerFilename.includes("contract")
    ) {
      return "Contract";
    }

    // Receipt detection
    if (
      lowerText.includes("receipt") ||
      lowerText.includes("payment") ||
      lowerText.includes("total amount") ||
      lowerFilename.includes("receipt")
    ) {
      return "Receipt";
    }

    // Report detection
    if (
      lowerText.includes("report") ||
      lowerText.includes("summary") ||
      lowerText.includes("analysis") ||
      lowerFilename.includes("report")
    ) {
      return "Report";
    }

    // Certificate detection
    if (
      lowerText.includes("certificate") ||
      lowerText.includes("certified") ||
      lowerFilename.includes("certificate")
    ) {
      return "Certificate";
    }

    // Letter detection
    if (
      lowerText.includes("dear") ||
      lowerText.includes("sincerely") ||
      lowerText.includes("yours truly") ||
      lowerFilename.includes("letter")
    ) {
      return "Letter";
    }

    return "General Document";
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const wordCount = {};
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Extract date references from text
   */
  extractDates(text) {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // MM/DD/YYYY or DD/MM/YYYY
      /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g, // MM-DD-YYYY or DD-MM-YYYY
      /\b\d{4}-\d{1,2}-\d{1,2}\b/g, // YYYY-MM-DD
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi, // Month DD, YYYY
    ];

    const dates = [];
    datePatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    });

    return [...new Set(dates)]; // Remove duplicates
  }

  /**
   * Extract organization references
   */
  extractOrganizations(text) {
    // Simple pattern matching for organization names
    // In production, you'd use NLP libraries like spaCy
    const orgPatterns = [
      /\b[A-Z][a-z]+ (?:Corporation|Corp|Inc|LLC|Ltd|Company|Co)\b/g,
      /\b[A-Z][a-z]+ (?:Ministry|Department|Agency|Authority)\b/g,
    ];

    const organizations = [];
    orgPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        organizations.push(...matches);
      }
    });

    return [...new Set(organizations)];
  }

  /**
   * Extract monetary values
   */
  extractMonetaryValues(text) {
    const currencyPatterns = [
      /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g, // USD format
      /₦\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g, // NGN format
      /\d{1,3}(?:,\d{3})*(?:\.\d{2})? (?:dollars|naira|usd|ngn)/gi, // Text format
    ];

    const values = [];
    currencyPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        values.push(...matches);
      }
    });

    return [...new Set(values)];
  }

  /**
   * Calculate confidence score based on text quality
   */
  calculateConfidence(text) {
    if (!text || text.length === 0) return 0;

    let score = 100;

    // Penalize for short text
    if (text.length < 50) score -= 20;

    // Penalize for excessive special characters (OCR artifacts)
    const specialCharRatio =
      (text.match(/[^a-zA-Z0-9\s]/g) || []).length / text.length;
    if (specialCharRatio > 0.3) score -= 30;

    // Penalize for repeated characters (OCR artifacts)
    const repeatedChars = text.match(/(.)\1{3,}/g) || [];
    score -= repeatedChars.length * 5;

    // Bonus for proper sentence structure
    const sentences = text.match(/[.!?]+/g) || [];
    if (sentences.length > 0) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Process document for OCR and metadata extraction
   */
  async processDocument(filePath, mimeType, options = {}) {
    try {
      let ocrResult;

      if (mimeType === "application/pdf") {
        ocrResult = await this.extractTextFromPDF(filePath, options);
      } else if (this.supportedFormats.includes(mimeType)) {
        ocrResult = await this.extractTextFromImage(filePath, options);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      if (!ocrResult.success) {
        return {
          success: false,
          error: ocrResult.error,
          metadata: {},
        };
      }

      const filename = path.basename(filePath);
      const metadata = this.extractMetadata(ocrResult.text, filename);

      return {
        success: true,
        extractedText: ocrResult.text,
        metadata: {
          ...metadata,
          ocrConfidence: ocrResult.confidence,
          ocrLanguage: ocrResult.language,
        },
      };
    } catch (error) {
      console.error("Document processing failed:", error);
      return {
        success: false,
        error: error.message,
        metadata: {},
      };
    }
  }

  /**
   * Batch process multiple documents
   */
  async batchProcessDocuments(files, options = {}) {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.processDocument(
          file.path,
          file.mimetype,
          options
        );
        results.push({
          filename: file.originalname,
          ...result,
        });
      } catch (error) {
        results.push({
          filename: file.originalname,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}

export default new OCRService();
