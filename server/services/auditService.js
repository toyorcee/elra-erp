import AuditLog from "../models/AuditLog.js";

class AuditService {
  /**
   * Log a document-related action
   */
  static async logDocumentAction(userId, action, documentId, details = {}) {
    try {
      const auditData = {
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
   * Log deduction-related actions
   */
  static async logDeductionAction(userId, action, deductionId, details = {}) {
    try {
      const auditData = {
        userId,
        action,
        resourceType: "DEDUCTION",
        resourceId: deductionId,
        resourceModel: "Deduction",
        details: {
          ...details,
          deductionName: details.deductionName,
          type: details.type,
          category: details.category,
          scope: details.scope,
          amount: details.amount,
          calculationType: details.calculationType,
          useTaxBrackets: details.useTaxBrackets,
          isActive: details.isActive,
        },
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        riskLevel: this.calculateRiskLevel(action, details),
      };

      return await AuditLog.log(auditData);
    } catch (error) {
      console.error("Error logging deduction action:", error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Log any activity with custom resource type
   */
  static async logActivity(data) {
    try {
      const auditData = {
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType?.toUpperCase(),
        resourceId: data.resourceId,
        resourceModel:
          data.resourceType?.charAt(0).toUpperCase() +
          data.resourceType?.slice(1),
        details: {
          ...data.details,
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        riskLevel: this.calculateRiskLevel(data.action, data.details),
      };

      return await AuditLog.log(auditData);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }

  /**
   * Log salary grade-related actions
   */
  static async logSalaryGradeAction(
    userId,
    action,
    salaryGradeId,
    details = {}
  ) {
    try {
      const auditData = {
        userId,
        action,
        resourceType: "SALARY_GRADE",
        resourceId: salaryGradeId,
        resourceModel: "SalaryGrade",
        details: {
          ...details,
          gradeName: details.gradeName,
          gradeLevel: details.gradeLevel,
          salaryRange: details.salaryRange,
          description: details.description,
        },
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        riskLevel: this.calculateRiskLevel(action, details),
      };

      return await AuditLog.log(auditData);
    } catch (error) {
      console.error("Error logging salary grade action:", error);
    }
  }

  /**
   * Log authentication-related actions
   */
  static async logAuthAction(userId, action, details = {}) {
    try {
      const auditData = {
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
   * Log leave request-related actions
   */
  static async logLeaveAction(userId, action, leaveRequestId, details = {}) {
    try {
      const auditData = {
        userId,
        action,
        resourceType: "LEAVE_REQUEST",
        resourceId: leaveRequestId,
        resourceModel: "LeaveRequest",
        details: {
          ...details,
          leaveType: details.leaveType,
          startDate: details.startDate,
          endDate: details.endDate,
          days: details.days,
          reason: details.reason,
          status: details.status,
          approverName: details.approverName,
          comment: details.comment,
          employeeName: details.employeeName,
          department: details.department,
        },
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        riskLevel: this.calculateRiskLevel(action, details),
      };

      return await AuditLog.log(auditData);
    } catch (error) {
      console.error("Error logging leave action:", error);
      // Don't throw error to avoid breaking main functionality
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
      "DEDUCTION_DELETED",
    ];

    const mediumRiskActions = [
      "DOCUMENT_APPROVED",
      "DOCUMENT_REJECTED",
      "USER_CREATED",
      "USER_UPDATED",
      "SETTINGS_UPDATED",
      "LEAVE_REQUEST_APPROVED",
      "LEAVE_REQUEST_REJECTED",
      "LEAVE_REQUEST_CANCELLED",
      "DEDUCTION_CREATED",
      "DEDUCTION_UPDATED",
      "DEDUCTION_ACTIVATED",
      "DEDUCTION_DEACTIVATED",
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
  static async getRecentActivity(options = {}) {
    try {
      const { limit = 10, department } = options;
      return await AuditLog.getRecentActivity({
        limit,
        department,
      });
    } catch (error) {
      console.error("Error getting recent activity:", error);
      return [];
    }
  }

  /**
   * Get audit trail for a specific document
   */
  static async getDocumentAuditTrail(documentId) {
    try {
      return await AuditLog.getAuditTrail("DOCUMENT", documentId);
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
  static async getActivityStats({ days = 30 } = {}) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const matchStage = {
        timestamp: { $gte: startDate },
        isDeleted: false,
      };

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

  // ==================== PAYROLL AUDIT METHODS ====================

  /**
   * Log payroll processing activity
   */
  static async logPayrollProcessed(userId, payrollData) {
    try {
      await AuditLog.log({
        userId,
        action: "PAYROLL_PROCESSED",
        resourceType: "PAYROLL",
        resourceId: null, 
        resourceModel: "Payroll",
        details: {
          description: `Payroll processed for ${payrollData.scope} scope`,
          payrollPeriod: {
            month: payrollData.month,
            year: payrollData.year,
            frequency: payrollData.frequency,
          },
          payrollScope: payrollData.scope,
          payrollScopeId: null, 
          metadata: {
            totalEmployees: payrollData.totalEmployees,
            totalGrossPay: payrollData.totalGrossPay,
            totalNetPay: payrollData.totalNetPay,
            totalDeductions: payrollData.totalDeductions,
          },
        },
        riskLevel: "LOW",
      });

      console.log(`📝 [AUDIT] Payroll processed logged for user ${userId}`);
    } catch (error) {
      console.error("Error logging payroll processed:", error);
    }
  }

  /**
   * Log when a payroll item (allowance/bonus/deduction) is marked as used
   */
  static async logPayrollItemMarkedUsed(userId, itemData, payrollData) {
    try {
      await AuditLog.log({
        userId,
        action: "PAYROLL_ITEM_MARKED_USED",
        resourceType: itemData.resourceType, // PERSONAL_ALLOWANCE, PERSONAL_BONUS, or DEDUCTION
        resourceId: itemData.id,
        resourceModel: itemData.resourceModel, // PersonalAllowance, PersonalBonus, or Deduction
        details: {
          description: `${itemData.itemType} "${itemData.name}" marked as used for payroll processing`,
          payrollPeriod: {
            month: payrollData.month,
            year: payrollData.year,
            frequency: payrollData.frequency,
          },
          payrollScope: payrollData.scope,
          payrollScopeId: payrollData.scopeId,
          employeeId: itemData.employeeId,
          employeeName: itemData.employeeName,
          itemType: itemData.itemType, // allowance, bonus, deduction
          itemName: itemData.name,
          itemAmount: itemData.amount,
          usageCount: itemData.usageCount,
          lastUsedDate: itemData.lastUsedDate,
          lastUsedScope: itemData.lastUsedScope,
          lastUsedFrequency: itemData.lastUsedFrequency,
          lastUsedTimestamp: itemData.lastUsedTimestamp,
        },
        riskLevel: "LOW",
      });

      console.log(
        `📝 [AUDIT] ${itemData.itemType} "${itemData.name}" marked as used logged for user ${userId}`
      );
    } catch (error) {
      console.error("Error logging payroll item marked as used:", error);
    }
  }

  /**
   * Get recent payroll activity
   */
  static async getRecentPayrollActivity(options = {}) {
    try {
      const payrollActions = [
        "PAYROLL_PROCESSED",
        "PAYROLL_PREVIEW_GENERATED",
        "PAYROLL_ITEM_MARKED_USED",
        "PAYROLL_ITEM_CREATED",
        "PAYROLL_ITEM_UPDATED",
        "PAYROLL_ITEM_DELETED",
        "PAYROLL_ITEM_ACTIVATED",
        "PAYROLL_ITEM_DEACTIVATED",
        "PAYROLL_TAX_CALCULATED",
        "PAYROLL_ALLOWANCE_APPLIED",
        "PAYROLL_BONUS_APPLIED",
        "PAYROLL_DEDUCTION_APPLIED",
      ];

      const query = {
        isDeleted: false,
        action: { $in: payrollActions },
      };

      if (options.userId) query.userId = options.userId;
      if (options.resourceType) query.resourceType = options.resourceType;
      if (options.action) query.action = options.action;
      if (options.department)
        query["userDetails.department"] = options.department;

      if (options.startDate || options.endDate) {
        query.timestamp = {};
        if (options.startDate)
          query.timestamp.$gte = new Date(options.startDate);
        if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
      }

      return await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .limit(options.limit || 50)
        .populate("userId", "firstName lastName email")
        .populate("resourceId");
    } catch (error) {
      console.error("Error getting recent payroll activity:", error);
      throw error;
    }
  }
}

export default AuditService;
