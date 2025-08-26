import fs from "fs";
import path from "path";
import Tesseract from "tesseract.js";

class OCRService {
  /**
   * Process document with OCR using Tesseract.js
   * @param {string} filePath - Path to the document file
   * @param {Object} options - OCR processing options
   * @returns {Object} OCR results
   */
  static async processDocument(filePath, options = {}) {
    try {
      console.log("🔍 [OCRService] Starting OCR processing for:", filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Extract text using Tesseract.js
      const {
        data: { text, confidence },
      } = await Tesseract.recognize(filePath, "eng", {
        logger: (m) =>
          console.log(`📄 [OCRService] ${m.status}: ${m.progress * 100}%`),
      });

      console.log("✅ [OCRService] Text extraction completed");

      // Process extracted text for metadata
      const extractedText = text.trim();
      const keywords = this.extractKeywords(extractedText);
      const categorization = await this.categorizeDocument(extractedText);
      const confidentialityLevel = await this.detectConfidentialityLevel(
        extractedText
      );
      const suggestedMetadata = this.generateSuggestedMetadata(
        extractedText,
        categorization
      );

      const ocrResult = {
        success: true,
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
        extractedText,
        keywords,
        suggestedTitle: suggestedMetadata.title,
        suggestedDescription: suggestedMetadata.description,
        suggestedCategory: categorization.category,
        suggestedConfidentiality: confidentialityLevel,
        suggestedTags: suggestedMetadata.tags,
        documentType: categorization.documentType || "other",
        processingTime: Date.now(),
        wordCount: extractedText.split(/\s+/).length,
        characterCount: extractedText.length,
      };

      console.log("✅ [OCRService] OCR processing completed successfully");
      return ocrResult;
    } catch (error) {
      console.error(
        "❌ [OCRService] Error processing document with OCR:",
        error
      );
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Extract keywords from text
   * @param {string} text - Extracted text
   * @returns {Array} Keywords
   */
  static extractKeywords(text) {
    try {
      // Remove special characters and convert to lowercase
      const cleanText = text.toLowerCase().replace(/[^\w\s]/g, " ");

      // Split into words and filter out common stop words
      const stopWords = new Set([
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "could",
        "should",
        "may",
        "might",
        "must",
        "can",
        "this",
        "that",
        "these",
        "those",
        "i",
        "you",
        "he",
        "she",
        "it",
        "we",
        "they",
        "me",
        "him",
        "her",
        "us",
        "them",
        "my",
        "your",
        "his",
        "her",
        "its",
        "our",
        "their",
      ]);

      const words = cleanText
        .split(/\s+/)
        .filter((word) => word.length > 3 && !stopWords.has(word));

      // Count word frequency
      const wordCount = {};
      words.forEach((word) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      // Get top 10 most frequent words as keywords
      const keywords = Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);

      return keywords;
    } catch (error) {
      console.error("❌ [OCRService] Error extracting keywords:", error);
      return [];
    }
  }

  /**
   * Categorize document based on content
   * @param {string} text - Extracted text
   * @returns {Object} Categorization results
   */
  static async categorizeDocument(text) {
    try {
      console.log("🏷️ [OCRService] Categorizing document based on content");

      const textLower = text.toLowerCase();

      // Define category keywords with weights
      const categories = {
        financial: {
          keywords: [
            "budget",
            "cost",
            "expense",
            "financial",
            "payment",
            "invoice",
            "receipt",
            "money",
            "fund",
            "account",
            "bank",
            "transaction",
          ],
          documentTypes: [
            "financial_analysis",
            "budget_breakdown",
            "invoice",
            "receipt",
          ],
        },
        technical: {
          keywords: [
            "technical",
            "specification",
            "system",
            "implementation",
            "architecture",
            "code",
            "software",
            "hardware",
            "technology",
            "development",
            "programming",
          ],
          documentTypes: [
            "technical_specifications",
            "system_design",
            "api_documentation",
          ],
        },
        legal: {
          keywords: [
            "legal",
            "contract",
            "agreement",
            "terms",
            "conditions",
            "compliance",
            "law",
            "regulation",
            "policy",
            "clause",
            "liability",
          ],
          documentTypes: ["contract", "legal_document", "policy_document"],
        },
        hr: {
          keywords: [
            "employee",
            "staff",
            "personnel",
            "recruitment",
            "training",
            "performance",
            "human",
            "resource",
            "hiring",
            "employment",
          ],
          documentTypes: ["employee_record", "hr_policy", "training_material"],
        },
        project: {
          keywords: [
            "project",
            "plan",
            "timeline",
            "milestone",
            "deliverable",
            "scope",
            "objective",
            "goal",
            "strategy",
          ],
          documentTypes: [
            "project_proposal",
            "project_plan",
            "risk_assessment",
          ],
        },
      };

      let bestCategory = "other";
      let highestScore = 0;
      let documentType = "other";

      for (const [category, config] of Object.entries(categories)) {
        const score = config.keywords.filter((keyword) =>
          textLower.includes(keyword)
        ).length;
        if (score > highestScore) {
          highestScore = score;
          bestCategory = category;
          // Select most relevant document type
          documentType = config.documentTypes[0];
        }
      }

      return {
        category: bestCategory,
        confidence: highestScore > 0 ? Math.min(highestScore * 15, 100) : 50,
        documentType,
        keywords: Object.values(categories).flatMap((config) =>
          config.keywords.filter((keyword) => textLower.includes(keyword))
        ),
      };
    } catch (error) {
      console.error("❌ [OCRService] Error categorizing document:", error);
      return {
        category: "other",
        confidence: 50,
        documentType: "other",
        keywords: [],
      };
    }
  }

  /**
   * Detect confidentiality level
   * @param {string} text - Extracted text
   * @returns {string} Confidentiality level
   */
  static async detectConfidentialityLevel(text) {
    try {
      const textLower = text.toLowerCase();

      const confidentialKeywords = [
        "confidential",
        "secret",
        "restricted",
        "private",
        "sensitive",
        "classified",
      ];
      const publicKeywords = ["public", "open", "published", "announcement"];

      const hasConfidentialKeywords = confidentialKeywords.some((keyword) =>
        textLower.includes(keyword)
      );
      const hasPublicKeywords = publicKeywords.some((keyword) =>
        textLower.includes(keyword)
      );

      if (hasConfidentialKeywords) {
        return "confidential";
      } else if (hasPublicKeywords) {
        return "public";
      }

      return "internal";
    } catch (error) {
      console.error(
        "❌ [OCRService] Error detecting confidentiality level:",
        error
      );
      return "internal";
    }
  }

  /**
   * Generate suggested metadata based on extracted text
   * @param {string} text - Extracted text
   * @param {Object} categorization - Categorization results
   * @returns {Object} Suggested metadata
   */
  static generateSuggestedMetadata(text, categorization) {
    try {
      // Extract first few words as title (up to 60 characters)
      const words = text.split(/\s+/).slice(0, 8);
      const suggestedTitle =
        words.join(" ").substring(0, 60) +
        (words.join(" ").length > 60 ? "..." : "");

      // Generate description from first few sentences
      const sentences = text
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 10);
      const suggestedDescription =
        sentences.slice(0, 2).join(". ").substring(0, 200) +
        (sentences.slice(0, 2).join(". ").length > 200 ? "..." : "");

      // Generate tags based on category and keywords
      const tags = [
        categorization.category,
        ...categorization.keywords.slice(0, 5),
      ];

      return {
        title: suggestedTitle,
        description: suggestedDescription,
        tags: [...new Set(tags)], // Remove duplicates
      };
    } catch (error) {
      console.error(
        "❌ [OCRService] Error generating suggested metadata:",
        error
      );
      return {
        title: "Document",
        description: "Document processed with OCR",
        tags: [categorization.category],
      };
    }
  }
}

export default OCRService;
