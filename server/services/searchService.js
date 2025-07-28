import Document from "../models/Document.js";
import User from "../models/User.js";

class SearchService {
  /**
   * Advanced search with multiple criteria
   */
  async advancedSearch(searchParams, user) {
    try {
      const {
        query = "",
        documentType,
        category,
        status,
        priority,
        department,
        dateFrom,
        dateTo,
        uploadedBy,
        tags,
        keywords,
        monetaryRange,
        organization,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = searchParams;

      // Build search filter
      const filter = {
        company: user.company,
        isActive: true,
      };

      // Text search across multiple fields
      if (query) {
        filter.$or = [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { reference: { $regex: query, $options: "i" } },
          { "ocrData.extractedText": { $regex: query, $options: "i" } },
          { "ocrData.keywords": { $in: [new RegExp(query, "i")] } },
          { tags: { $in: [new RegExp(query, "i")] } },
        ];
      }

      // Filter by document type
      if (documentType) {
        filter.$or = filter.$or || [];
        filter.$or.push(
          { documentType: documentType },
          { "ocrData.documentType": documentType }
        );
      }

      // Filter by category
      if (category) {
        filter.category = category;
      }

      // Filter by status
      if (status) {
        filter.status = status;
      }

      // Filter by priority
      if (priority) {
        filter.priority = priority;
      }

      // Filter by department
      if (department) {
        filter.department = department;
      }

      // Filter by date range
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) {
          filter.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          filter.createdAt.$lte = new Date(dateTo);
        }
      }

      // Filter by uploader
      if (uploadedBy) {
        filter.uploadedBy = uploadedBy;
      }

      // Filter by tags
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        filter.tags = { $in: tagArray };
      }

      // Filter by keywords (from OCR)
      if (keywords) {
        const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
        filter["ocrData.keywords"] = { $in: keywordArray };
      }

      // Filter by monetary values
      if (monetaryRange) {
        filter["ocrData.monetaryValues"] = { $exists: true, $ne: [] };
      }

      // Filter by organization references
      if (organization) {
        filter["ocrData.organizationReferences"] = {
          $regex: organization,
          $options: "i",
        };
      }

