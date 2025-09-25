import Policy from "../models/Policy.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import NotificationService from "../services/notificationService.js";

// Create a new legal policy
export const createPolicy = async (req, res) => {
  try {
    const {
      title,
      category,
      status,
      version,
      effectiveDate,
      description,
      content,
      department,
      attachments,
      applicableProjectScopes,
    } = req.body;

    // Check if user has permission (Legal HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can create legal policies.",
      });
    }

    let projectScopes = applicableProjectScopes || [];

    const policy = await Policy.create({
      title,
      category,
      status,
      version,
      effectiveDate,
      description,
      content,
      department: department || null,
      policyScope: "legal",
      applicableProjectScopes: projectScopes,
      createdBy: req.user._id,
      attachments: attachments || [],
      customCategory:
        category === "Other" && req.body.customCategory
          ? req.body.customCategory
          : undefined,
    });

    const populatedPolicy = await Policy.findById(policy._id)
      .populate("department", "name")
      .populate("createdBy", "firstName lastName email role department")
      .populate("createdBy.role", "name level")
      .populate("createdBy.department", "name");

    try {
      await sendLegalPolicyNotifications(populatedPolicy, "created", req.user);
    } catch (notificationError) {
      console.error(
        "Error sending legal policy notifications:",
        notificationError
      );
    }

    res.status(201).json({
      success: true,
      data: populatedPolicy,
      message: "Legal policy created successfully",
    });
  } catch (error) {
    console.error("Create legal policy error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create legal policy",
    });
  }
};

// Get all legal policies with filtering and pagination
export const getPolicies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      department,
    } = req.query;

    const query = {
      isActive: true,
      policyScope: "legal", // Only legal policies
    };

    // Apply filters
    if (status && status !== "All") {
      query.status = status;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (department) {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const policies = await Policy.find(query)
      .populate("department", "name")
      .populate("createdBy", "firstName lastName email role department")
      .populate("createdBy.role", "name level")
      .populate("createdBy.department", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Policy.countDocuments(query);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        policies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
        },
      },
      message: "Legal policies retrieved successfully",
    });
  } catch (error) {
    console.error("Get legal policies error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch legal policies",
    });
  }
};

// Get legal policy by ID
export const getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await Policy.findOne({
      _id: id,
      isActive: true,
      policyScope: "legal",
    })
      .populate("department", "name")
      .populate("createdBy", "firstName lastName email role department")
      .populate("createdBy.role", "name level")
      .populate("createdBy.department", "name");

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Legal policy not found",
      });
    }

    res.json({
      success: true,
      data: policy,
      message: "Legal policy retrieved successfully",
    });
  } catch (error) {
    console.error("Get legal policy by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch legal policy",
    });
  }
};

// Update legal policy
export const updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user has permission (Legal HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can update legal policies.",
      });
    }

    const policy = await Policy.findOne({
      _id: id,
      isActive: true,
      policyScope: "legal", // Only legal policies
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Legal policy not found",
      });
    }

    const isOther = updateData.category === "Other";
    updateData.customCategory = isOther ? updateData.customCategory : undefined;
    updateData.policyScope = "legal";
    updateData.lastUpdated = new Date();

    const updatedPolicy = await Policy.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("department", "name")
      .populate("createdBy", "firstName lastName email role department")
      .populate("createdBy.role", "name level")
      .populate("createdBy.department", "name");

    try {
      await sendLegalPolicyNotifications(updatedPolicy, "updated", req.user);
    } catch (notificationError) {
      console.error(
        "Error sending legal policy notifications:",
        notificationError
      );
    }

    res.json({
      success: true,
      data: updatedPolicy,
      message: "Legal policy updated successfully",
    });
  } catch (error) {
    console.error("Update legal policy error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update legal policy",
    });
  }
};

