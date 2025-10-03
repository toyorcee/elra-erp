import AuditService from "../services/auditService.js";
import { asyncHandler } from "../utils/index.js";
import AuditLog from "../models/AuditLog.js";
import Document from "../models/Document.js";
import User from "../models/User.js";
import WorkflowTemplate from "../models/WorkflowTemplate.js";
import ApprovalLevel from "../models/ApprovalLevel.js";

/**
 * Get recent activity for dashboard
 */
export const getRecentActivity = asyncHandler(async (req, res) => {
  const {
    limit = 50,
    userId,
    resourceType,
    action,
    startDate,
    endDate,
    riskLevel,
    department,
  } = req.query;

  const currentUserId = req.user.id;
  const isAdmin =
    req.user.role?.name === "PLATFORM_ADMIN" ||
    req.user.role?.name === "SUPER_ADMIN";

  const options = {
    limit: parseInt(limit),
    userId: userId || (isAdmin ? null : currentUserId),
    resourceType,
    action,
    startDate,
    endDate,
    riskLevel,
    department,
  };

  console.log("🔍 Audit API Debug:", {
    currentUserId,
    isAdmin,
    requestedUserId: userId,
    finalUserId: options.userId,
    userRole: req.user.role?.name,
  });

  const activity = await AuditService.getRecentActivity(options);

  res.json({
    success: true,
    data: activity,
    message: "Recent activity retrieved successfully",
  });
});

/**
 * Get audit trail for a specific document
 */
export const getDocumentAuditTrail = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const auditTrail = await AuditService.getDocumentAuditTrail(documentId);

  res.json({
    success: true,
    data: auditTrail,
    message: "Document audit trail retrieved successfully",
  });
});

/**
 * Get user activity summary
 */
export const getUserActivitySummary = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { days = 30 } = req.query;

  const summary = await AuditService.getUserActivitySummary(
    userId,
    parseInt(days)
  );

  res.json({
    success: true,
    data: summary,
    message: "User activity summary retrieved successfully",
  });
});

/**
 * Get activity statistics for admin dashboard
 */
export const getActivityStats = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const stats = await AuditService.getActivityStats({
    days: parseInt(days),
  });

  res.json({
    success: true,
    data: stats,
    message: "Activity statistics retrieved successfully",
  });
});

/**
 * Export audit logs for compliance
 */
export const exportAuditLogs = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    resourceType,
    action,
    userId,
    format = "json",
  } = req.query;

  const options = {
    startDate,
    endDate,
    resourceType,
    action,
    userId,
    format,
  };

  const logs = await AuditService.exportAuditLogs(options);

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="audit-logs-${
        new Date().toISOString().split("T")[0]
      }.csv"`
    );
    return res.send(logs);
  }

  res.json({
    success: true,
    data: logs,
    message: "Audit logs exported successfully",
  });
});

/**
 * Get audit logs with advanced filtering
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    userId,
    resourceType,
    action,
    riskLevel,
    startDate,
    endDate,
    sortBy = "timestamp",
    sortOrder = "desc",
  } = req.query;

  const options = {
    limit: parseInt(limit),
    userId,
    resourceType,
    action,
    riskLevel,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    page: parseInt(page),
  };

  const logs = await AuditService.getRecentActivity(options);

  res.json({
    success: true,
    data: logs,
    message: "Audit logs retrieved successfully",
  });
});

/**
 * Get audit log by ID
 */
export const getAuditLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await AuditLog.findById(id)
    .populate("userId", "firstName lastName email role")
    .populate("resourceId");

  if (!log) {
    return res.status(404).json({
      success: false,
      message: "Audit log not found",
    });
  }

  res.json({
    success: true,
    data: log,
    message: "Audit log retrieved successfully",
  });
});

/**
 * Clean old audit logs (admin only)
 */
export const cleanOldLogs = asyncHandler(async (req, res) => {
  const cleanedCount = await AuditService.cleanOldLogs();

  res.json({
    success: true,
    data: { cleanedCount },
    message: `Cleaned ${cleanedCount} old audit logs`,
  });
});

/**
 * Get audit dashboard data
 */
export const getAuditDashboard = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  // Get activity stats
  const activityStats = await AuditService.getActivityStats(parseInt(days));

  // Get recent high-risk activities
  const highRiskActivities = await AuditService.getRecentActivity({
    riskLevel: "HIGH",
    limit: 10,
  });

  // Get recent document activities
  const documentActivities = await AuditService.getRecentActivity({
    resourceType: "DOCUMENT",
    limit: 10,
  });

  // Get recent user activities
  const userActivities = await AuditService.getRecentActivity({
    resourceType: "USER",
    limit: 10,
  });

  const dashboardData = {
    activityStats,
    highRiskActivities,
    documentActivities,
    userActivities,
    summary: {
      totalActivities: activityStats.reduce(
        (sum, stat) => sum + stat.totalCount,
        0
      ),
      highRiskCount: highRiskActivities.length,
      documentCount: documentActivities.length,
      userCount: userActivities.length,
    },
  };

  res.json({
    success: true,
    data: dashboardData,
    message: "Audit dashboard data retrieved successfully",
  });
});

/**
 * Create sample audit data for testing
 */
export const createSampleAuditData = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Create some sample audit logs
    const sampleLogs = [
      {
        userId,
        action: "PROJECT_CREATED",
        resourceType: "PROJECT",
        details: {
          description: "Created new external project",
          projectName: "Sample Project 1",
        },
        riskLevel: "LOW",
      },
      {
        userId,
        action: "DOCUMENT_UPLOADED",
        resourceType: "DOCUMENT",
        details: {
          description: "Uploaded project proposal document",
          documentTitle: "Project Proposal.pdf",
        },
        riskLevel: "LOW",
      },
      {
        userId,
        action: "USER_LOGIN",
        resourceType: "AUTH",
        details: {
          description: "User logged into system",
        },
        riskLevel: "LOW",
      },
    ];

    const createdLogs = [];
    for (const logData of sampleLogs) {
      const log = await AuditService.logActivity(logData);
      if (log) createdLogs.push(log);
    }

    res.json({
      success: true,
      data: createdLogs,
      message: "Sample audit data created successfully",
    });
  } catch (error) {
    console.error("Error creating sample audit data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create sample audit data",
    });
  }
});
