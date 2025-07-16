import User from "../models/User.js";
import Department from "../models/Department.js";
import Role from "../models/Role.js";
import Document from "../models/Document.js";
import { hasPermission } from "../utils/permissionUtils.js";

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

    // Get system statistics
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalDepartments = await Department.countDocuments({
      isActive: true,
    });
    const totalDocuments = await Document.countDocuments({ isActive: true });
    const totalRoles = await Role.countDocuments({ isActive: true });

    // Get recent activity
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email createdAt");

    const recentDepartments = await Department.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name code createdAt");

    const recentDocuments = await Document.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("uploadedBy", "name")
      .select("title status createdAt");

    // Get users by role
    const usersByRole = await User.aggregate([
      { $match: { isActive: true } },
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

    // Get documents by status
    const documentsByStatus = await Document.aggregate([
      { $match: { isActive: true } },
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

    // Get user count for each role
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({
          role: role._id,
          isActive: true,
        });
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

    // In a real implementation, you'd have an AuditLog model
    // For now, we'll return a mock response
    const mockAuditLog = [
      {
        id: 1,
        action: "USER_LOGIN",
        userId: "user123",
        userName: "John Doe",
        timestamp: new Date(),
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        details: "User logged in successfully",
      },
      {
        id: 2,
        action: "DOCUMENT_UPLOAD",
        userId: "user456",
        userName: "Jane Smith",
        timestamp: new Date(Date.now() - 3600000),
        ipAddress: "192.168.1.2",
        userAgent: "Mozilla/5.0...",
        details: "Document 'Q4 Report.pdf' uploaded",
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        logs: mockAuditLog,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockAuditLog.length,
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

    switch (operation) {
      case "activate":
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        break;

      case "deactivate":
        result = await User.updateMany(
          { _id: { $in: userIds } },
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
          { _id: { $in: userIds } },
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
          { _id: { $in: userIds } },
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
