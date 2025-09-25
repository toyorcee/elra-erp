import Compliance from "../models/Compliance.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import NotificationService from "../services/notificationService.js";

export const createCompliance = async (req, res) => {
  try {
    const {
      title,
      category,
      customCategory,
      status,
      priority,
      dueDate,
      nextAudit,
      description,
      requirements,
      findings,
      complianceProgram,
    } = req.body;

    // Check if user has permission (Legal HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can create legal compliance items.",
      });
    }

    // Validate compliance program exists
    if (!complianceProgram) {
      return res.status(400).json({
        success: false,
        message: "Compliance program is required",
      });
    }

    const ComplianceProgram = (await import("../models/ComplianceProgram.js"))
      .default;
    const program = await ComplianceProgram.findById(complianceProgram);
    if (!program || !program.isActive) {
      return res.status(400).json({
        success: false,
        message: "Compliance program not found or inactive",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (new Date(dueDate) < today) {
      return res.status(400).json({
        success: false,
        message: "Due date cannot be in the past",
      });
    }

    if (new Date(nextAudit) < today) {
      return res.status(400).json({
        success: false,
        message: "Next audit date cannot be in the past",
      });
    }

    const compliance = await Compliance.create({
      title,
      category: category === "Other" && customCategory ? "Other" : category,
      customCategory:
        category === "Other" && customCategory ? customCategory : undefined,
      status,
      priority,
      dueDate,
      nextAudit,
      description,
      requirements,
      findings,
      lastAudit: new Date(),
      createdBy: req.user._id,
      complianceProgram,
      complianceScope: "legal",
    });

    const populatedCompliance = await Compliance.findById(compliance._id)
      .populate("createdBy", "firstName lastName email role department")
      .populate("createdBy.role", "name level")
      .populate("createdBy.department", "name");

    try {
      await sendLegalComplianceNotifications(
        populatedCompliance,
        "created",
        req.user
      );
    } catch (notificationError) {
      console.error(
        "Error sending legal compliance notifications:",
        notificationError
      );
    }

    res.status(201).json({
      success: true,
      data: populatedCompliance,
      message: "Legal compliance item created successfully",
    });
  } catch (error) {
    console.error("Create legal compliance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create legal compliance item",
    });
  }
};

// Get all legal compliance items with filtering and pagination
export const getComplianceItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      search,
      department,
    } = req.query;

    const query = {
      isActive: true,
      complianceScope: "legal",
    };

    // Apply filters
    if (status && status !== "All") {
      query.status = status;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (priority && priority !== "All") {
      query.priority = priority;
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

    const complianceItems = await Compliance.find(query)
      .populate("createdBy", "firstName lastName email role department")
      .populate("createdBy.role", "name level")
      .populate("createdBy.department", "name")
      .populate("complianceProgram", "name category status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Compliance.countDocuments(query);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        complianceItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
        },
      },
      message: "Legal compliance items retrieved successfully",
    });
  } catch (error) {
    console.error("Get legal compliance items error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch legal compliance items",
    });
  }
};

// Get legal compliance item by ID
export const getComplianceById = async (req, res) => {
  try {
    const { id } = req.params;

    const compliance = await Compliance.findOne({
      _id: id,
      isActive: true,
      complianceScope: "legal",
    })
      .populate("createdBy", "firstName lastName email role department")
      .populate("createdBy.role", "name level")
      .populate("createdBy.department", "name");

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: "Legal compliance item not found",
      });
    }

    res.json({
      success: true,
      data: compliance,
      message: "Legal compliance item retrieved successfully",
    });
  } catch (error) {
    console.error("Get legal compliance item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch legal compliance item",
    });
  }
};

// Update legal compliance item
export const updateCompliance = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user has permission (Legal HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can update legal compliance items.",
      });
    }

    const compliance = await Compliance.findOne({
      _id: id,
      isActive: true,
      complianceScope: "legal",
    });

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: "Legal compliance item not found",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (updateData.dueDate && new Date(updateData.dueDate) < today) {
      return res.status(400).json({
        success: false,
        message: "Due date cannot be in the past",
      });
    }

    if (updateData.nextAudit && new Date(updateData.nextAudit) < today) {
      return res.status(400).json({
        success: false,
        message: "Next audit date cannot be in the past",
      });
    }

    const isOther = updateData.category === "Other";
    updateData.customCategory = isOther ? updateData.customCategory : undefined;
    updateData.complianceScope = "legal";
    updateData.lastUpdated = new Date();

    const updatedCompliance = await Compliance.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("createdBy", "firstName lastName email role department")
      .populate("createdBy.role", "name level")
      .populate("createdBy.department", "name");

    try {
      await sendLegalComplianceNotifications(
        updatedCompliance,
        "updated",
        req.user
      );
    } catch (notificationError) {
      console.error(
        "Error sending legal compliance notifications:",
        notificationError
      );
    }

    res.json({
      success: true,
      data: updatedCompliance,
      message: "Legal compliance item updated successfully",
    });
  } catch (error) {
    console.error("Update legal compliance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update legal compliance item",
    });
  }
};

