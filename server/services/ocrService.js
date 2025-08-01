import fs from "fs";
import path from "path";
import Tesseract from "tesseract.js";

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
   * Check if Tesseract.js is available
   */
  async checkTesseractInstallation() {
    try {
      return typeof Tesseract !== "undefined";
    } catch (error) {
      console.error("Tesseract.js not available:", error.message);
      return false;
    }
  }

  /**
   * Extract text from image using Tesseract.js
   */
  async extractTextFromImage(imagePath, options = {}) {
    try {
      const isInstalled = await this.checkTesseractInstallation();
      if (!isInstalled) {
        throw new Error("Tesseract.js is not available");
      }

      const { language = "eng", logger = (m) => console.log(m) } = options;

      console.log("🔍 [OCRService] Starting Tesseract.js OCR processing...");

      const result = await Tesseract.recognize(imagePath, language, {
        logger: logger,
        errorHandler: (err) => console.error("OCR Error:", err),
      });

      console.log("✅ [OCRService] OCR processing completed successfully");

      return {
        success: true,
        text: result.data.text.trim(),
        confidence: result.data.confidence / 100,
        language: language,
      };
    } catch (error) {
      console.error("❌ [OCRService] OCR extraction failed:", error);
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
      console.log("📄 [OCRService] PDF processing not implemented yet");
      return {
        success: false,
        error: "PDF OCR processing not implemented yet",
        text: "",
      };
    } catch (error) {
      console.error("❌ [OCRService] PDF text extraction failed:", error);
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
    const classification = this.classifyDocumentType(text, filename);
    const metadata = {
      documentType: classification.type,
      confidence: classification.confidence,
      keywords: this.extractKeywords(text),
      dateReferences: this.extractDates(text),
      organizationReferences: this.extractOrganizations(text),
      monetaryValues: this.extractMonetaryValues(text),
      suggestedCategory: this.suggestCategory(classification.type),
      suggestedTags: this.extractKeywords(text).slice(0, 5),
    };

    return metadata;
  }

  /**
   * Suggest category based on document type
   */
  suggestCategory(documentType) {
    const categoryMap = {
      // Invoice types
      Invoice: "Invoice",
      "Sales Invoice": "Invoice",
      "Purchase Invoice": "Invoice",
      "Service Invoice": "Invoice",
      "Tax Invoice": "Invoice",
      "Credit Note": "Invoice",
      "Debit Note": "Invoice",

      // Financial types
      Receipt: "Financial",
      Budget: "Financial",
      "Financial Document": "Financial",
      "Bank Statement": "Financial",
      "Tax Return": "Financial",
      "Budget Document": "Financial",
      "Expense Report": "Financial",
      "Payment Voucher": "Financial",
      "Financial Statement": "Financial",

      // Contract types
      Contract: "Contract",
      Agreement: "Contract",
      "Employment Contract": "Contract",
      "Vendor Contract": "Contract",
      "Client Contract": "Contract",
      "Service Agreement": "Contract",
      "Lease Agreement": "Contract",
      "Partnership Agreement": "Contract",
      NDA: "Contract",

      // Report types
      Report: "Report",
      "Financial Report": "Report",
      "Annual Report": "Report",
      "Incident Report": "Report",
      "Monthly Report": "Report",
      "Quarterly Report": "Report",
      "Performance Report": "Report",
      "Audit Report": "Report",
      "Research Report": "Report",

      // Policy types
      Policy: "Policy",
      "HR Policy": "Policy",
      "IT Policy": "Policy",
      "Finance Policy": "Policy",
      "Security Policy": "Policy",
      "Environmental Policy": "Policy",
      "Quality Policy": "Policy",

      // Legal types
      "Legal Document": "Legal",
      License: "Legal",
      Permit: "Legal",
      Certificate: "Legal",
      "Court Filing": "Legal",
      "Legal Opinion": "Legal",
      "Compliance Document": "Legal",
      "Regulatory Filing": "Legal",

      // HR types
      "HR Document": "HR",
      Application: "HR",
      "Employee Record": "HR",
      "Performance Review": "HR",
      "Training Certificate": "HR",
      "Job Description": "HR",
      Resume: "HR",
      "Application Form": "HR",

      // Operations types
      "Operations Document": "Operations",
      Manual: "Operations",
      "SOP Document": "Operations",
      "Process Manual": "Operations",
      "Work Instruction": "Operations",
      "Quality Control": "Operations",
      "Maintenance Record": "Operations",
      "Inventory Report": "Operations",

      // Marketing types
      "Marketing Document": "Marketing",
      "Marketing Plan": "Marketing",
      "Campaign Brief": "Marketing",
      "Brand Guidelines": "Marketing",
      "Press Release": "Marketing",
      Advertisement: "Marketing",
      "Market Research": "Marketing",

      // Technical types
      "Technical Specification": "Technical",
      "Design Document": "Technical",
      "User Manual": "Technical",
      "API Documentation": "Technical",
      "System Architecture": "Technical",
      "Code Documentation": "Technical",

      // General types
      Form: "General",
      Letter: "General",
      Memo: "General",
      Proposal: "General",
      Other: "General",
      Miscellaneous: "General",
      Notes: "General",
      Drafts: "General",
    };

    return categoryMap[documentType] || "General";
  }

  /**
   * Classify document type based on content and filename
   */
  classifyDocumentType(text, filename) {
    const lowerText = text.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    const classifications = [
      {
        type: "Sales Invoice",
        patterns: [
          "sales invoice",
          "invoice",
          "bill",
          "payment due",
          "amount due",
        ],
        confidence: 0.9,
      },
      {
        type: "Purchase Invoice",
        patterns: ["purchase invoice", "vendor invoice", "supplier invoice"],
        confidence: 0.9,
      },
      {
        type: "Service Invoice",
        patterns: ["service invoice", "service bill"],
        confidence: 0.9,
      },
      {
        type: "Tax Invoice",
        patterns: ["tax invoice", "vat invoice", "gst invoice"],
        confidence: 0.9,
      },
      {
        type: "Credit Note",
        patterns: ["credit note", "credit memo", "credit"],
        confidence: 0.9,
      },
      {
        type: "Debit Note",
        patterns: ["debit note", "debit memo", "debit"],
        confidence: 0.9,
      },

      // Financial types
      {
        type: "Bank Statement",
        patterns: ["bank statement", "account statement", "banking"],
        confidence: 0.9,
      },
      {
        type: "Tax Return",
        patterns: ["tax return", "income tax", "tax filing"],
        confidence: 0.9,
      },
      {
        type: "Budget Document",
        patterns: ["budget", "financial plan", "expenses", "revenue"],
        confidence: 0.8,
      },
      {
        type: "Expense Report",
        patterns: ["expense report", "expenses", "reimbursement"],
        confidence: 0.8,
      },
      {
        type: "Receipt",
        patterns: [
          "receipt",
          "paid",
          "payment received",
          "thank you for your payment",
        ],
        confidence: 0.9,
      },
      {
        type: "Payment Voucher",
        patterns: ["payment voucher", "voucher", "payment"],
        confidence: 0.8,
      },
      {
        type: "Financial Statement",
        patterns: [
          "financial statement",
          "balance sheet",
          "income statement",
          "profit loss",
        ],
        confidence: 0.8,
      },

      // Contract types
      {
        type: "Employment Contract",
        patterns: ["employment contract", "employee contract", "job contract"],
        confidence: 0.9,
      },
      {
        type: "Vendor Contract",
        patterns: ["vendor contract", "supplier contract", "vendor agreement"],
        confidence: 0.9,
      },
      {
        type: "Client Contract",
        patterns: ["client contract", "customer contract", "client agreement"],
        confidence: 0.9,
      },
      {
        type: "Service Agreement",
        patterns: ["service agreement", "service contract"],
        confidence: 0.8,
      },
      {
        type: "Lease Agreement",
        patterns: ["lease agreement", "lease contract", "rental agreement"],
        confidence: 0.8,
      },
      {
        type: "Partnership Agreement",
        patterns: ["partnership agreement", "partnership contract"],
        confidence: 0.8,
      },
      {
        type: "NDA",
        patterns: ["nda", "non disclosure", "confidentiality"],
        confidence: 0.9,
      },
      {
        type: "Contract",
        patterns: [
          "contract",
          "agreement",
          "terms and conditions",
          "party of the first part",
        ],
        confidence: 0.8,
      },

      // Report types
      {
        type: "Financial Report",
        patterns: ["financial report", "finance report"],
        confidence: 0.9,
      },
      {
        type: "Annual Report",
        patterns: ["annual report", "yearly report"],
        confidence: 0.9,
      },
      {
        type: "Incident Report",
        patterns: ["incident report", "accident report", "incident"],
        confidence: 0.9,
      },
      {
        type: "Monthly Report",
        patterns: ["monthly report", "month end report"],
        confidence: 0.8,
      },
      {
        type: "Quarterly Report",
        patterns: ["quarterly report", "quarter report"],
        confidence: 0.8,
      },
      {
        type: "Performance Report",
        patterns: ["performance report", "performance review"],
        confidence: 0.8,
      },
      {
        type: "Audit Report",
        patterns: ["audit report", "audit", "auditor"],
        confidence: 0.9,
      },
      {
        type: "Research Report",
        patterns: ["research report", "research", "study"],
        confidence: 0.8,
      },
      {
        type: "Report",
        patterns: ["report", "analysis", "summary", "findings", "conclusion"],
        confidence: 0.8,
      },

      // Policy types
      {
        type: "HR Policy",
        patterns: ["hr policy", "human resource policy", "personnel policy"],
        confidence: 0.9,
      },
      {
        type: "IT Policy",
        patterns: ["it policy", "technology policy", "computer policy"],
        confidence: 0.9,
      },
      {
        type: "Finance Policy",
        patterns: ["finance policy", "financial policy"],
        confidence: 0.9,
      },
      {
        type: "Security Policy",
        patterns: ["security policy", "safety policy"],
        confidence: 0.9,
      },
      {
        type: "Environmental Policy",
        patterns: ["environmental policy", "environment policy"],
        confidence: 0.9,
      },
      {
        type: "Quality Policy",
        patterns: ["quality policy", "quality assurance policy"],
        confidence: 0.9,
      },
      {
        type: "Policy",
        patterns: ["policy", "procedure", "guidelines", "rules", "regulations"],
        confidence: 0.8,
      },

      // Legal types
      {
        type: "Court Filing",
        patterns: ["court filing", "legal filing", "court document"],
        confidence: 0.9,
      },
      {
        type: "Legal Opinion",
        patterns: ["legal opinion", "legal advice", "attorney opinion"],
        confidence: 0.9,
      },
      {
        type: "Compliance Document",
        patterns: ["compliance", "regulatory compliance"],
        confidence: 0.8,
      },
      {
        type: "Regulatory Filing",
        patterns: ["regulatory filing", "regulatory document"],
        confidence: 0.8,
      },
      {
        type: "License",
        patterns: ["license", "permit", "authorization", "registration"],
        confidence: 0.8,
      },
      {
        type: "Permit",
        patterns: ["permit", "permission", "authorization"],
        confidence: 0.8,
      },
      {
        type: "Certificate",
        patterns: ["certificate", "certification", "award", "achievement"],
        confidence: 0.9,
      },
      {
        type: "Legal Document",
        patterns: ["legal", "attorney", "lawyer", "court", "judgment"],
        confidence: 0.8,
      },

      // HR types
      {
        type: "Employee Record",
        patterns: ["employee record", "personnel record", "staff record"],
        confidence: 0.9,
      },
      {
        type: "Performance Review",
        patterns: ["performance review", "performance evaluation", "appraisal"],
        confidence: 0.9,
      },
      {
        type: "Training Certificate",
        patterns: [
          "training certificate",
          "training completion",
          "course certificate",
        ],
        confidence: 0.9,
      },
      {
        type: "Job Description",
        patterns: [
          "job description",
          "position description",
          "role description",
        ],
        confidence: 0.9,
      },
      {
        type: "Resume",
        patterns: ["resume", "cv", "curriculum vitae"],
        confidence: 0.9,
      },
      {
        type: "Application Form",
        patterns: [
          "application form",
          "job application",
          "employment application",
        ],
        confidence: 0.9,
      },
      {
        type: "Application",
        patterns: ["application", "apply", "request", "submission"],
        confidence: 0.8,
      },
      {
        type: "HR Document",
        patterns: ["hr", "human resource", "employee", "personnel", "staff"],
        confidence: 0.7,
      },

      // Operations types
      {
        type: "SOP Document",
        patterns: ["sop", "standard operating procedure", "procedure"],
        confidence: 0.9,
      },
      {
        type: "Process Manual",
        patterns: ["process manual", "workflow manual"],
        confidence: 0.8,
      },
      {
        type: "Work Instruction",
        patterns: ["work instruction", "job instruction"],
        confidence: 0.8,
      },
      {
        type: "Quality Control",
        patterns: ["quality control", "qc", "quality assurance"],
        confidence: 0.8,
      },
      {
        type: "Maintenance Record",
        patterns: ["maintenance record", "maintenance log"],
        confidence: 0.8,
      },
      {
        type: "Inventory Report",
        patterns: ["inventory report", "stock report", "inventory"],
        confidence: 0.8,
      },
      {
        type: "Manual",
        patterns: ["manual", "guide", "instructions", "how to", "user guide"],
        confidence: 0.8,
      },
      {
        type: "Operations Document",
        patterns: ["operations", "process", "workflow", "procedure"],
        confidence: 0.7,
      },

      // Marketing types
      {
        type: "Marketing Plan",
        patterns: ["marketing plan", "marketing strategy"],
        confidence: 0.9,
      },
      {
        type: "Campaign Brief",
        patterns: ["campaign brief", "marketing campaign"],
        confidence: 0.8,
      },
      {
        type: "Brand Guidelines",
        patterns: ["brand guidelines", "brand standards"],
        confidence: 0.8,
      },
      {
        type: "Press Release",
        patterns: ["press release", "media release"],
        confidence: 0.9,
      },
      {
        type: "Advertisement",
        patterns: ["advertisement", "ad", "promotional"],
        confidence: 0.8,
      },
      {
        type: "Market Research",
        patterns: ["market research", "market analysis"],
        confidence: 0.8,
      },
      {
        type: "Marketing Document",
        patterns: ["marketing", "advertisement", "campaign", "promotion"],
        confidence: 0.7,
      },

      // Technical types
      {
        type: "Technical Specification",
        patterns: ["technical specification", "tech spec", "specification"],
        confidence: 0.9,
      },
      {
        type: "Design Document",
        patterns: ["design document", "design spec", "design"],
        confidence: 0.8,
      },
      {
        type: "User Manual",
        patterns: ["user manual", "user guide", "instruction manual"],
        confidence: 0.8,
      },
      {
        type: "API Documentation",
        patterns: ["api documentation", "api doc", "api"],
        confidence: 0.9,
      },
      {
        type: "System Architecture",
        patterns: ["system architecture", "architecture", "system design"],
        confidence: 0.8,
      },
      {
        type: "Code Documentation",
        patterns: ["code documentation", "code doc", "programming"],
        confidence: 0.8,
      },
      {
        type: "Technical Specification",
        patterns: ["it", "technology", "software", "system", "technical"],
        confidence: 0.7,
      },

      // General types
      {
        type: "Application Form",
        patterns: ["form", "questionnaire", "survey", "checklist"],
        confidence: 0.7,
      },
      {
        type: "Other",
        patterns: ["letter", "correspondence", "dear", "sincerely"],
        confidence: 0.7,
      },
      {
        type: "Other",
        patterns: ["memo", "memorandum", "internal", "to:"],
        confidence: 0.8,
      },
      {
        type: "Other",
        patterns: ["proposal", "offer", "quote", "estimate"],
        confidence: 0.8,
      },
      {
        type: "Other",
        patterns: ["other", "miscellaneous", "notes", "drafts"],
        confidence: 0.5,
      },
    ];

    let bestMatch = { type: "Other", confidence: 0.1 };
    let maxScore = 0;

    for (const classification of classifications) {
      let score = 0;
      let matches = 0;

      for (const pattern of classification.patterns) {
        if (lowerText.includes(pattern) || lowerFilename.includes(pattern)) {
          matches++;
          score += classification.confidence;
        }
      }

      // Bonus for multiple matches
      if (matches > 1) {
        score *= 1.2;
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = {
          type: classification.type,
          confidence: Math.min(score, 1.0),
        };
      }
    }

    return bestMatch;
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
