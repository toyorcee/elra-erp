import Company from "../models/Company.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import { sendAccountActivationEmail } from "../services/emailService.js";
import crypto from "crypto";

export const createCompanyAndSuperadmin = async (req, res) => {
  try {
    const { companyName, superadmin } = req.body;
    // Check for existing company
    if (await Company.findOne({ name: companyName })) {
      return res.status(400).json({ message: "Company already exists" });
    }
    // Create company
    const company = await Company.create({
      name: companyName,
      createdBy: req.user._id,
    });
    // Create a default department for the company
    const defaultDept = await Department.create({
      name: "General",
      code: `GEN-${company._id.toString().slice(-4)}`,
      description: "Default department for company superadmin",
      createdBy: req.user._id,
      isActive: true,
    });
    // Get SUPER_ADMIN role
    const superadminRole = await Role.findOne({ name: "SUPER_ADMIN" });
    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString("hex");
    // Create superadmin user
    const user = await User.create({
      ...superadmin,
      role: superadminRole._id,
      company: company._id,
      department: defaultDept._id,
      isSuperadmin: true,
      isActive: true,
      isEmailVerified: false,
      passwordResetToken: activationToken,
      passwordResetExpires: Date.now() + 60 * 60 * 1000,
    });
    const emailResult = await sendAccountActivationEmail(
      user.email,
      user.firstName || user.username,
      activationToken
    );
    res.status(201).json({ company, superadmin: user, email: emailResult });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listCompanies = async (req, res) => {
  const companies = await Company.find().sort({ createdAt: -1 });
  res.json(companies);
};

// @desc    Get platform statistics for Platform Admin dashboard
// @route   GET /api/platform/statistics
// @access  Private (Platform Admin only)
export const getPlatformStatistics = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is platform admin
    if (currentUser.role.level < 110) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Platform admin privileges required.",
      });
    }

    // Get platform statistics
    const totalCompanies = await Company.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ isActive: true });

    // Get superadmin count
    const superadminRole = await Role.findOne({ name: "SUPER_ADMIN" });
    const totalSuperadmins = await User.countDocuments({
      role: superadminRole._id,
      isActive: true,
    });

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

    // Get companies with their superadmin info
    const companiesWithSuperadmins = await Company.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "company",
          as: "users",
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "users.role",
          foreignField: "_id",
          as: "userRoles",
        },
      },
      {
        $addFields: {
          superadminCount: {
            $size: {
              $filter: {
                input: "$users",
                as: "user",
                cond: {
                  $and: [
                    { $eq: ["$$user.isActive", true] },
                    { $eq: ["$$user.isSuperadmin", true] },
                  ],
                },
              },
            },
          },
          totalUsers: {
            $size: {
              $filter: {
                input: "$users",
                as: "user",
                cond: { $eq: ["$$user.isActive", true] },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          createdAt: 1,
          isActive: 1,
          superadminCount: 1,
          totalUsers: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    // Get recent activity
    const recentCompanies = await Company.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name createdAt");

    const recentSuperadmins = await User.find({
      role: superadminRole._id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firstName lastName email createdAt")
      .populate("company", "name");

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCompanies,
          totalUsers,
          totalSuperadmins,
        },
        analytics: {
          usersByRole,
          companiesWithSuperadmins,
        },
        recentActivity: {
          companies: recentCompanies,
          superadmins: recentSuperadmins,
        },
      },
    });
  } catch (error) {
    console.error("❌ Platform statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