// Delete legal compliance item (soft delete)
export const deleteCompliance = async (req, res) => {
  try {
    const { id } = req.params;

    const compliance = await Compliance.findOne({
      _id: id,
      isActive: true,
      complianceScope: "legal",
    });

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: "Legal compliance item not found",
      });
    }

    // Allow delete if Super Admin OR creator
    const isSuperAdmin = req.user?.role?.level >= 1000;
    const isCreator =
      compliance.createdBy?.toString?.() === req.user._id?.toString?.();
    if (!isSuperAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only the creator or Super Admin can delete this compliance item.",
      });
    }

    compliance.isActive = false;
    await compliance.save();

    res.json({
      success: true,
      message: "Legal compliance item deleted successfully",
    });
  } catch (error) {
    console.error("Delete legal compliance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete legal compliance item",
    });
  }
};

// Get legal compliance statistics
export const getComplianceStats = async (req, res) => {
  try {
    const stats = await Compliance.aggregate([
      {
        $match: {
          isActive: true,
          complianceScope: "legal",
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Compliance.countDocuments({
      isActive: true,
      complianceScope: "legal",
    });

    const statsMap = {
      Compliant: 0,
      "Non-Compliant": 0,
      "Under Review": 0,
      Pending: 0,
      Total: total,
    };

    stats.forEach((stat) => {
      statsMap[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: statsMap,
      message: "Legal compliance statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Get legal compliance stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch legal compliance statistics",
    });
  }
};

// Get overdue legal compliance items
export const getOverdueItems = async (req, res) => {
  try {
    const today = new Date();
    const overdueItems = await Compliance.find({
      isActive: true,
      complianceScope: "legal",
      dueDate: { $lt: today },
      status: { $ne: "Compliant" },
    })
      .populate("createdBy", "firstName lastName email role department")
      .populate("createdBy.role", "name level")
      .populate("createdBy.department", "name")
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: overdueItems,
      message: "Overdue legal compliance items retrieved successfully",
    });
  } catch (error) {
    console.error("Get overdue legal compliance items error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch overdue legal compliance items",
    });
  }
};

// Get due soon legal compliance items
export const getDueSoonItems = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysFromNow = new Date(
      today.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    const dueSoonItems = await Compliance.find({
      isActive: true,
      complianceScope: "legal",
      dueDate: { $gte: today, $lte: sevenDaysFromNow },
      status: { $ne: "Compliant" },
    })
      .populate("createdBy", "firstName lastName email role department")
      .populate("createdBy.role", "name level")
      .populate("createdBy.department", "name")
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: dueSoonItems,
      message: "Due soon legal compliance items retrieved successfully",
    });
  } catch (error) {
    console.error("Get due soon legal compliance items error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch due soon legal compliance items",
    });
  }
};

// Update audit dates
export const updateAuditDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { lastAudit, nextAudit } = req.body;

    // Check if user has permission (Legal HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can update audit dates.",
      });
    }

    const compliance = await Compliance.findOne({
      _id: id,
      isActive: true,
      complianceScope: "legal",
    });

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: "Legal compliance item not found",
      });
    }

    await compliance.updateAuditDates(lastAudit, nextAudit);

    const updatedCompliance = await Compliance.findById(id)
      .populate("createdBy", "firstName lastName email role department")
      .populate("createdBy.role", "name level")
      .populate("createdBy.department", "name");

    res.json({
      success: true,
      data: updatedCompliance,
      message: "Audit dates updated successfully",
    });
  } catch (error) {
    console.error("Update audit dates error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update audit dates",
    });
  }
};

// Get legal compliance categories from database
export const getLegalComplianceCategories = async (req, res) => {
  try {
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can view compliance categories.",
      });
    }

    const ComplianceProgram = (await import("../models/ComplianceProgram.js"))
      .default;
    const existingCategories = await ComplianceProgram.distinct("category", {
      isActive: true,
      complianceScope: "legal",
    });

    const schemaCategories =
      ComplianceProgram.schema.path("category").enumValues;

    const allCategories = [
      ...new Set([...schemaCategories, ...existingCategories]),
    ];

    res.json({
      success: true,
      data: {
        categories: allCategories,
      },
    });
  } catch (error) {
    console.error("Error fetching legal compliance categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching legal compliance categories",
      error: error.message,
    });
  }
};

