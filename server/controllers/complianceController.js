import Compliance from "../models/Compliance.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import NotificationService from "../services/notificationService.js";

// Create a new compliance item
export const createCompliance = async (req, res) => {
  try {
    const {
      title,
      category,
      status,
      priority,
      dueDate,
      nextAudit,
      description,
      requirements,
      findings,
      attachments,
    } = req.body;

    // Check if user has permission (HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only HOD and Super Admin can create compliance items.",
      });
    }

    const compliance = await Compliance.create({
      title,
      category,
      status,
      priority,
      dueDate,
      nextAudit,
      description,
      requirements,
      findings,
      createdBy: req.user._id,
      attachments: attachments || [],
    });

    const populatedCompliance = await Compliance.findById(
      compliance._id
    ).populate("createdBy", "firstName lastName email");

    // Send notifications for compliance creation
    try {
      const notificationService = new NotificationService();
      const notificationResult =
        await notificationService.sendComplianceNotification(
          populatedCompliance,
          "created",
          req.user
        );

      console.log(
        `✅ [COMPLIANCE] Notifications sent: ${notificationResult.successful} successful, ${notificationResult.failed} failed`
      );
    } catch (notificationError) {
      console.error(
        "❌ [COMPLIANCE] Notification error:",
        notificationError.message
      );
    }

    res.status(201).json({
      success: true,
      data: populatedCompliance,
      message: "Compliance item created successfully",
    });
  } catch (error) {
    console.error("Create compliance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create compliance item",
    });
  }
};

// Get all compliance items with filtering and pagination
export const getComplianceItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      search,
    } = req.query;

    const query = { isActive: true };

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

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const complianceItems = await Compliance.find(query)
      .populate("createdBy", "firstName lastName email")
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
      message: "Compliance items retrieved successfully",
    });
  } catch (error) {
    console.error("Get compliance items error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch compliance items",
    });
  }
};

// Get compliance item by ID
export const getComplianceById = async (req, res) => {
  try {
    const { id } = req.params;

    const compliance = await Compliance.findOne({
      _id: id,
      isActive: true,
    }).populate("createdBy", "firstName lastName email");

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: "Compliance item not found",
      });
    }

    res.json({
      success: true,
      data: compliance,
      message: "Compliance item retrieved successfully",
    });
  } catch (error) {
    console.error("Get compliance by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch compliance item",
    });
  }
};

// Update compliance item
export const updateCompliance = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user has permission (HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only HOD and Super Admin can update compliance items.",
      });
    }

    const compliance = await Compliance.findOne({ _id: id, isActive: true });

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: "Compliance item not found",
      });
    }

    const updatedCompliance = await Compliance.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("createdBy", "firstName lastName email");

    try {
      const notificationService = new NotificationService();
      const notificationResult =
        await notificationService.sendComplianceNotification(
          updatedCompliance,
          "updated",
          req.user
        );

      console.log(
        `✅ [COMPLIANCE] Update notifications sent: ${notificationResult.successful} successful, ${notificationResult.failed} failed`
      );
    } catch (notificationError) {
      console.error(
        "❌ [COMPLIANCE] Update notification error:",
        notificationError.message
      );
    }

    res.json({
      success: true,
      data: updatedCompliance,
      message: "Compliance item updated successfully",
    });
  } catch (error) {
    console.error("Update compliance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update compliance item",
    });
  }
};

// Delete compliance item (soft delete)
export const deleteCompliance = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has permission (Super Admin only)
    if (req.user.role.level < 1000) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admin can delete compliance items.",
      });
    }

    const compliance = await Compliance.findOne({ _id: id, isActive: true });

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: "Compliance item not found",
      });
    }

    // Soft delete
    compliance.isActive = false;
    await compliance.save();

    try {
      const notificationService = new NotificationService();

      // Only notify the creator (if they're not the one deleting)
      if (compliance.createdBy.toString() !== req.user._id.toString()) {
        await notificationService.createNotification({
          recipient: compliance.createdBy,
          type: "COMPLIANCE_DELETED",
          title: "🗑️ Compliance Item Deleted",
          message: `Your compliance item "${compliance.title}" (${compliance.category}) has been deleted by ${req.user.firstName} ${req.user.lastName}.`,
          priority: "high",
          data: {
            complianceId: compliance._id,
            complianceTitle: compliance.title,
            complianceCategory: compliance.category,
            deletedBy: req.user._id,
            actionUrl: `/dashboard/modules/hr/compliance`,
          },
        });

        console.log("✅ [COMPLIANCE] Deletion notification sent to creator");
      }
    } catch (notificationError) {
      console.error(
        "❌ [COMPLIANCE] Deletion notification error:",
        notificationError.message
      );
    }

    res.json({
      success: true,
      message: "Compliance item deleted successfully",
    });
  } catch (error) {
    console.error("Delete compliance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete compliance item",
    });
  }
};

// Get compliance statistics
export const getComplianceStats = async (req, res) => {
  try {
    const stats = await Compliance.getStats();

    res.json({
      success: true,
      data: stats,
      message: "Compliance statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Get compliance stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch compliance statistics",
    });
  }
};

// Get overdue compliance items
export const getOverdueItems = async (req, res) => {
  try {
    const overdueItems = await Compliance.getOverdueItems();

    res.json({
      success: true,
      data: overdueItems,
      message: "Overdue compliance items retrieved successfully",
    });
  } catch (error) {
    console.error("Get overdue items error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch overdue compliance items",
    });
  }
};

// Get due soon compliance items
export const getDueSoonItems = async (req, res) => {
  try {
    const dueSoonItems = await Compliance.getDueSoonItems();

    res.json({
      success: true,
      data: dueSoonItems,
      message: "Due soon compliance items retrieved successfully",
    });
  } catch (error) {
    console.error("Get due soon items error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch due soon compliance items",
    });
  }
};

// Update audit dates
export const updateAuditDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { lastAudit, nextAudit } = req.body;

    // Check if user has permission (HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only HOD and Super Admin can update audit dates.",
      });
    }

    const compliance = await Compliance.findOne({ _id: id, isActive: true });

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: "Compliance item not found",
      });
    }

    await compliance.updateAuditDates(lastAudit, nextAudit);

    const updatedCompliance = await Compliance.findById(id).populate(
      "createdBy",
      "firstName lastName email"
    );

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