// Delete legal policy (soft delete)
export const deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await Policy.findOne({
      _id: id,
      isActive: true,
      policyScope: "legal",
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Legal policy not found",
      });
    }

    // Allow delete if Super Admin OR creator
    const isSuperAdmin = req.user?.role?.level >= 1000;
    const isCreator =
      policy.createdBy?.toString?.() === req.user._id?.toString?.();
    if (!isSuperAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only the creator or Super Admin can delete this policy.",
      });
    }

    // Soft delete
    policy.isActive = false;
    await policy.save();

    res.json({
      success: true,
      message: "Legal policy deleted successfully",
    });
  } catch (error) {
    console.error("Delete legal policy error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete legal policy",
    });
  }
};

// Get legal policy statistics
export const getPolicyStats = async (req, res) => {
  try {
    const stats = await Policy.aggregate([
      {
        $match: {
          isActive: true,
          policyScope: "legal", // Only legal policies
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Policy.countDocuments({
      isActive: true,
      policyScope: "legal",
    });

    const statsMap = {
      Active: 0,
      Draft: 0,
      Inactive: 0,
      "Under Review": 0,
      Total: total,
    };

    stats.forEach((stat) => {
      statsMap[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: statsMap,
      message: "Legal policy statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Get legal policy stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch legal policy statistics",
    });
  }
};

// Update legal policy version
export const updatePolicyVersion = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can update legal policy versions.",
      });
    }

    const policy = await Policy.findOne({
      _id: id,
      isActive: true,
      policyScope: "legal", // Only legal policies
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Legal policy not found",
      });
    }

    await policy.incrementVersion();

    const updatedPolicy = await Policy.findById(id)
      .populate("department", "name")
      .populate("createdBy", "firstName lastName email role department")
      .populate("createdBy.role", "name level")
      .populate("createdBy.department", "name");

    res.json({
      success: true,
      data: updatedPolicy,
      message: "Legal policy version updated successfully",
    });
  } catch (error) {
    console.error("Update legal policy version error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update legal policy version",
    });
  }
};

// Get legal policies by department
export const getPoliciesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const policies = await Policy.find({
      department: departmentId,
      isActive: true,
      policyScope: "legal", // Only legal policies
    })
      .populate("department", "name")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Policy.countDocuments({
      department: departmentId,
      isActive: true,
      policyScope: "legal",
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        policies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
        },
      },
      message: "Department legal policies retrieved successfully",
    });
  } catch (error) {
    console.error("Get legal policies by department error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department legal policies",
    });
  }
};

export const getPolicyOptions = async (req, res) => {
  try {
    const categories = Policy.schema.path("category").enumValues;
    const statuses = Policy.schema.path("status").enumValues;

    res.json({
      success: true,
      data: {
        categories: categories || [],
        statuses: statuses || [],
      },
    });
  } catch (error) {
    console.error("Get legal policy options error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get legal policy options",
    });
  }
};

// Get legal policy categories from database
export const getLegalPolicyCategories = async (req, res) => {
  try {
    // Get unique categories from existing legal policies
    const existingCategories = await Policy.distinct("category", {
      policyScope: "legal",
      isActive: true,
    });

    // Get schema enum values for legal categories
    const schemaCategories = Policy.schema.path("category").enumValues;

    // Filter schema categories to only include legal-relevant ones
    const legalSchemaCategories = schemaCategories.filter(
      (cat) =>
        ![
          "Behavioral",
          "Benefits",
          "Work Arrangements",
          "Safety",
          "Compensation",
        ].includes(cat)
    );

    // Combine and deduplicate
    const allCategories = [
      ...new Set([...legalSchemaCategories, ...existingCategories]),
    ];

    res.json({
      success: true,
      data: {
        categories: allCategories,
      },
    });
  } catch (error) {
    console.error("Error fetching legal policy categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching legal policy categories",
    });
  }
};