// Send notifications to ALL HODs for legal compliance
const sendLegalComplianceNotifications = async (
  compliance,
  action,
  creator
) => {
  try {
    console.log(
      `📧 [LEGAL COMPLIANCE] Sending ${action} notifications for: ${compliance.title}`
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

    console.log(`🔍 [LEGAL COMPLIANCE] Found ${allHODs.length} HODs to notify`);

    const notifications = [];

    for (const hod of allHODs) {
      // Skip the creator (Legal HOD) - they'll get a personal notification
      if (hod._id.toString() === creator._id.toString()) {
        continue;
      }

      const notification = await notificationService.createNotification({
        recipient: hod._id,
        type: `LEGAL_COMPLIANCE_${action.toUpperCase()}`,
        title: `Legal Compliance ${
          action === "created"
            ? "Created"
            : action === "updated"
            ? "Updated"
            : "Deleted"
        }`,
        message: `A legal compliance item "${compliance.title}" has been ${action} by the Legal & Compliance team. This affects compliance requirements across all departments.`,
        data: {
          complianceId: compliance._id,
          actionUrl: `/dashboard/modules/legal/compliance`,
          priority: "high",
        },
      });
      if (notification) notifications.push(notification);
      console.log(
        `📧 [LEGAL COMPLIANCE] Notified ${
          hod.department?.name || "Unknown"
        } HOD: ${hod.firstName} ${hod.lastName}`
      );
    }

    if (
      creator.department?.name === "Legal & Compliance" ||
      creator.role?.level >= 700
    ) {
      const personalNotification = await notificationService.createNotification(
        {
          recipient: creator._id,
          type: `LEGAL_COMPLIANCE_${action.toUpperCase()}_PERSONAL`,
          title: `Your Legal Compliance ${
            action === "created"
              ? "Created"
              : action === "updated"
              ? "Updated"
              : "Deleted"
          } Successfully`,
          message: `Your legal compliance item "${compliance.title}" has been ${action} successfully. All department heads have been notified of this compliance requirement.`,
          data: {
            complianceId: compliance._id,
            actionUrl: `/dashboard/modules/legal/compliance`,
            priority: "medium",
          },
        }
      );
      if (personalNotification) notifications.push(personalNotification);
      console.log(
        `📧 [LEGAL COMPLIANCE] Personal notification sent to Legal HOD: ${creator.firstName} ${creator.lastName}`
      );
    }

    // Find Super Admin using the same pattern as other controllers
    const superAdmins = await User.find({
      $or: [{ "role.level": 1000 }, { isSuperadmin: true }],
      isActive: true,
      _id: { $ne: creator._id },
    }).populate("role department");

    const superAdmin = superAdmins.length > 0 ? superAdmins[0] : null;

    console.log(
      `🔍 [LEGAL COMPLIANCE] Super Admin search result:`,
      superAdmin
        ? `${superAdmin.firstName} ${superAdmin.lastName} (level: ${superAdmin.role?.level})`
        : "Not found"
    );

    if (superAdmin) {
      // Skip if Super Admin is the creator - they already got a personal notification
      if (superAdmin._id.toString() !== creator._id.toString()) {
        const notification = await notificationService.createNotification({
          recipient: superAdmin._id,
          type: `LEGAL_COMPLIANCE_${action.toUpperCase()}`,
          title: `Legal Compliance ${
            action === "created"
              ? "Created"
              : action === "updated"
              ? "Updated"
              : "Deleted"
          }`,
          message: `A legal compliance item "${compliance.title}" has been ${action}. Full system oversight required.`,
          data: {
            complianceId: compliance._id,
            actionUrl: `/dashboard/modules/legal/compliance`,
            priority: "high",
          },
        });
        if (notification) notifications.push(notification);
        console.log(
          `📧 [LEGAL COMPLIANCE] Notified Super Admin: ${superAdmin.firstName} ${superAdmin.lastName}`
        );
      } else {
        console.log(
          `📧 [LEGAL COMPLIANCE] Super Admin is the creator - skipped generic notification (already got personal notification)`
        );
      }
    } else {
      console.log(`❌ [LEGAL COMPLIANCE] No Super Admin found`);
    }

    console.log(
      `📧 [LEGAL COMPLIANCE] Sent ${notifications.length} notifications for ${action} compliance: ${compliance.title}`
    );
    return notifications;
  } catch (error) {
    console.error("Error sending legal compliance notifications:", error);
    throw error;
  }
};
