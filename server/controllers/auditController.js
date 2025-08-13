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

  const options = {
    limit: parseInt(limit),
    userId,
    resourceType,
    action,
    startDate,
    endDate,
    riskLevel,
    department,
  };

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