// Send notifications to ALL HODs for legal policies
const sendLegalPolicyNotifications = async (policy, action, creator) => {
  try {
    console.log(
      `📧 [LEGAL POLICY] Sending ${action} notifications for: ${policy.title}`
    );

    const notificationService = new NotificationService();

    const allHODs = await User.find({
      isActive: true,
      _id: { $ne: creator._id },
    })
      .populate("role")
      .populate("department")
      .then((users) =>
        users.filter(
          (user) =>
            user.role && (user.role.name === "HOD" || user.role.level >= 700)
        )
      );

    console.log(`🔍 [LEGAL POLICY] Found ${allHODs.length} HODs to notify`);

    const notifications = [];

    for (const hod of allHODs) {
      if (hod._id.toString() === creator._id.toString()) {
        continue;
      }

      const notification = await notificationService.createNotification({
        recipient: hod._id,
        type: `LEGAL_POLICY_${action.toUpperCase()}`,
        title: `Legal Policy ${action === "created" ? "Created" : "Updated"}`,
        message: `A legal policy "${policy.title}" has been ${action} by the Legal & Compliance team. This affects compliance requirements across all departments.`,
        data: {
          policyId: policy._id,
          actionUrl: `/dashboard/modules/legal/policies`,
          priority: "high",
        },
      });
      if (notification) notifications.push(notification);
      console.log(
        `📧 [LEGAL POLICY] Notified ${hod.department?.name || "Unknown"} HOD: ${
          hod.firstName
        } ${hod.lastName}`
      );
    }

    // Send personal notification to the Legal HOD (creator)
    if (
      creator.department?.name === "Legal & Compliance" ||
      creator.role?.level >= 700
    ) {
      const personalNotification = await notificationService.createNotification(
        {
          recipient: creator._id,
          type: `LEGAL_POLICY_${action.toUpperCase()}_PERSONAL`,
          title: `Your Legal Policy ${
            action === "created" ? "Created" : "Updated"
          } Successfully`,
          message: `Your legal policy "${policy.title}" has been ${action} successfully. All department heads have been notified of this policy change.`,
          data: {
            policyId: policy._id,
            actionUrl: `/dashboard/modules/legal/policies`,
            priority: "medium",
          },
        }
      );
      if (personalNotification) notifications.push(personalNotification);
      console.log(
        `📧 [LEGAL POLICY] Personal notification sent to Legal HOD: ${creator.firstName} ${creator.lastName}`
      );
    }

    const superAdmins = await User.find({
      $or: [{ "role.level": 1000 }, { isSuperadmin: true }],
      isActive: true,
      _id: { $ne: creator._id },
    }).populate("role department");

    const superAdmin = superAdmins.length > 0 ? superAdmins[0] : null;

    console.log(
      `🔍 [LEGAL POLICY] Super Admin search result:`,
      superAdmin
        ? `${superAdmin.firstName} ${superAdmin.lastName} (level: ${superAdmin.role?.level})`
        : "Not found"
    );

    if (superAdmin) {
      if (superAdmin._id.toString() !== creator._id.toString()) {
        const notification = await notificationService.createNotification({
          recipient: superAdmin._id,
          type: `LEGAL_POLICY_${action.toUpperCase()}`,
          title: `Legal Policy ${action === "created" ? "Created" : "Updated"}`,
          message: `A legal policy "${policy.title}" has been ${action}. Full system oversight required.`,
          data: {
            policyId: policy._id,
            actionUrl: `/dashboard/modules/legal/policies`,
            priority: "high",
          },
        });
        if (notification) notifications.push(notification);
        console.log(
          `📧 [LEGAL POLICY] Notified Super Admin: ${superAdmin.firstName} ${superAdmin.lastName}`
        );
      } else {
        console.log(
          `📧 [LEGAL POLICY] Super Admin is the creator - skipped generic notification (already got personal notification)`
        );
      }
    } else {
      console.log(`❌ [LEGAL POLICY] No Super Admin found`);
    }

    console.log(
      `📧 [LEGAL POLICY] Sent ${notifications.length} notifications for ${action} policy: ${policy.title}`
    );
    return notifications;
  } catch (error) {
    console.error("Error sending legal policy notifications:", error);
    throw error;
  }
};
