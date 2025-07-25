import AuditLog from "../models/AuditLog.js";

class AuditService {
  /**
   * Log a document-related action
   */
  static async logDocumentAction(userId, action, documentId, details = {}) {
    try {
      const auditData = {
        company: details.company, // Add company for data isolation
        userId,
        action,
        resourceType: "DOCUMENT",
        resourceId: documentId,
        resourceModel: "Document",
        details: {
          ...details,
          documentTitle: details.documentTitle,
          documentType: details.documentType,
          category: details.category,
          priority: details.priority,
          status: details.status,
          fileSize: details.fileSize,
          fileName: details.fileName,
        },
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        riskLevel: this.calculateRiskLevel(action, details),
      };

      return await AuditLog.log(auditData);
    } catch (error) {
      console.error("Error logging document action:", error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Log a user-related action
   */
  static async logUserAction(userId, action, targetUserId, details = {}) {
    try {
      const auditData = {
        company: details.company, // Add company for data isolation
        userId,
        action,
        resourceType: "USER",
        resourceId: targetUserId,
        resourceModel: "User",
        details: {
          ...details,
          oldRole: details.oldRole,
          newRole: details.newRole,
          oldDepartment: details.oldDepartment,
          newDepartment: details.newDepartment,
        },
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        riskLevel: this.calculateRiskLevel(action, details),
      };

      return await AuditLog.log(auditData);
    } catch (error) {
      console.error("Error logging user action:", error);
    }
  }

  /**
   * Log a system-related action
   */
  static async logSystemAction(userId, action, details = {}) {
    try {
      const auditData = {
        company: details.company, // Add company for data isolation
        userId,
        action,
        resourceType: "SYSTEM",
        details: {
          ...details,
          settingName: details.settingName,
          oldValue: details.oldValue,
          newValue: details.newValue,
        },
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        riskLevel: this.calculateRiskLevel(action, details),
      };

      return await AuditLog.log(auditData);
    } catch (error) {
      console.error("Error logging system action:", error);
    }
  }

  /**
   * Log authentication-related actions
   */
  static async logAuthAction(userId, action, details = {}) {
    try {
      const auditData = {
        company: details.company, // Add company for data isolation
        userId,
        action,
        resourceType: "AUTH",
        details: {
          ...details,
          ipAddress: details.ipAddress,
          userAgent: details.userAgent,
          location: details.location,
          attemptCount: details.attemptCount,
        },
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        riskLevel: this.calculateRiskLevel(action, details),
      };

      return await AuditLog.log(auditData);
    } catch (error) {
      console.error("Error logging auth action:", error);
    }
  }

  /**
   * Calculate risk level based on action and details
   */
  static calculateRiskLevel(action, details = {}) {
    const highRiskActions = [
      "DOCUMENT_DELETED",
      "USER_DELETED",
      "USER_ROLE_CHANGED",
      "PERMISSION_DENIED",
      "SUSPICIOUS_ACTIVITY",
    ];

    const mediumRiskActions = [
      "DOCUMENT_APPROVED",
      "DOCUMENT_REJECTED",
      "USER_CREATED",
      "USER_UPDATED",
      "SETTINGS_UPDATED",
    ];

    if (highRiskActions.includes(action)) {
      return "HIGH";
    } else if (mediumRiskActions.includes(action)) {
      return "MEDIUM";
    } else if (action === "LOGIN_ATTEMPT" && details.attemptCount > 3) {
      return "CRITICAL";
    }

    return "LOW";
  }

  /**
   * Get recent activity for dashboard
   */
  static async getRecentActivity(limit = 10, companyFilter = {}) {
    try {
      return await AuditLog.getRecentActivity({ limit, companyFilter });
    } catch (error) {
      console.error("Error getting recent activity:", error);
      return [];
    }
  }

  /**
   * Get audit trail for a specific document
   */
  static async getDocumentAuditTrail(documentId, companyFilter = {}) {
    try {
      return await AuditLog.getAuditTrail(
        "DOCUMENT",
        documentId,
        companyFilter
      );
    } catch (error) {
      console.error("Error getting document audit trail:", error);
      return [];
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(userId, days = 30) {
    try {
      return await AuditLog.getUserActivitySummary(userId, days);
    } catch (error) {
      console.error("Error getting user activity summary:", error);
      return [];
    }
  }

  /**
   * Get activity statistics for admin dashboard
   */
  static async getActivityStats({ days = 30, company } = {}) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const matchStage = {
        timestamp: { $gte: startDate },
        isDeleted: false,
      };

      // Add company filter if provided
      if (company) {
        matchStage.company = company;
      }

      const stats = await AuditLog.aggregate([
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: {
              action: "$action",
              resourceType: "$resourceType",
              riskLevel: "$riskLevel",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.resourceType",
            actions: {
              $push: {
                action: "$_id.action",
                count: "$count",
                riskLevel: "$_id.riskLevel",
              },
            },
            totalCount: { $sum: "$count" },
          },
        },
      ]);

      return stats;
    } catch (error) {
      console.error("Error getting activity stats:", error);
      return [];
    }
  }

  /**
   * Clean old audit logs based on retention policy
   */
  static async cleanOldLogs() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 2555); // 7 years

      const result = await AuditLog.updateMany(
        {
          timestamp: { $lt: cutoffDate },
          isDeleted: false,
        },
        {
          $set: { isDeleted: true },
        }
      );

      console.log(`Cleaned ${result.modifiedCount} old audit logs`);
      return result.modifiedCount;
    } catch (error) {
      console.error("Error cleaning old audit logs:", error);
      return 0;
    }
  }

  /**
   * Export audit logs for compliance
   */
  static async exportAuditLogs(options = {}) {
    try {
      const {
        startDate,
        endDate,
        resourceType,
        action,
        userId,
        format = "json",
      } = options;

      const query = { isDeleted: false };

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      if (resourceType) query.resourceType = resourceType;
      if (action) query.action = action;
      if (userId) query.userId = userId;

      const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .populate("userId", "firstName lastName email")
        .populate("resourceId");

      if (format === "csv") {
        return this.convertToCSV(logs);
      }

      return logs;
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      return [];
    }
  }

  /**
   * Convert audit logs to CSV format
   */
  static convertToCSV(logs) {
    const headers = [
      "Timestamp",
      "User",
      "Action",
      "Resource Type",
      "Resource ID",
      "Details",
      "IP Address",
      "Risk Level",
    ];

    const csvRows = [headers.join(",")];

    logs.forEach((log) => {
      const row = [
        log.timestamp.toISOString(),
        log.userDetails?.name || "Unknown",
        log.action,
        log.resourceType,
        log.resourceId || "",
        JSON.stringify(log.details),
        log.ipAddress || "",
        log.riskLevel,
      ].map((field) => `"${field}"`);

      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }
}

export default AuditService;