      // Apply user permissions
      if (user.role.level < 100) {
        // Not super admin
        if (user.role.level < 80) {
          // Regular user
          filter.$or = filter.$or || [];
          filter.$or.push(
            { uploadedBy: user._id },
            { department: user.department },
            { isConfidential: false }
          );
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Execute search
      const documents = await Document.find(filter)
        .populate("uploadedBy", "name email")
        .populate("department", "name")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination
      const total = await Document.countDocuments(filter);

      // Enhance results with search relevance scores
      const enhancedResults = documents.map((doc) => ({
        ...doc,
        searchRelevance: this.calculateSearchRelevance(doc, query),
        ocrConfidence: doc.ocrData?.confidence || 0,
      }));

      // Sort by relevance if query is provided
      if (query) {
        enhancedResults.sort((a, b) => b.searchRelevance - a.searchRelevance);
      }

      return {
        success: true,
        data: {
          documents: enhancedResults,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
          searchStats: {
            query,
            totalResults: total,
            searchTime: Date.now(),
          },
        },
      };
    } catch (error) {
      console.error("Search error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Full-text search within OCR extracted text
   */
  async fullTextSearch(query, user, options = {}) {
    try {
      const { page = 1, limit = 20, minConfidence = 50 } = options;

      const filter = {
        company: user.company,
        isActive: true,
        "ocrData.extractedText": { $regex: query, $options: "i" },
        "ocrData.confidence": { $gte: minConfidence },
      };

      // Apply user permissions
      if (user.role.level < 100) {
        if (user.role.level < 80) {
          filter.$or = [
            { uploadedBy: user._id },
            { department: user.department },
            { isConfidential: false },
          ];
        }
      }

      const skip = (page - 1) * limit;

      const documents = await Document.find(filter)
        .populate("uploadedBy", "name email")
        .populate("department", "name")
        .sort({ "ocrData.confidence": -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Document.countDocuments(filter);

      return {
        success: true,
        data: {
          documents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      console.error("Full-text search error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Search by metadata (dates, organizations, monetary values)
   */
  async metadataSearch(searchParams, user) {
    try {
      const {
        dateReferences,
        organizationReferences,
        monetaryValues,
        page = 1,
        limit = 20,
      } = searchParams;

      const filter = {
        company: user.company,
        isActive: true,
      };

      // Search by date references
      if (dateReferences) {
        filter["ocrData.dateReferences"] = {
          $in: Array.isArray(dateReferences)
            ? dateReferences
            : [dateReferences],
        };
      }

      // Search by organization references
      if (organizationReferences) {
        filter["ocrData.organizationReferences"] = {
          $regex: organizationReferences,
          $options: "i",
        };
      }

      // Search by monetary values
      if (monetaryValues) {
        filter["ocrData.monetaryValues"] = {
          $regex: monetaryValues,
          $options: "i",
        };
      }

      // Apply user permissions
      if (user.role.level < 100) {
        if (user.role.level < 80) {
          filter.$or = [
            { uploadedBy: user._id },
            { department: user.department },
            { isConfidential: false },
          ];
        }
      }

      const skip = (page - 1) * limit;

      const documents = await Document.find(filter)
        .populate("uploadedBy", "name email")
        .populate("department", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Document.countDocuments(filter);

      return {
        success: true,
        data: {
          documents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      console.error("Metadata search error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Search for similar documents
   */
  async findSimilarDocuments(documentId, user, options = {}) {
    try {
      const { limit = 10 } = options;

      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error("Document not found");
      }

      // Find documents with similar keywords
      const similarFilter = {
        _id: { $ne: documentId },
        company: user.company,
        isActive: true,
        "ocrData.keywords": {
          $in: document.ocrData?.keywords || [],
        },
      };

      // Apply user permissions
      if (user.role.level < 100) {
        if (user.role.level < 80) {
          similarFilter.$or = [
            { uploadedBy: user._id },
            { department: user.department },
            { isConfidential: false },
          ];
        }
      }

      const similarDocuments = await Document.find(similarFilter)
        .populate("uploadedBy", "name email")
        .populate("department", "name")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return {
        success: true,
        data: {
          documents: similarDocuments,
          originalDocument: {
            id: document._id,
            title: document.title,
            keywords: document.ocrData?.keywords || [],
          },
        },
      };
    } catch (error) {
      console.error("Similar documents search error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get search suggestions based on existing documents
   */
  async getSearchSuggestions(query, user) {
    try {
      const filter = {
        company: user.company,
        isActive: true,
      };

      // Apply user permissions
      if (user.role.level < 100) {
        if (user.role.level < 80) {
          filter.$or = [
            { uploadedBy: user._id },
            { department: user.department },
            { isConfidential: false },
          ];
        }
      }

      const suggestions = {
        titles: [],
        keywords: [],
        organizations: [],
        documentTypes: [],
      };

      // Get title suggestions
      const titleSuggestions = await Document.distinct("title", {
        ...filter,
        title: { $regex: query, $options: "i" },
      });
      suggestions.titles = titleSuggestions.slice(0, 5);

      // Get keyword suggestions
      const keywordSuggestions = await Document.distinct("ocrData.keywords", {
        ...filter,
        "ocrData.keywords": { $regex: query, $options: "i" },
      });
      suggestions.keywords = keywordSuggestions.slice(0, 5);

      // Get organization suggestions
      const orgSuggestions = await Document.distinct(
        "ocrData.organizationReferences",
        {
          ...filter,
          "ocrData.organizationReferences": { $regex: query, $options: "i" },
        }
      );
      suggestions.organizations = orgSuggestions.slice(0, 5);

      // Get document type suggestions
      const typeSuggestions = await Document.distinct("documentType", {
        ...filter,
        documentType: { $regex: query, $options: "i" },
      });
      suggestions.documentTypes = typeSuggestions.slice(0, 5);

      return {
        success: true,
        data: suggestions,
      };
    } catch (error) {
      console.error("Search suggestions error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate search relevance score
   */
  calculateSearchRelevance(document, query) {
    if (!query) return 0;

    let score = 0;
    const lowerQuery = query.toLowerCase();

    // Title match (highest weight)
    if (document.title.toLowerCase().includes(lowerQuery)) {
      score += 100;
    }

    // Description match
    if (
      document.description &&
      document.description.toLowerCase().includes(lowerQuery)
    ) {
      score += 50;
    }

    // OCR text match
    if (
      document.ocrData?.extractedText &&
      document.ocrData.extractedText.toLowerCase().includes(lowerQuery)
    ) {
      score += 30;
    }

    // Keywords match
    if (document.ocrData?.keywords) {
      const keywordMatches = document.ocrData.keywords.filter((keyword) =>
        keyword.toLowerCase().includes(lowerQuery)
      ).length;
      score += keywordMatches * 20;
    }

    // Tags match
    if (document.tags) {
      const tagMatches = document.tags.filter((tag) =>
        tag.toLowerCase().includes(lowerQuery)
      ).length;
      score += tagMatches * 15;
    }

    // Reference match
    if (
      document.reference &&
      document.reference.toLowerCase().includes(lowerQuery)
    ) {
      score += 25;
    }

    return score;
  }
}

export default new SearchService();
