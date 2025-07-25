import User from "../models/User.js";
import Department from "../models/Department.js";
import Role from "../models/Role.js";
import Document from "../models/Document.js";
import AuditLog from "../models/AuditLog.js";
import { hasPermission } from "../utils/permissionUtils.js";
import AuditService from "../services/auditService.js";

// @desc    Get system overview statistics
// @route   GET /api/super-admin/overview
// @access  Private (Super Admin only)
export const getSystemOverview = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is super admin
    if (currentUser.role.level < 100) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin privileges required.",
      });
    }

    // Get system statistics - FILTER BY COMPANY for data isolation
    const companyFilter = currentUser.company
      ? { company: currentUser.company }
      : {};

    const totalUsers = await User.countDocuments({
      isActive: true,
      ...companyFilter,
    });
    const totalDepartments = await Department.countDocuments({
      isActive: true,
      ...companyFilter,
    });
    const totalDocuments = await Document.countDocuments({
      isActive: true,
      ...companyFilter,
    });
    const totalRoles = await Role.countDocuments({ isActive: true });

    // Get recent activity - FILTER BY COMPANY
    const recentUsers = await User.find({
      isActive: true,
      ...companyFilter,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firstName lastName email createdAt");

    const recentDepartments = await Department.find({
      isActive: true,
      ...companyFilter,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name code createdAt");

    const recentDocuments = await Document.find({
      isActive: true,
      ...companyFilter,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("uploadedBy", "firstName lastName")
      .select("title status createdAt");

    const usersByRole = await User.aggregate([
      {
        $match: {
          isActive: true,
          ...companyFilter,
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleData",
        },
      },
      { $unwind: "$roleData" },
      {
        $group: {
          _id: "$roleData.name",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get documents by status - FILTER BY COMPANY
    const documentsByStatus = await Document.aggregate([
      {
        $match: {
          isActive: true,
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalDepartments,
          totalDocuments,
          totalRoles,
        },
        recentActivity: {
          users: recentUsers,
          departments: recentDepartments,
          documents: recentDocuments,
        },
        analytics: {
          usersByRole,
          documentsByStatus,
        },
      },
    });
  } catch (error) {
    console.error("System overview error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get system statistics for dashboard
// @route   GET /api/super-admin/stats
// @access  Private (Super Admin only)
export const getSystemStats = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is super admin
    if (currentUser.role.level < 100) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin privileges required.",
      });
    }

    // Get basic counts - FILTER BY COMPANY for data isolation
    const companyFilter = currentUser.company
      ? { company: currentUser.company }
      : {};

    const totalUsers = await User.countDocuments({
      isActive: true,
      ...companyFilter,
    });
    const totalDocuments = await Document.countDocuments({
      isActive: true,
      ...companyFilter,
    });
    const totalDepartments = await Department.countDocuments({
      isActive: true,
      ...companyFilter,
    });
    const pendingApprovals = await Document.countDocuments({
      status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
      isActive: true,
      ...companyFilter,
    });

    // Get recent activity stats - FILTER BY COMPANY
    const recentActivity = await AuditService.getRecentActivity(
      10,
      companyFilter
    );

    // Get activity trends (last 7 days) - FILTER BY COMPANY
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivityCount = await AuditService.getActivityStats({
      startDate: sevenDaysAgo,
      endDate: new Date(),
      company: currentUser.company,
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDocuments,
        totalDepartments,
        pendingApprovals,
        recentActivity: recentActivity.data || [],
        activityStats: recentActivityCount.data || {},
      },
    });
  } catch (error) {
    console.error("System stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all system users with advanced filtering
// @route   GET /api/super-admin/users
// @access  Private (Super Admin only)
export const getAllSystemUsers = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is super admin
    if (currentUser.role.level < 100) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin privileges required.",
      });
    }

    const {
      page = 1,
      limit = 20,
      search,
      role,
      department,
      status = "active",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // FILTER BY COMPANY for data isolation
    if (currentUser.company) {
      query.company = currentUser.company;
    }

    // Filter by status
    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (roleDoc) {
        query.role = roleDoc._id;
      }
    }

    // Filter by department
    if (department) {
      const deptDoc = await Department.findOne({ name: department });
      if (deptDoc) {
        query.department = deptDoc._id;
      }
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: "role", select: "name level description" },
        { path: "department", select: "name code" },
        { path: "supervisor", select: "name email" },
      ],
      sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
    };

    const users = await User.paginate(query, options);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get system users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get system roles
// @route   GET /api/super-admin/roles
// @access  Private (Super Admin only)
export const getSystemRoles = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is super admin
    if (currentUser.role.level < 100) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin privileges required.",
      });
    }

    const roles = await Role.find({ isActive: true })
      .sort({ level: -1 })
      .select("name level description permissions departmentAccess");

    // Get user count for each role - FILTER BY COMPANY
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        const userCountQuery = {
          role: role._id,
          isActive: true,
        };

        // Add company filter if user has a company
        if (currentUser.company) {
          userCountQuery.company = currentUser.company;
        }

        const userCount = await User.countDocuments(userCountQuery);
        return {
          ...role.toObject(),
          userCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: rolesWithUserCount,
    });
  } catch (error) {
    console.error("Get system roles error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update system settings
// @route   PUT /api/super-admin/settings
// @access  Private (Super Admin only)
export const updateSystemSettings = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is super admin
    if (currentUser.role.level < 100) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin privileges required.",
      });
    }

    const {
      systemName,
      maxFileSize,
      allowedFileTypes,
      sessionTimeout,
      passwordPolicy,
      emailSettings,
      notificationSettings,
    } = req.body;

    // Here you would typically update system settings in a database
    // For now, we'll return a success response
    // In a real implementation, you'd have a SystemSettings model

    res.status(200).json({
      success: true,
      message: "System settings updated successfully",
      data: {
        systemName,
        maxFileSize,
        allowedFileTypes,
        sessionTimeout,
        passwordPolicy,
        emailSettings,
        notificationSettings,
      },
    });
  } catch (error) {
    console.error("Update system settings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get system audit log
// @route   GET /api/super-admin/audit
// @access  Private (Super Admin only)
export const getSystemAudit = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is super admin
    if (currentUser.role.level < 100) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin privileges required.",
      });
    }

    const {
      page = 1,
      limit = 50,
      action,
      userId,
      startDate,
      endDate,
    } = req.query;

    // Build query with company filtering for data isolation
    const query = { isDeleted: false };

    // Add company filter if user has a company
    if (currentUser.company) {
      query.company = currentUser.company;
    }

    // Add filters based on query parameters
    if (action) query.action = action;
    if (userId) query.userId = userId;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await AuditLog.countDocuments(query);

    // Get audit logs with pagination and company filtering
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "firstName lastName email")
      .populate("resourceId");

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get system audit error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Bulk user operations
// @route   POST /api/super-admin/users/bulk
// @access  Private (Super Admin only)
export const bulkUserOperations = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is super admin
    if (currentUser.role.level < 100) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin privileges required.",
      });
    }

    const { operation, userIds, data } = req.body;

    let result;

    // Add company filter for data isolation
    const companyFilter = currentUser.company
      ? { company: currentUser.company }
      : {};

    switch (operation) {
      case "activate":
        result = await User.updateMany(
          { _id: { $in: userIds }, ...companyFilter },
          { isActive: true }
        );
        break;

      case "deactivate":
        result = await User.updateMany(
          { _id: { $in: userIds }, ...companyFilter },
          { isActive: false }
        );
        break;

      case "assignRole":
        if (!data.roleId) {
          return res.status(400).json({
            success: false,
            message: "Role ID is required for role assignment",
          });
        }
        result = await User.updateMany(
          { _id: { $in: userIds }, ...companyFilter },
          { role: data.roleId }
        );
        break;

      case "assignDepartment":
        if (!data.departmentId) {
          return res.status(400).json({
            success: false,
            message: "Department ID is required for department assignment",
          });
        }
        result = await User.updateMany(
          { _id: { $in: userIds }, ...companyFilter },
          { department: data.departmentId }
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid operation",
        });
    }

    res.status(200).json({
      success: true,
      message: `Bulk operation '${operation}' completed successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      },
    });
  } catch (error) {
    console.error("Bulk user operations error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
